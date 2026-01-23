import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COUNTRIES = [
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'FR', name: 'France' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' }
];

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { cart, getTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'DE'
  });

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create order
      const orderResponse = await axios.post(`${API}/orders`, {
        customer_email: formData.email,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_address: {
          street: formData.street,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country
        },
        products: cart.map(item => ({
          category: item.category,
          categoryId: item.categoryId,
          material: item.material,
          materialId: item.materialId,
          dimensions: item.dimensions,
          options: item.options,
          subtotal: item.subtotal,
          productionDays: item.productionDays
        })),
        shipping_method: cart[0]?.shippingMethod || 'container',
        currency: 'EUR'
      });

      const orderId = orderResponse.data.order_id;

      // Create payment session
      const paymentResponse = await axios.post(`${API}/payments/checkout`, {
        order_id: orderId,
        origin_url: window.location.origin
      });

      // Redirect to Stripe checkout
      if (paymentResponse.data.checkout_url) {
        window.location.href = paymentResponse.data.checkout_url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: t('common.error'),
        description: "Failed to process checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="checkout-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-['Playfair_Display'] text-white mb-8">{t('checkout.title')}</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information */}
            <div className="space-y-8">
              <div className="bg-[#121212] border border-white/5 p-6">
                <h2 className="text-xl font-['Playfair_Display'] text-white mb-6">{t('checkout.customerInfo')}</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/40 text-xs mb-2 block">{t('checkout.name')} *</Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white"
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label className="text-white/40 text-xs mb-2 block">{t('checkout.email')} *</Label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label className="text-white/40 text-xs mb-2 block">{t('checkout.phone')}</Label>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#121212] border border-white/5 p-6">
                <h2 className="text-xl font-['Playfair_Display'] text-white mb-6">{t('checkout.address')}</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/40 text-xs mb-2 block">{t('checkout.street')} *</Label>
                    <Input
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      required
                      className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white"
                      data-testid="input-street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/40 text-xs mb-2 block">{t('checkout.city')} *</Label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white"
                        data-testid="input-city"
                      />
                    </div>
                    <div>
                      <Label className="text-white/40 text-xs mb-2 block">{t('checkout.postalCode')} *</Label>
                      <Input
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        required
                        className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white"
                        data-testid="input-postal"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/40 text-xs mb-2 block">{t('checkout.country')} *</Label>
                    <Select value={formData.country} onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}>
                      <SelectTrigger className="bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white" data-testid="select-country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#121212] border-white/10">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code} className="text-white hover:bg-white/5">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-[#121212] border border-white/5 p-6 h-fit sticky top-28">
              <h2 className="text-xl font-['Playfair_Display'] text-white mb-6">{t('checkout.orderSummary')}</h2>
              
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.cartId} className="flex justify-between pb-4 border-b border-white/5">
                    <div>
                      <p className="text-white text-sm">{item.category}</p>
                      <p className="text-white/40 text-xs">{item.material}</p>
                      <p className="text-white/40 text-xs">{item.dimensions.width}x{item.dimensions.height}x{item.dimensions.depth}cm</p>
                    </div>
                    <span className="text-white">€{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">{t('price.subtotal')}</span>
                  <span className="text-white">€{getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">{t('price.shipping')}</span>
                  <span className="text-green-500">Free (Container)</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mb-6">
                <div className="flex justify-between text-xl font-semibold">
                  <span className="text-white">{t('price.total')}</span>
                  <span className="text-[#D4AF37]">€{getTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-3 mb-6 p-4 bg-[#0A0A0A] border border-white/5">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={setTermsAccepted}
                  className="border-white/20 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37] mt-0.5"
                  data-testid="accept-terms"
                />
                <label htmlFor="terms" className="text-white/40 text-xs leading-relaxed cursor-pointer">
                  {t('checkout.terms')}
                </label>
              </div>

              {/* Escrow Info */}
              <div className="flex items-start space-x-3 mb-6 p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20">
                <AlertCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <p className="text-white/60 text-xs">
                  Your payment is held securely until your order is manufactured and shipped. Photos will be provided before shipment.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !termsAccepted}
                className="w-full bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none uppercase tracking-widest text-xs font-bold py-4"
                data-testid="pay-now-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  t('checkout.payNow')
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
