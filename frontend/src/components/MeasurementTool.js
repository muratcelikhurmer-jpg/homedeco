import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, RotateCcw, Check, X, Ruler, Move } from 'lucide-react';

// Standart referans ölçüleri (cm)
const REFERENCE_OBJECTS = {
  door: { 
    name: { en: "Standard Door", de: "Standardtür", tr: "Standart Kapı", fr: "Porte Standard", ar: "باب قياسي", nl: "Standaard Deur" },
    height: 200, 
    width: 80,
    description: { en: "Standard interior door (200cm)", de: "Standard-Innentür (200cm)", tr: "Standart iç kapı (200cm)", fr: "Porte intérieure standard (200cm)", ar: "باب داخلي قياسي (200 سم)", nl: "Standaard binnendeur (200cm)" }
  },
  single_bed: { 
    name: { en: "Single Bed", de: "Einzelbett", tr: "Tek Kişilik Yatak", fr: "Lit Simple", ar: "سرير مفرد", nl: "Eenpersoonsbed" },
    height: 50, 
    width: 90,
    length: 190,
    description: { en: "Single bed (90x190cm)", de: "Einzelbett (90x190cm)", tr: "Tek kişilik yatak (90x190cm)", fr: "Lit simple (90x190cm)", ar: "سرير مفرد (90×190 سم)", nl: "Eenpersoonsbed (90x190cm)" }
  },
  double_bed: { 
    name: { en: "Double Bed", de: "Doppelbett", tr: "Çift Kişilik Yatak", fr: "Lit Double", ar: "سرير مزدوج", nl: "Tweepersoonsbed" },
    height: 50, 
    width: 160,
    length: 200,
    description: { en: "Double bed (160x200cm)", de: "Doppelbett (160x200cm)", tr: "Çift kişilik yatak (160x200cm)", fr: "Lit double (160x200cm)", ar: "سرير مزدوج (160×200 سم)", nl: "Tweepersoonsbed (160x200cm)" }
  },
  king_bed: { 
    name: { en: "King Size Bed", de: "King-Size-Bett", tr: "King Size Yatak", fr: "Lit King Size", ar: "سرير كينغ", nl: "Kingsize Bed" },
    height: 50, 
    width: 180,
    length: 200,
    description: { en: "King size bed (180x200cm)", de: "King-Size-Bett (180x200cm)", tr: "King size yatak (180x200cm)", fr: "Lit king size (180x200cm)", ar: "سرير كينغ (180×200 سم)", nl: "Kingsize bed (180x200cm)" }
  },
  window_standard: { 
    name: { en: "Standard Window", de: "Standardfenster", tr: "Standart Pencere", fr: "Fenêtre Standard", ar: "نافذة قياسية", nl: "Standaard Raam" },
    height: 120, 
    width: 100,
    description: { en: "Standard window (100x120cm)", de: "Standardfenster (100x120cm)", tr: "Standart pencere (100x120cm)", fr: "Fenêtre standard (100x120cm)", ar: "نافذة قياسية (100×120 سم)", nl: "Standaard raam (100x120cm)" }
  },
  a4_paper: { 
    name: { en: "A4 Paper", de: "A4 Papier", tr: "A4 Kağıt", fr: "Papier A4", ar: "ورق A4", nl: "A4 Papier" },
    height: 29.7, 
    width: 21,
    description: { en: "A4 paper sheet (21x29.7cm)", de: "A4 Papierblatt (21x29,7cm)", tr: "A4 kağıt (21x29.7cm)", fr: "Feuille A4 (21x29,7cm)", ar: "ورقة A4 (21×29.7 سم)", nl: "A4 papier (21x29,7cm)" }
  }
};

