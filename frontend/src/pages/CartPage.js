import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { t, language } = useLanguage();
  const { cart, removeFromCart, getTotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="cart-page-empty">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <ShoppingBag className="w-16 h-16 text-white/20 mx-auto mb-6" />
          <h1 className="text-3xl font-['Playfair_Display'] text-white mb-4">Your Cart is Empty</h1>
          <p className="text-white/40 mb-8">Start designing your custom products</p>
          <Link to="/products">
            <Button className="bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none uppercase tracking-widest text-xs font-bold px-8 py-4">
              Browse Products
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="cart-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-['Playfair_Display'] text-white mb-8">{t('nav.cart')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div 
                key={item.cartId} 
                className="bg-[#121212] border border-white/5 p-6 flex justify-between items-start"
                data-testid={`cart-item-${item.cartId}`}
              >
                <div className="flex-1">
                  <h3 className="text-white font-['Playfair_Display'] text-lg mb-2">{item.category}</h3>
                  <div className="space-y-1 text-sm text-white/40">
                    <p>Material: {item.material}</p>
                    <p>Dimensions: {item.dimensions.width} x {item.dimensions.height} x {item.dimensions.depth} cm</p>
                    {item.options && Object.entries(item.options).filter(([_, v]) => v).length > 0 && (
                      <p>Options: {Object.entries(item.options).filter(([_, v]) => v).map(([k]) => k.replace('_', ' ')).join(', ')}</p>
                    )}
                    <p>Production: ~{item.productionDays} days</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-4">
                  <span className="text-[#D4AF37] text-xl font-semibold">€{item.subtotal.toFixed(2)}</span>
                  <button
                    onClick={() => removeFromCart(item.cartId)}
                    className="text-white/40 hover:text-red-500 transition-colors"
                    data-testid={`remove-item-${item.cartId}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-[#121212] border border-white/5 p-6 h-fit sticky top-28">
            <h2 className="text-xl font-['Playfair_Display'] text-white mb-6">{t('checkout.orderSummary')}</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">{t('price.subtotal')} ({cart.length} items)</span>
                <span className="text-white">€{getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">{t('price.shipping')}</span>
                <span className="text-white/40">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 mb-6">
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-white">{t('price.total')}</span>
                <span className="text-[#D4AF37]">€{getTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={() => navigate('/checkout')}
              className="w-full bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none uppercase tracking-widest text-xs font-bold py-4"
              data-testid="proceed-to-checkout"
            >
              {t('checkout.title')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            <button
              onClick={clearCart}
              className="w-full text-white/40 hover:text-red-500 text-xs uppercase tracking-widest mt-4 transition-colors"
              data-testid="clear-cart"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
