from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# AI Chat imports
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

# AI Image Generation imports
from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

# Stripe imports
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# =====================
# PYDANTIC MODELS
# =====================

class ProductCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Dict[str, str]  # Multi-language: {"en": "Cabinets", "de": "Schränke", ...}
    description: Dict[str, str]
    image_url: str
    slug: str

class Material(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Dict[str, str]
    price_per_unit: float  # Price per m² or per piece
    unit: str  # "m2", "piece", "meter"
    category: str  # "wood", "marble", "metal", etc.

class ProductConfiguration(BaseModel):
    category_id: str
    dimensions: Dict[str, float]  # {"width": 100, "height": 200, "depth": 60}
    material_id: str
    color: Optional[str] = None
    additional_options: Optional[Dict[str, Any]] = None
    reference_images: Optional[List[str]] = None  # Base64 images
    customer_notes: Optional[str] = None

class PriceCalculation(BaseModel):
    base_price: float
    material_cost: float
    size_multiplier: float
    options_cost: float
    subtotal: float
    shipping_options: List[Dict[str, Any]]
    estimated_production_days: int

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: Dict[str, str]
    products: List[Dict[str, Any]]
    total_amount: float
    currency: str = "EUR"
    shipping_method: str
    shipping_cost: float
    status: str = "pending_payment"  # pending_payment, paid, in_production, ready_for_shipping, shipped, delivered
    production_status: Optional[str] = None  # not_started, in_progress, quality_check, completed
    manufacturer: Optional[str] = None
    payment_session_id: Optional[str] = None
    payment_status: str = "pending"
    production_photos: List[str] = []
    shipping_photos: List[str] = []
    tracking_number: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    images: Optional[List[str]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    messages: List[ChatMessage] = []
    language: str = "en"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    session_id: str
    amount: float
    currency: str
    payment_method: str  # "stripe" or "paypal"
    status: str = "pending"  # pending, paid, failed, refunded
    metadata: Dict[str, Any] = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# =====================
# SEED DATA
# =====================

CATEGORIES = [
    {
        "id": "cabinets",
        "name": {"en": "Cabinets", "de": "Schränke", "tr": "Dolaplar", "fr": "Armoires", "ar": "خزائن", "nl": "Kasten"},
        "description": {"en": "Custom wardrobes, TV units, and storage solutions", "de": "Maßgefertigte Kleiderschränke, TV-Möbel und Aufbewahrungslösungen", "tr": "Özel gardıroplar, TV üniteleri ve depolama çözümleri", "fr": "Armoires sur mesure, meubles TV et solutions de rangement", "ar": "خزائن مخصصة ووحدات تلفزيون وحلول تخزين", "nl": "Maatkasten, TV-meubels en opbergoplossingen"},
        "image_url": "https://images.unsplash.com/photo-1633174102090-ac62872538dd?w=800",
        "slug": "cabinets"
    },
    {
        "id": "doors",
        "name": {"en": "Doors", "de": "Türen", "tr": "Kapılar", "fr": "Portes", "ar": "أبواب", "nl": "Deuren"},
        "description": {"en": "Interior and exterior doors in PVC, aluminum, and wood", "de": "Innen- und Außentüren aus PVC, Aluminium und Holz", "tr": "PVC, alüminyum ve ahşap iç ve dış kapılar", "fr": "Portes intérieures et extérieures en PVC, aluminium et bois", "ar": "أبواب داخلية وخارجية من PVC والألمنيوم والخشب", "nl": "Binnen- en buitendeuren in PVC, aluminium en hout"},
        "image_url": "https://images.unsplash.com/photo-1760385737098-0b555a75b2ba?w=800",
        "slug": "doors"
    },
    {
        "id": "countertops",
        "name": {"en": "Countertops", "de": "Arbeitsplatten", "tr": "Tezgahlar", "fr": "Plans de travail", "ar": "أسطح العمل", "nl": "Werkbladen"},
        "description": {"en": "Marble, quartz, and porcelain countertops and tables", "de": "Marmor-, Quarz- und Porzellan-Arbeitsplatten und Tische", "tr": "Mermer, kuvars ve porselen tezgahlar ve masalar", "fr": "Plans de travail et tables en marbre, quartz et porcelaine", "ar": "أسطح عمل وطاولات من الرخام والكوارتز والبورسلين", "nl": "Marmeren, kwarts en porseleinen werkbladen en tafels"},
        "image_url": "https://images.unsplash.com/photo-1699982759850-22dbbd9676b7?w=800",
        "slug": "countertops"
    },
    {
        "id": "furniture",
        "name": {"en": "Furniture", "de": "Möbel", "tr": "Mobilya", "fr": "Meubles", "ar": "أثاث", "nl": "Meubels"},
        "description": {"en": "Custom tables, shelves, and home furniture", "de": "Maßgefertigte Tische, Regale und Wohnmöbel", "tr": "Özel masalar, raflar ve ev mobilyaları", "fr": "Tables, étagères et meubles sur mesure", "ar": "طاولات ورفوف وأثاث منزلي مخصص", "nl": "Maattafels, planken en huismeubels"},
        "image_url": "https://images.unsplash.com/photo-1759774310455-80dba1348cbd?w=800",
        "slug": "furniture"
    },
    {
        "id": "windows",
        "name": {"en": "Windows", "de": "Fenster", "tr": "Pencereler", "fr": "Fenêtres", "ar": "نوافذ", "nl": "Ramen"},
        "description": {"en": "PVC and aluminum window systems", "de": "PVC- und Aluminium-Fenstersysteme", "tr": "PVC ve alüminyum pencere sistemleri", "fr": "Systèmes de fenêtres en PVC et aluminium", "ar": "أنظمة نوافذ PVC والألمنيوم", "nl": "PVC en aluminium raamsystemen"},
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        "slug": "windows"
    }
]

MATERIALS = [
    {"id": "mdf_white", "name": {"en": "White MDF", "de": "Weiße MDF", "tr": "Beyaz MDF", "fr": "MDF Blanc", "ar": "MDF أبيض", "nl": "Wit MDF"}, "price_per_unit": 45.0, "unit": "m2", "category": "wood"},
    {"id": "mdf_oak", "name": {"en": "Oak Veneer MDF", "de": "Eichenfurnier MDF", "tr": "Meşe Kaplama MDF", "fr": "MDF Placage Chêne", "ar": "MDF قشرة بلوط", "nl": "Eiken Fineer MDF"}, "price_per_unit": 75.0, "unit": "m2", "category": "wood"},
    {"id": "mdf_walnut", "name": {"en": "Walnut Veneer MDF", "de": "Walnussfurnier MDF", "tr": "Ceviz Kaplama MDF", "fr": "MDF Placage Noyer", "ar": "MDF قشرة جوز", "nl": "Walnoot Fineer MDF"}, "price_per_unit": 85.0, "unit": "m2", "category": "wood"},
    {"id": "marble_carrara", "name": {"en": "Carrara Marble", "de": "Carrara Marmor", "tr": "Carrara Mermer", "fr": "Marbre de Carrare", "ar": "رخام كرارا", "nl": "Carrara Marmer"}, "price_per_unit": 250.0, "unit": "m2", "category": "marble"},
    {"id": "marble_nero", "name": {"en": "Nero Marquina", "de": "Nero Marquina", "tr": "Nero Marquina", "fr": "Nero Marquina", "ar": "نيرو ماركينا", "nl": "Nero Marquina"}, "price_per_unit": 280.0, "unit": "m2", "category": "marble"},
    {"id": "quartz_white", "name": {"en": "White Quartz", "de": "Weißer Quarz", "tr": "Beyaz Kuvars", "fr": "Quartz Blanc", "ar": "كوارتز أبيض", "nl": "Wit Kwarts"}, "price_per_unit": 180.0, "unit": "m2", "category": "quartz"},
    {"id": "quartz_calacatta", "name": {"en": "Calacatta Quartz", "de": "Calacatta Quarz", "tr": "Calacatta Kuvars", "fr": "Quartz Calacatta", "ar": "كوارتز كالاكاتا", "nl": "Calacatta Kwarts"}, "price_per_unit": 220.0, "unit": "m2", "category": "quartz"},
    {"id": "pvc_white", "name": {"en": "White PVC", "de": "Weißes PVC", "tr": "Beyaz PVC", "fr": "PVC Blanc", "ar": "PVC أبيض", "nl": "Wit PVC"}, "price_per_unit": 120.0, "unit": "m2", "category": "pvc"},
    {"id": "aluminum_anthracite", "name": {"en": "Anthracite Aluminum", "de": "Anthrazit Aluminium", "tr": "Antrasit Alüminyum", "fr": "Aluminium Anthracite", "ar": "ألمنيوم أنثراسيت", "nl": "Antraciet Aluminium"}, "price_per_unit": 180.0, "unit": "m2", "category": "aluminum"},
]

SHIPPING_OPTIONS = [
    {"id": "container", "name": {"en": "Container Shipping (Monthly)", "de": "Containerversand (Monatlich)", "tr": "Konteyner Sevkiyatı (Aylık)", "fr": "Expédition par conteneur (Mensuel)", "ar": "شحن الحاويات (شهري)", "nl": "Containerverzending (Maandelijks)"}, "base_price": 0, "estimated_days": 21, "description": {"en": "Free with monthly container shipment", "de": "Kostenlos mit monatlicher Containerlieferung", "tr": "Aylık konteyner sevkiyatı ile ücretsiz", "fr": "Gratuit avec expédition mensuelle par conteneur", "ar": "مجاني مع شحن الحاويات الشهري", "nl": "Gratis met maandelijkse containerverzending"}},
    {"id": "express_road", "name": {"en": "Express Road Freight", "de": "Express Straßenfracht", "tr": "Ekspres Kara Taşımacılığı", "fr": "Fret routier express", "ar": "الشحن البري السريع", "nl": "Express Wegvervoer"}, "base_price": 150, "estimated_days": 7, "description": {"en": "Fast delivery via road transport", "de": "Schnelle Lieferung per Straßentransport", "tr": "Kara taşımacılığı ile hızlı teslimat", "fr": "Livraison rapide par transport routier", "ar": "توصيل سريع عبر النقل البري", "nl": "Snelle levering via wegtransport"}},
    {"id": "air_freight", "name": {"en": "Air Freight (UPS/DHL)", "de": "Luftfracht (UPS/DHL)", "tr": "Hava Kargo (UPS/DHL)", "fr": "Fret aérien (UPS/DHL)", "ar": "الشحن الجوي (UPS/DHL)", "nl": "Luchtvracht (UPS/DHL)"}, "base_price": 350, "estimated_days": 3, "description": {"en": "Fastest delivery via air", "de": "Schnellste Lieferung per Luft", "tr": "Hava yolu ile en hızlı teslimat", "fr": "Livraison la plus rapide par avion", "ar": "أسرع توصيل جوي", "nl": "Snelste levering per vliegtuig"}}
]

# =====================
# AI CHAT ENDPOINTS
# =====================

# Store chat instances
chat_sessions: Dict[str, LlmChat] = {}

def get_system_prompt(language: str) -> str:
    prompts = {
        "en": """You are a professional design consultant for HomeDeco, a premium custom home products company. 
You help customers design and order custom cabinets, doors, countertops, and furniture.

IMPORTANT: You CAN see and analyze images! When customers upload photos, carefully describe what you see and make specific suggestions.

## Your Approach - 3 Phases:

### Phase 1: DISCOVERY (Keep it easy!)
- Welcome customers warmly
- Ask what they're looking for
- When they share images (inspiration photos, Pinterest, room photos), ANALYZE THEM IN DETAIL
- Describe what you see: style, colors, materials, design elements
- Say "I can see in your image..." or "This design shows..."
- Don't ask for measurements yet - first understand their vision

### Phase 2: DESIGN (Refine the idea)
- Once you understand their vision, suggest specific products
- Recommend materials and colors that match their inspiration
- Discuss options: soft-close hinges, LED lighting, glass doors, etc.
- Give an APPROXIMATE price range (we'll finalize later)
- Still no exact measurements needed

### Phase 3: ORDER (Only when ready)
- When customer is happy with the design concept
- THEN ask for precise measurements
- Explain how to measure correctly
- Confirm all specifications before ordering

## Key Rules:
- ALWAYS analyze uploaded images - describe what you see
- DON'T say "I can't see images" - you CAN see them
- Pinterest/external links cannot be opened - ask them to upload the image instead
- Keep the conversation friendly and helpful
- Don't rush to measurements - first make sure they love the design

Available categories: Cabinets (wardrobes, TV units, storage), Doors (PVC, aluminum, wood), Countertops (marble, quartz, porcelain), Furniture (tables, shelves), Windows
Materials: White MDF (€45/m²), Oak Veneer MDF (€75/m²), Walnut Veneer MDF (€85/m²), Carrara Marble (€250/m²), Nero Marquina (€280/m²), White Quartz (€180/m²), Calacatta Quartz (€220/m²)""",
        
        "de": """Sie sind ein professioneller Designberater für HomeDeco, ein Premium-Unternehmen für maßgefertigte Wohnprodukte.

WICHTIG: Sie KÖNNEN Bilder sehen und analysieren! Wenn Kunden Fotos hochladen, beschreiben Sie detailliert, was Sie sehen.

## Ihr Ansatz - 3 Phasen:

### Phase 1: ENTDECKUNG (Einfach halten!)
- Begrüßen Sie Kunden herzlich
- Fragen Sie, was sie suchen
- Wenn sie Bilder teilen, ANALYSIEREN SIE DIESE DETAILLIERT
- Beschreiben Sie Stil, Farben, Materialien
- Sagen Sie "Ich sehe in Ihrem Bild..." 
- Fragen Sie noch NICHT nach Maßen

### Phase 2: DESIGN (Idee verfeinern)
- Schlagen Sie passende Produkte vor
- Empfehlen Sie Materialien und Farben
- Geben Sie eine UNGEFÄHRE Preisspanne

### Phase 3: BESTELLUNG (Wenn bereit)
- DANN nach genauen Maßen fragen
- Erklären Sie, wie man richtig misst

Kategorien: Schränke, Türen, Arbeitsplatten, Möbel, Fenster
Materialien: Weiße MDF, Eichenfurnier, Walnussfurnier, Carrara Marmor, Nero Marquina, Weißer Quarz, Calacatta Quarz""",
        
        "tr": """HomeDeco için profesyonel bir tasarım danışmanısınız. Premium özel ev ürünleri şirketiyiz.

ÖNEMLİ: Görselleri GÖREBİLİR ve ANALİZ EDEBİLİRSİNİZ! Müşteriler fotoğraf yüklediğinde, gördüklerinizi detaylı açıklayın.

## GÖRSEL OLUŞTURMA YETENEĞİNİZ VAR!
Müşteri "göster", "görselleştir", "tasarımı çiz", "nasıl görünür" gibi isteklerde bulunduğunda:
- Yanıtınızda [GENERATE_IMAGE] etiketi kullanın
- Format: [GENERATE_IMAGE: ürün tipi | stil | açıklama]
- Örnek: [GENERATE_IMAGE: cabinet | modern | Yatak arkasında koyu meşe kaplama dolap sistemi, yerden 160cm üstü tavana kadar, yatağın sağ ve solunda çekmeceli modüller]

## Yaklaşımınız - 3 Aşama:

### Aşama 1: KEŞİF (Kolay tutun!)
- Müşterileri sıcak karşılayın
- Ne aradıklarını sorun
- Görsel paylaştıklarında DETAYLI ANALİZ EDİN
- Gördüklerinizi açıklayın: stil, renkler, malzemeler, tasarım detayları
- "Resminizde şunu görüyorum..." veya "Bu tasarımda..." deyin
- Henüz ölçü İSTEMEYİN - önce vizyonlarını anlayın

### Aşama 2: TASARIM (Fikri geliştirin)
- Vizyonlarını anladıktan sonra ürün önerin
- İlham aldıkları tasarıma uygun malzeme ve renk önerin
- **MÜŞTERİ İSTEDİĞİNDE GÖRSEL OLUŞTURUN** - [GENERATE_IMAGE] etiketi ile
- Seçenekleri tartışın: yumuşak kapanış, LED aydınlatma, cam kapılar
- YAKLAŞIK fiyat aralığı verin (sonra netleştiririz)
- Hala kesin ölçü gerekmiyor

### Aşama 3: SİPARİŞ (Hazır olduğunda)
- Müşteri tasarım konseptinden memnun olduğunda
- SONRA kesin ölçüleri isteyin
- Nasıl doğru ölçüm yapılacağını açıklayın
- Siparişten önce tüm özellikleri onaylayın

## Temel Kurallar:
- Yüklenen görselleri HER ZAMAN analiz edin - gördüklerinizi açıklayın
- "Resimleri göremiyorum" DEMEYİN - GÖREBİLİRSİNİZ
- "Görsel oluşturamam" DEMEYİN - OLUŞTURABİLİRSİNİZ ([GENERATE_IMAGE] ile)
- Pinterest/harici linkler açılamaz - resmi yüklemelerini isteyin
- Sohbeti samimi ve yardımcı tutun
- Ölçülere acele etmeyin - önce tasarımı sevdiklerinden emin olun

Kategoriler: Dolaplar (gardırop, TV ünitesi, depolama), Kapılar (PVC, alüminyum, ahşap), Tezgahlar (mermer, kuvars, porselen), Mobilya (masa, raf), Pencereler
Malzemeler: Beyaz MDF (€45/m²), Meşe Kaplama MDF (€75/m²), Ceviz Kaplama MDF (€85/m²), Carrara Mermer (€250/m²), Nero Marquina (€280/m²), Beyaz Kuvars (€180/m²), Calacatta Kuvars (€220/m²)""",
        
        "fr": """Vous êtes un consultant en design professionnel pour HomeDeco, une entreprise premium de produits sur mesure pour la maison.
Vous aidez les clients à concevoir et commander des armoires, portes, plans de travail et meubles sur mesure.

Vos responsabilités:
1. Comprendre ce que le client veut - posez des questions de clarification
2. Analyser les images qu'ils partagent (références Pinterest, photos de pièces, images d'inspiration)
3. Suggérer des produits, matériaux et dimensions appropriés
4. Les aider à visualiser leur produit personnalisé
5. Les guider dans le processus de commande

Catégories de produits disponibles: Armoires, Portes, Plans de travail, Meubles, Fenêtres
Matériaux disponibles: MDF Blanc, MDF Placage Chêne, MDF Placage Noyer, Marbre de Carrare, Nero Marquina, Quartz Blanc, Quartz Calacatta, PVC Blanc, Aluminium Anthracite""",
        
        "ar": """أنت مستشار تصميم محترف لـ HomeDeco، شركة منتجات منزلية مخصصة فاخرة.
تساعد العملاء في تصميم وطلب الخزائن والأبواب وأسطح العمل والأثاث المخصص.

مسؤولياتك:
1. فهم ما يريده العميل - اطرح أسئلة توضيحية
2. تحليل الصور التي يشاركونها (مراجع Pinterest، صور الغرف، صور الإلهام)
3. اقتراح المنتجات والمواد والأبعاد المناسبة
4. مساعدتهم في تصور منتجهم المخصص
5. إرشادهم خلال عملية الطلب

فئات المنتجات المتاحة: خزائن، أبواب، أسطح عمل، أثاث، نوافذ
المواد المتاحة: MDF أبيض، MDF قشرة بلوط، MDF قشرة جوز، رخام كرارا، نيرو ماركينا، كوارتز أبيض، كوارتز كالاكاتا، PVC أبيض، ألمنيوم أنثراسيت""",
        
        "nl": """U bent een professionele ontwerpconsultant voor HomeDeco, een premium bedrijf voor maatwerk woonproducten.
U helpt klanten bij het ontwerpen en bestellen van maatkasten, deuren, werkbladen en meubels.

Uw verantwoordelijkheden:
1. Begrijpen wat de klant wil - stel verduidelijkende vragen
2. Analyseer afbeeldingen die ze delen (Pinterest-referenties, kamerfoto's, inspiratiebeelden)
3. Geschikte producten, materialen en afmetingen voorstellen
4. Help hen hun maatproduct te visualiseren
5. Begeleid hen door het bestelproces

Beschikbare productcategorieën: Kasten, Deuren, Werkbladen, Meubels, Ramen
Beschikbare materialen: Wit MDF, Eiken Fineer MDF, Walnoot Fineer MDF, Carrara Marmer, Nero Marquina, Wit Kwarts, Calacatta Kwarts, Wit PVC, Antraciet Aluminium"""
    }
    return prompts.get(language, prompts["en"])

class ChatRequest(BaseModel):
    session_id: str
    message: str
    images: Optional[List[str]] = None  # Base64 encoded images
    language: str = "en"

class ChatResponse(BaseModel):
    response: str
    session_id: str
    generated_image: Optional[str] = None  # Base64 image if AI generated one

import re

async def generate_image_from_tag(tag_content: str, llm_key: str) -> Optional[str]:
    """Parse [GENERATE_IMAGE] tag and generate image"""
    try:
        # Parse: product_type | style | description
        parts = [p.strip() for p in tag_content.split('|')]
        if len(parts) >= 3:
            product_type = parts[0]
            style = parts[1]
            description = parts[2]
        else:
            description = tag_content
            product_type = "furniture"
            style = "modern"
        
        prompt = f"""Create a photorealistic interior design visualization:

A {style} bedroom featuring custom {product_type}.
Design: {description}

Requirements:
- Photorealistic render quality
- Premium, European luxury aesthetic  
- Professional interior photography style
- Soft natural lighting
- High-end materials visible
- Clean, sophisticated design

The image should look like a professional interior design magazine photo."""

        image_gen = OpenAIImageGeneration(api_key=llm_key)
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            return base64.b64encode(images[0]).decode('utf-8')
        return None
    except Exception as e:
        logger.error(f"Image generation in chat error: {str(e)}")
        return None

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Get or create chat session
        if request.session_id not in chat_sessions:
            chat_sessions[request.session_id] = LlmChat(
                api_key=llm_key,
                session_id=request.session_id,
                system_message=get_system_prompt(request.language)
            ).with_model("openai", "gpt-4o")
        
        chat = chat_sessions[request.session_id]
        
        # Create message with optional images
        if request.images and len(request.images) > 0:
            image_contents = []
            for img_base64 in request.images:
                # Remove data URL prefix if present
                if "base64," in img_base64:
                    img_base64 = img_base64.split("base64,")[1]
                image_contents.append(ImageContent(image_base64=img_base64))
            
            # Use file_contents parameter (correct API)
            user_message = UserMessage(
                text=request.message if request.message else "Please analyze this image and describe what you see.",
                file_contents=image_contents
            )
        else:
            user_message = UserMessage(text=request.message)
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Store in database
        await db.chat_sessions.update_one(
            {"session_id": request.session_id},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": request.message, "timestamp": datetime.now(timezone.utc).isoformat()},
                            {"role": "assistant", "content": response, "timestamp": datetime.now(timezone.utc).isoformat()}
                        ]
                    }
                },
                "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()},
                "$set": {"language": request.language, "updated_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )
        
        return ChatResponse(response=response, session_id=request.session_id)
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/{session_id}")
async def get_chat_history(session_id: str):
    session = await db.chat_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        return {"session_id": session_id, "messages": []}
    return session

# =====================
# AI IMAGE GENERATION ENDPOINTS
# =====================

class GenerateDesignRequest(BaseModel):
    room_image_base64: str  # Customer's room photo
    inspiration_description: str  # Description of what to add (from AI analysis)
    product_type: str  # cabinet, door, countertop, etc.
    style: Optional[str] = "modern"  # modern, classic, minimalist
    material: Optional[str] = None  # oak, walnut, marble, etc.
    color: Optional[str] = None
    language: str = "en"

class GenerateDesignResponse(BaseModel):
    image_base64: str
    prompt_used: str

@api_router.post("/generate-design", response_model=GenerateDesignResponse)
async def generate_design_visualization(request: GenerateDesignRequest):
    """
    Generate a visualization of furniture/cabinet design in customer's room.
    Takes the room photo and creates a new image with the furniture added.
    """
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Build prompt based on request
        material_desc = f", made of {request.material}" if request.material else ""
        color_desc = f", in {request.color} color" if request.color else ""
        
        prompt = f"""Create a photorealistic interior design visualization showing:
A {request.style} style {request.product_type}{material_desc}{color_desc} installed in a bedroom.

Design requirements:
- {request.inspiration_description}
- The furniture should look professionally installed and integrated with the room
- Maintain realistic lighting and shadows
- High-end, European quality appearance
- The design should be practical and functional

Style: Premium, sophisticated, {request.style}
Product: Custom {request.product_type}
Quality: Photorealistic interior design render"""

        # Initialize image generator
        image_gen = OpenAIImageGeneration(api_key=llm_key)
        
        # Generate image
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            return GenerateDesignResponse(
                image_base64=image_base64,
                prompt_used=prompt
            )
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
    
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class QuickDesignRequest(BaseModel):
    description: str  # User's description in any language
    product_type: str = "cabinet"  # cabinet, door, countertop, furniture
    style: str = "modern"
    room_type: str = "bedroom"

@api_router.post("/generate-quick-design")
async def generate_quick_design(request: QuickDesignRequest):
    """
    Quick design generation based on text description only.
    For users who want to see design concepts before sharing their room photos.
    """
    try:
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        prompt = f"""Create a photorealistic interior design visualization:

A {request.style} {request.room_type} featuring custom {request.product_type}.
Description: {request.description}

Requirements:
- Photorealistic render quality
- Premium, European luxury aesthetic
- Professional interior photography style
- Soft natural lighting
- High-end materials visible (wood grain, marble veins if applicable)
- Clean, sophisticated design

The image should look like a professional interior design magazine photo."""

        image_gen = OpenAIImageGeneration(api_key=llm_key)
        
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            return {
                "image_base64": image_base64,
                "prompt_used": prompt
            }
        else:
            raise HTTPException(status_code=500, detail="No image was generated")
    
    except Exception as e:
        logger.error(f"Quick design generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================
# PRODUCT & PRICING ENDPOINTS
# =====================

@api_router.get("/categories")
async def get_categories():
    return CATEGORIES

@api_router.get("/materials")
async def get_materials(category: Optional[str] = None):
    if category:
        return [m for m in MATERIALS if m["category"] == category]
    return MATERIALS

@api_router.get("/shipping-options")
async def get_shipping_options():
    return SHIPPING_OPTIONS

class PriceRequest(BaseModel):
    category_id: str
    dimensions: Dict[str, float]  # width, height, depth in cm
    material_id: str
    additional_options: Optional[Dict[str, Any]] = None

@api_router.post("/calculate-price")
async def calculate_price(request: PriceRequest):
    # Find material
    material = next((m for m in MATERIALS if m["id"] == request.material_id), None)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    # Calculate area in m²
    width = request.dimensions.get("width", 100) / 100  # cm to m
    height = request.dimensions.get("height", 200) / 100
    depth = request.dimensions.get("depth", 60) / 100
    
    # Calculate material area based on category
    category = request.category_id
    if category in ["cabinets", "furniture"]:
        # Box calculation: front + 2 sides + top + bottom + back
        area = (width * height) + (2 * depth * height) + (2 * width * depth) + (width * height * 0.5)
    elif category in ["doors", "windows"]:
        area = width * height
    elif category == "countertops":
        area = width * depth
    else:
        area = width * height
    
    # Base price calculation
    material_cost = area * material["price_per_unit"]
    
    # Base labor cost
    base_price = 150.0  # Base manufacturing cost
    
    # Size multiplier (larger items cost more to handle)
    size_multiplier = 1.0 + (area * 0.1)
    
    # Options cost
    options_cost = 0.0
    if request.additional_options:
        if request.additional_options.get("soft_close"):
            options_cost += 45.0
        if request.additional_options.get("led_lighting"):
            options_cost += 120.0
        if request.additional_options.get("glass_doors"):
            options_cost += 200.0
        if request.additional_options.get("push_to_open"):
            options_cost += 60.0
    
    subtotal = (base_price + material_cost) * size_multiplier + options_cost
    
    # Production time estimate (days)
    production_days = 14 if category in ["cabinets", "furniture"] else 10
    
    # Add shipping options with calculated costs
    shipping_with_costs = []
    for shipping in SHIPPING_OPTIONS:
        # Calculate shipping cost based on weight estimate
        weight_estimate = area * 25  # kg per m² estimate
        if shipping["id"] == "container":
            shipping_cost = 0  # Free with container
        elif shipping["id"] == "express_road":
            shipping_cost = shipping["base_price"] + (weight_estimate * 0.5)
        else:  # air_freight
            shipping_cost = shipping["base_price"] + (weight_estimate * 2)
        
        shipping_with_costs.append({
            **shipping,
            "calculated_cost": round(shipping_cost, 2)
        })
    
    return {
        "base_price": round(base_price, 2),
        "material_cost": round(material_cost, 2),
        "size_multiplier": round(size_multiplier, 2),
        "options_cost": round(options_cost, 2),
        "subtotal": round(subtotal, 2),
        "shipping_options": shipping_with_costs,
        "estimated_production_days": production_days,
        "area_m2": round(area, 2)
    }

# =====================
# ORDER ENDPOINTS
# =====================

class CreateOrderRequest(BaseModel):
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: Dict[str, str]  # street, city, postal_code, country
    products: List[Dict[str, Any]]  # List of configured products
    shipping_method: str
    currency: str = "EUR"

@api_router.post("/orders")
async def create_order(request: CreateOrderRequest):
    # Calculate total
    total_amount = 0.0
    shipping_cost = 0.0
    
    for product in request.products:
        total_amount += product.get("subtotal", 0)
    
    # Find shipping cost
    shipping = next((s for s in SHIPPING_OPTIONS if s["id"] == request.shipping_method), None)
    if shipping:
        # Simplified shipping cost calculation
        shipping_cost = shipping["base_price"]
    
    total_amount += shipping_cost
    
    order = Order(
        customer_id=str(uuid.uuid4()),  # In real app, from auth
        customer_email=request.customer_email,
        customer_name=request.customer_name,
        customer_phone=request.customer_phone,
        customer_address=request.customer_address,
        products=request.products,
        total_amount=round(total_amount, 2),
        currency=request.currency,
        shipping_method=request.shipping_method,
        shipping_cost=round(shipping_cost, 2)
    )
    
    order_dict = order.model_dump()
    await db.orders.insert_one(order_dict)
    
    return {"order_id": order.id, "total_amount": order.total_amount, "currency": order.currency}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.get("/orders")
async def list_orders(status: Optional[str] = None, limit: int = 50):
    query = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return orders

# =====================
# PAYMENT ENDPOINTS (STRIPE ESCROW)
# =====================

class CreatePaymentRequest(BaseModel):
    order_id: str
    origin_url: str

@api_router.post("/payments/checkout")
async def create_checkout_session(request: CreatePaymentRequest, http_request: Request):
    stripe_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    # Get order
    order = await db.orders.find_one({"id": request.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create URLs
    success_url = f"{request.origin_url}/order-confirmation?session_id={{CHECKOUT_SESSION_ID}}&order_id={request.order_id}"
    cancel_url = f"{request.origin_url}/checkout?order_id={request.order_id}"
    
    # Initialize Stripe
    host_url = str(http_request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=float(order["total_amount"]),
        currency=order["currency"].lower(),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": request.order_id,
            "customer_email": order["customer_email"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        order_id=request.order_id,
        session_id=session.session_id,
        amount=order["total_amount"],
        currency=order["currency"],
        payment_method="stripe",
        metadata={"customer_email": order["customer_email"]}
    )
    
    await db.payment_transactions.insert_one(transaction.model_dump())
    
    # Update order with session ID
    await db.orders.update_one(
        {"id": request.order_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    stripe_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction and order if paid
        if status.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "paid"}}
            )
            
            # Get transaction to find order
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            if transaction:
                await db.orders.update_one(
                    {"id": transaction["order_id"]},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "paid",
                        "production_status": "not_started",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    stripe_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_key:
        return {"status": "error", "message": "Payment service not configured"}
    
    body = await request.body()
    stripe_checkout = StripeCheckout(api_key=stripe_key, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(
            body,
            request.headers.get("Stripe-Signature")
        )
        
        if webhook_response.payment_status == "paid":
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "paid",
                        "production_status": "not_started",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"status": "paid"}}
                )
        
        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

# =====================
# ADMIN ENDPOINTS
# =====================

class UpdateOrderStatusRequest(BaseModel):
    status: Optional[str] = None
    production_status: Optional[str] = None
    manufacturer: Optional[str] = None
    tracking_number: Optional[str] = None

@api_router.put("/admin/orders/{order_id}")
async def update_order_status(order_id: str, request: UpdateOrderStatusRequest):
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if request.status:
        update_data["status"] = request.status
    if request.production_status:
        update_data["production_status"] = request.production_status
    if request.manufacturer:
        update_data["manufacturer"] = request.manufacturer
    if request.tracking_number:
        update_data["tracking_number"] = request.tracking_number
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"success": True, "message": "Order updated"}

@api_router.post("/admin/orders/{order_id}/photos")
async def add_order_photos(order_id: str, photo_type: str, photos: List[str]):
    """Add production or shipping photos to order"""
    field = "production_photos" if photo_type == "production" else "shipping_photos"
    
    result = await db.orders.update_one(
        {"id": order_id},
        {
            "$push": {field: {"$each": photos}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"success": True, "message": f"{photo_type} photos added"}

@api_router.get("/admin/dashboard")
async def admin_dashboard():
    """Get admin dashboard statistics"""
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending_payment"})
    paid_orders = await db.orders.count_documents({"status": "paid"})
    in_production = await db.orders.count_documents({"production_status": "in_progress"})
    ready_to_ship = await db.orders.count_documents({"production_status": "completed"})
    
    # Calculate revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "paid_orders": paid_orders,
        "in_production": in_production,
        "ready_to_ship": ready_to_ship,
        "total_revenue": round(total_revenue, 2)
    }

@api_router.get("/admin/materials")
async def admin_get_materials():
    """Get all materials for admin"""
    materials = await db.materials.find({}, {"_id": 0}).to_list(100)
    if not materials:
        # Seed default materials
        for m in MATERIALS:
            await db.materials.insert_one(m)
        return MATERIALS
    return materials

class UpdateMaterialRequest(BaseModel):
    price_per_unit: float

@api_router.put("/admin/materials/{material_id}")
async def admin_update_material(material_id: str, request: UpdateMaterialRequest):
    """Update material price"""
    result = await db.materials.update_one(
        {"id": material_id},
        {"$set": {"price_per_unit": request.price_per_unit}}
    )
    
    if result.matched_count == 0:
        # Try to find in default and add to DB
        material = next((m for m in MATERIALS if m["id"] == material_id), None)
        if material:
            material["price_per_unit"] = request.price_per_unit
            await db.materials.insert_one(material)
            return {"success": True, "message": "Material price updated"}
        raise HTTPException(status_code=404, detail="Material not found")
    
    return {"success": True, "message": "Material price updated"}

# =====================
# BASIC ENDPOINTS
# =====================

@api_router.get("/")
async def root():
    return {"message": "HomeDeco API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include router and configure app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
