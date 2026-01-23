import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OrderConfirmationPage() {
  const { t } = useLanguage();
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, failed
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    
    if (sessionId && orderId) {
      pollPaymentStatus(sessionId, orderId);
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, orderId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('failed');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        clearCart();
        
        // Fetch order details
        const orderResponse = await axios.get(`${API}/orders/${orderId}`);
        setOrder(orderResponse.data);
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, orderId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setTimeout(() => pollPaymentStatus(sessionId, orderId, attempts + 1), pollInterval);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="order-confirmation-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-[#D4AF37] mx-auto mb-6 animate-spin" />
            <h1 className="text-3xl font-['Playfair_Display'] text-white mb-4">Processing Your Order</h1>
            <p className="text-white/40">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-['Playfair_Display'] text-white mb-4" data-testid="order-success">
              Thank You For Your Order!
            </h1>
            <p className="text-white/40 mb-8">
              Your order has been confirmed. We'll start production and keep you updated on the progress.
            </p>
            
            {order && (
              <div className="bg-[#121212] border border-white/5 p-6 mb-8 text-left">
                <h3 className="text-white font-medium mb-4">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Order ID</span>
                    <span className="text-white font-mono">{order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Total</span>
                    <span className="text-[#D4AF37]">€{order.total_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Status</span>
                    <span className="text-green-500 capitalize">{order.status}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button className="bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none uppercase tracking-widest text-xs font-bold px-8 py-4">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-['Playfair_Display'] text-white mb-4">Payment Issue</h1>
            <p className="text-white/40 mb-8">
              There was an issue processing your payment. Please try again or contact support.
            </p>
            <Link to="/checkout">
              <Button className="bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none uppercase tracking-widest text-xs font-bold px-8 py-4">
                Try Again
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