const MEASUREMENT_TEXTS = {
  en: {
    title: "Room Measurement",
    step1: "Step 1: Take a Photo",
    step1Desc: "Take a photo of the wall you want to measure",
    step2: "Step 2: Select Reference",
    step2Desc: "Select an object in the photo with known size",
    step3: "Step 3: Mark Reference",
    step3Desc: "Draw a line on the reference object (height or width)",
    step4: "Step 4: Mark Measurement",
    step4Desc: "Now draw a line on what you want to measure",
    takePhoto: "Take Photo",
    retake: "Retake",
    markReference: "Mark the reference object",
    markMeasurement: "Mark what to measure",
    calculate: "Calculate",
    result: "Estimated measurement",
    useResult: "Use This Measurement",
    cancel: "Cancel",
    referenceDirection: "Reference direction",
    height: "Height",
    width: "Width",
    accuracy: "Accuracy: ±5-10%",
    tip: "Tip: For best results, take the photo straight-on, not at an angle"
  },
  tr: {
    title: "Oda Ölçümü",
    step1: "Adım 1: Fotoğraf Çek",
    step1Desc: "Ölçmek istediğiniz duvarın fotoğrafını çekin",
    step2: "Adım 2: Referans Seç",
    step2Desc: "Fotoğraftaki bilinen ölçüdeki bir nesneyi seçin",
    step3: "Adım 3: Referansı İşaretle",
    step3Desc: "Referans nesne üzerine bir çizgi çizin (yükseklik veya genişlik)",
    step4: "Adım 4: Ölçümü İşaretle",
    step4Desc: "Şimdi ölçmek istediğiniz yere bir çizgi çizin",
    takePhoto: "Fotoğraf Çek",
    retake: "Tekrar Çek",
    markReference: "Referans nesneyi işaretleyin",
    markMeasurement: "Ölçülecek yeri işaretleyin",
    calculate: "Hesapla",
    result: "Tahmini ölçüm",
    useResult: "Bu Ölçümü Kullan",
    cancel: "İptal",
    referenceDirection: "Referans yönü",
    height: "Yükseklik",
    width: "Genişlik",
    accuracy: "Hassasiyet: ±%5-10",
    tip: "İpucu: En iyi sonuç için fotoğrafı düz açıdan çekin, eğik değil"
  },
  de: {
    title: "Raummessung",
    step1: "Schritt 1: Foto aufnehmen",
    step1Desc: "Fotografieren Sie die Wand, die Sie messen möchten",
    step2: "Schritt 2: Referenz wählen",
    step2Desc: "Wählen Sie ein Objekt mit bekannter Größe",
    step3: "Schritt 3: Referenz markieren",
    step3Desc: "Zeichnen Sie eine Linie auf das Referenzobjekt",
    step4: "Schritt 4: Messung markieren",
    step4Desc: "Zeichnen Sie nun eine Linie auf das zu messende Objekt",
    takePhoto: "Foto aufnehmen",
    retake: "Neu aufnehmen",
    markReference: "Referenzobjekt markieren",
    markMeasurement: "Zu messendes markieren",
    calculate: "Berechnen",
    result: "Geschätzte Messung",
    useResult: "Diese Messung verwenden",
    cancel: "Abbrechen",
    referenceDirection: "Referenzrichtung",
    height: "Höhe",
    width: "Breite",
    accuracy: "Genauigkeit: ±5-10%",
    tip: "Tipp: Für beste Ergebnisse fotografieren Sie frontal, nicht schräg"
  }
};

