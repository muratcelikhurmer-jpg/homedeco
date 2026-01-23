import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, Truck, Plane, Ship } from 'lucide-react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductConfigurator({ category, onAddToCart }) {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [dimensions, setDimensions] = useState({ width: 100, height: 200, depth: 60 });
  const [options, setOptions] = useState({
    soft_close: false,
    led_lighting: false,
    glass_doors: false,
    push_to_open: false
  });
  const [pricing, setPricing] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState('container');

  useEffect(() => {
    fetchMaterials();
  }, [category]);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API}/materials`);
      setMaterials(response.data);
      if (response.data.length > 0) {
        setSelectedMaterial(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const calculatePrice = async () => {
    if (!selectedMaterial) return;
    
    setIsCalculating(true);
    try {
      const response = await axios.post(`${API}/calculate-price`, {
        category_id: category?.id || 'cabinets',
        dimensions,
        material_id: selectedMaterial,
        additional_options: options
      });
      setPricing(response.data);
    } catch (error) {
      console.error('Error calculating price:', error);
      toast({
        title: t('common.error'),
        description: "Failed to calculate price",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAddToCart = () => {
    if (!pricing) {
      calculatePrice();
      return;
    }

    const material = materials.find(m => m.id === selectedMaterial);
    const shipping = pricing.shipping_options.find(s => s.id === selectedShipping);
    
    const product = {
      category: category?.name?.[language] || category?.id || 'Custom Product',
      categoryId: category?.id || 'cabinets',
      material: material?.name?.[language] || selectedMaterial,
      materialId: selectedMaterial,
      dimensions,
      options,
      subtotal: pricing.subtotal,
      shippingMethod: selectedShipping,
      shippingCost: shipping?.calculated_cost || 0,
      productionDays: pricing.estimated_production_days
    };

    addToCart(product);
    toast({
      title: t('common.success'),
      description: "Product added to cart"
    });

    if (onAddToCart) onAddToCart(product);
  };

  const getShippingIcon = (id) => {
    switch(id) {
      case 'container': return <Ship className="w-5 h-5" />;
      case 'express_road': return <Truck className="w-5 h-5" />;
      case 'air_freight': return <Plane className="w-5 h-5" />;
      default: return <Truck className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-[#121212] border border-white/5 p-6 lg:p-8" data-testid="product-configurator">
      <h2 className="text-2xl font-['Playfair_Display'] text-white mb-8">{t('config.title')}</h2>
      
      {/* Dimensions */}
      <div className="mb-8">
        <h3 className="text-white/60 uppercase tracking-widest text-xs mb-4">{t('config.dimensions')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-white/40 text-xs mb-2 block">{t('config.width')}</Label>
            <Input
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions(prev => ({ ...prev, width: Number(e.target.value) }))}
              className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white"
              data-testid="input-width"
            />
          </div>
          <div>
            <Label className="text-white/40 text-xs mb-2 block">{t('config.height')}</Label>
            <Input
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions(prev => ({ ...prev, height: Number(e.target.value) }))}
              className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white"
              data-testid="input-height"
            />
          </div>
          <div>
            <Label className="text-white/40 text-xs mb-2 block">{t('config.depth')}</Label>
            <Input
              type="number"
              value={dimensions.depth}
              onChange={(e) => setDimensions(prev => ({ ...prev, depth: Number(e.target.value) }))}
              className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white"
              data-testid="input-depth"
            />
          </div>
        </div>
      </div>

      {/* Material Selection */}
      <div className="mb-8">
        <h3 className="text-white/60 uppercase tracking-widest text-xs mb-4">{t('config.material')}</h3>
        <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
          <SelectTrigger className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white" data-testid="material-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#121212] border-white/10">
            {materials.map((mat) => (
              <SelectItem key={mat.id} value={mat.id} className="text-white hover:bg-white/5">
                {mat.name[language] || mat.name.en} - €{mat.price_per_unit}/{mat.unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Options */}
      <div className="mb-8">
        <h3 className="text-white/60 uppercase tracking-widest text-xs mb-4">{t('config.options')}</h3>
        <div className="space-y-3">
          {[
            { key: 'soft_close', label: t('config.softClose') },
            { key: 'led_lighting', label: t('config.ledLighting') },
            { key: 'glass_doors', label: t('config.glassDoors') },
            { key: 'push_to_open', label: t('config.pushToOpen') }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-3">
              <Checkbox
                id={key}
                checked={options[key]}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, [key]: checked }))}
                className="border-white/20 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                data-testid={`option-${key}`}
              />
              <Label htmlFor={key} className="text-white/60 text-sm cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Calculate Button */}
      <Button
        onClick={calculatePrice}
        disabled={isCalculating || !selectedMaterial}
        className="w-full bg-transparent border border-white/20 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] rounded-none uppercase tracking-widest text-xs font-bold py-4 mb-6"
        data-testid="calculate-price-btn"
      >
        {isCalculating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('common.loading')}
          </>
        ) : (
          t('config.calculate')
        )}
      </Button>

      {/* Pricing Results */}
      {pricing && (
        <div className="border-t border-white/5 pt-6 space-y-6" data-testid="pricing-results">
          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{t('price.basePrice')}</span>
              <span className="text-white">€{pricing.base_price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{t('price.materialCost')}</span>
              <span className="text-white">€{pricing.material_cost.toFixed(2)}</span>
            </div>
            {pricing.options_cost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-white/40">{t('price.optionsCost')}</span>
                <span className="text-white">€{pricing.options_cost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t border-white/5 pt-3">
              <span className="text-white">{t('price.subtotal')}</span>
              <span className="text-[#D4AF37]">€{pricing.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center text-sm text-white/40">
              <Check className="w-4 h-4 mr-2 text-green-500" />
              {t('price.productionTime')}: {pricing.estimated_production_days} {t('price.days')}
            </div>
          </div>

          {/* Shipping Options */}
          <div>
            <h3 className="text-white/60 uppercase tracking-widest text-xs mb-4">{t('shipping.title')}</h3>
            <div className="space-y-2">
              {pricing.shipping_options.map((ship) => (
                <div
                  key={ship.id}
                  onClick={() => setSelectedShipping(ship.id)}
                  className={`p-4 border cursor-pointer transition-all ${
                    selectedShipping === ship.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  data-testid={`shipping-${ship.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={selectedShipping === ship.id ? 'text-[#D4AF37]' : 'text-white/40'}>
                        {getShippingIcon(ship.id)}
                      </span>
                      <div>
                        <p className="text-white text-sm">{ship.name[language] || ship.name.en}</p>
                        <p className="text-white/40 text-xs">{ship.estimated_days} {t('price.days')}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${ship.calculated_cost === 0 ? 'text-green-500' : 'text-white'}`}>
                      {ship.calculated_cost === 0 ? t('shipping.free') : `€${ship.calculated_cost.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            onClick={handleAddToCart}
            className="w-full bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none uppercase tracking-widest text-xs font-bold py-4"
            data-testid="add-to-cart-btn"
          >
            {t('config.addToCart')}
          </Button>
        </div>
      )}
    </div>
  );
}