export default function MeasurementTool({ onMeasurementComplete, onClose }) {
  const { language } = useLanguage();
  const t = MEASUREMENT_TEXTS[language] || MEASUREMENT_TEXTS.en;
  
  const [step, setStep] = useState(1); // 1: photo, 2: select reference, 3: mark reference, 4: mark measurement, 5: result
  const [image, setImage] = useState(null);
  const [selectedReference, setSelectedReference] = useState(null);
  const [referenceDirection, setReferenceDirection] = useState('height'); // height or width
  const [referenceLine, setReferenceLine] = useState(null); // {start: {x, y}, end: {x, y}}
  const [measurementLine, setMeasurementLine] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [result, setResult] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert('Camera access denied. Please allow camera access to use this feature.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (step === 1) {
      startCamera();
    }
    return () => stopCamera();
  }, [step]);

  // Take photo
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setImage(dataUrl);
      stopCamera();
      setStep(2);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setImage(null);
    setReferenceLine(null);
    setMeasurementLine(null);
    setResult(null);
    setStep(1);
  };

  // Handle touch/mouse events for drawing lines
  const getEventPos = (e, rect) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleDrawStart = (e) => {
    if (step !== 3 && step !== 4) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = getEventPos(e, rect);
    setIsDrawing(true);
    setDrawStart(pos);
  };

  const handleDrawMove = (e) => {
    if (!isDrawing || !drawStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = getEventPos(e, rect);
    
    // Update the current line being drawn
    if (step === 3) {
      setReferenceLine({ start: drawStart, end: pos });
    } else if (step === 4) {
      setMeasurementLine({ start: drawStart, end: pos });
    }
  };

  const handleDrawEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setDrawStart(null);
    
    if (step === 3 && referenceLine) {
      setStep(4);
    } else if (step === 4 && measurementLine) {
      calculateMeasurement();
    }
  };

  // Calculate measurement based on reference
  const calculateMeasurement = () => {
    if (!referenceLine || !measurementLine || !selectedReference) return;

    // Calculate line lengths in pixels
    const refLength = Math.sqrt(
      Math.pow(referenceLine.end.x - referenceLine.start.x, 2) +
      Math.pow(referenceLine.end.y - referenceLine.start.y, 2)
    );
    
    const measureLength = Math.sqrt(
      Math.pow(measurementLine.end.x - measurementLine.start.x, 2) +
      Math.pow(measurementLine.end.y - measurementLine.start.y, 2)
    );

    // Get real reference size in cm
    const refObject = REFERENCE_OBJECTS[selectedReference];
    const refRealSize = referenceDirection === 'height' ? refObject.height : refObject.width;

    // Calculate: pixels per cm from reference, then apply to measurement
    const pixelsPerCm = refLength / refRealSize;
    const measuredCm = measureLength / pixelsPerCm;

    // Round to nearest 5cm for cleaner results
    const roundedCm = Math.round(measuredCm / 5) * 5;

    setResult({
      raw: measuredCm,
      rounded: roundedCm,
      unit: 'cm'
    });
    setStep(5);
  };

  // Render line on canvas overlay
  const renderLines = () => {
    const lines = [];
    
    if (referenceLine) {
      lines.push(
        <line
          key="ref"
          x1={referenceLine.start.x}
          y1={referenceLine.start.y}
          x2={referenceLine.end.x}
          y2={referenceLine.end.y}
          stroke="#D4AF37"
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
      // Start and end circles
      lines.push(
        <circle key="ref-start" cx={referenceLine.start.x} cy={referenceLine.start.y} r="8" fill="#D4AF37" />,
        <circle key="ref-end" cx={referenceLine.end.x} cy={referenceLine.end.y} r="8" fill="#D4AF37" />
      );
    }
    
    if (measurementLine) {
      lines.push(
        <line
          key="measure"
          x1={measurementLine.start.x}
          y1={measurementLine.start.y}
          x2={measurementLine.end.x}
          y2={measurementLine.end.y}
          stroke="#10B981"
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
      lines.push(
        <circle key="measure-start" cx={measurementLine.start.x} cy={measurementLine.start.y} r="8" fill="#10B981" />,
        <circle key="measure-end" cx={measurementLine.end.x} cy={measurementLine.end.y} r="8" fill="#10B981" />
      );
    }
    
    return lines;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" data-testid="measurement-tool">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-['Playfair_Display'] text-xl">{t.title}</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-white/60 text-sm mt-1">{t.accuracy}</p>
      </div>

      {/* Step 1: Camera */}
      {step === 1 && (
        <div className="h-full flex flex-col">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="flex-1 object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-center mb-4">{t.step1Desc}</p>
            <p className="text-white/40 text-xs text-center mb-4">{t.tip}</p>
            <Button
              onClick={takePhoto}
              className="w-full bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none py-4"
              data-testid="take-photo-btn"
            >
              <Camera className="w-5 h-5 mr-2" />
              {t.takePhoto}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Reference */}
      {step === 2 && image && (
        <div className="h-full flex flex-col">
          <div className="flex-1 relative">
            <img src={image} alt="Captured" className="w-full h-full object-contain bg-black" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
            <p className="text-white text-center mb-4">{t.step2Desc}</p>
            
            <Select value={selectedReference || ''} onValueChange={setSelectedReference}>
              <SelectTrigger className="w-full bg-[#121212] border-white/20 text-white mb-3" data-testid="reference-select">
                <SelectValue placeholder="Select reference object..." />
              </SelectTrigger>
              <SelectContent className="bg-[#121212] border-white/10">
                {Object.entries(REFERENCE_OBJECTS).map(([key, obj]) => (
                  <SelectItem key={key} value={key} className="text-white">
                    {obj.name[language] || obj.name.en} - {obj.description[language] || obj.description.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedReference && (
              <div className="mb-4">
                <p className="text-white/60 text-sm mb-2">{t.referenceDirection}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setReferenceDirection('height')}
                    variant={referenceDirection === 'height' ? 'default' : 'outline'}
                    className={referenceDirection === 'height' ? 'bg-[#D4AF37] text-black' : 'border-white/20 text-white'}
                  >
                    {t.height} ({REFERENCE_OBJECTS[selectedReference].height}cm)
                  </Button>
                  <Button
                    onClick={() => setReferenceDirection('width')}
                    variant={referenceDirection === 'width' ? 'default' : 'outline'}
                    className={referenceDirection === 'width' ? 'bg-[#D4AF37] text-black' : 'border-white/20 text-white'}
                  >
                    {t.width} ({REFERENCE_OBJECTS[selectedReference].width}cm)
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1 border-white/20 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t.retake}
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedReference}
                className="flex-1 bg-[#D4AF37] text-black hover:bg-[#C5A028]"
                data-testid="next-step-btn"
              >
                {t.markReference}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 & 4: Draw Lines */}
      {(step === 3 || step === 4) && image && (
        <div className="h-full flex flex-col">
          <div 
            className="flex-1 relative touch-none"
            onMouseDown={handleDrawStart}
            onMouseMove={handleDrawMove}
            onMouseUp={handleDrawEnd}
            onMouseLeave={handleDrawEnd}
            onTouchStart={handleDrawStart}
            onTouchMove={handleDrawMove}
            onTouchEnd={handleDrawEnd}
          >
            <img 
              ref={imageRef}
              src={image} 
              alt="Captured" 
              className="w-full h-full object-contain bg-black pointer-events-none" 
            />
            
            {/* SVG Overlay for lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {renderLines()}
            </svg>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              {step === 3 ? (
                <>
                  <div className="w-4 h-4 bg-[#D4AF37] rounded-full"></div>
                  <p className="text-white">{t.step3Desc}</p>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <p className="text-white">{t.step4Desc}</p>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  if (step === 4) {
                    setMeasurementLine(null);
                    setStep(3);
                  } else {
                    setReferenceLine(null);
                    setStep(2);
                  }
                }}
                variant="outline"
                className="flex-1 border-white/20 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t.retake}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Result */}
      {step === 5 && result && (
        <div className="h-full flex flex-col">
          <div className="flex-1 relative">
            <img src={image} alt="Captured" className="w-full h-full object-contain bg-black" />
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {renderLines()}
            </svg>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="text-center mb-6">
              <p className="text-white/60 text-sm mb-2">{t.result}</p>
              <div className="flex items-center justify-center gap-2">
                <Ruler className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-5xl font-['Playfair_Display'] text-[#D4AF37]">
                  {result.rounded}
                </span>
                <span className="text-2xl text-white/60">cm</span>
              </div>
              <p className="text-white/40 text-xs mt-2">({t.accuracy})</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1 border-white/20 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t.retake}
              </Button>
              <Button
                onClick={() => {
                  onMeasurementComplete({
                    value: result.rounded,
                    unit: 'cm',
                    accuracy: '±5-10%',
                    image: image
                  });
                  onClose();
                }}
                className="flex-1 bg-[#D4AF37] text-black hover:bg-[#C5A028]"
                data-testid="use-measurement-btn"
              >
                <Check className="w-4 h-4 mr-2" />
                {t.useResult}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
