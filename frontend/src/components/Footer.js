import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-[#D4AF37] flex items-center justify-center">
                <span className="text-black font-bold text-xl font-['Playfair_Display']">H</span>
              </div>
              <span className="text-white text-xl font-['Playfair_Display']">HomeDeco</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-md">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4 mt-6">
              <div className="flex items-center space-x-2 text-white/30 text-xs">
                <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
                <span>DIN Certified</span>
              </div>
              <div className="flex items-center space-x-2 text-white/30 text-xs">
                <span className="w-2 h-2 bg-[#D4AF37] rounded-full"></span>
                <span>CE Marked</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white/60 uppercase tracking-widest text-xs mb-4">{t('footer.products')}</h4>
            <ul className="space-y-3">
              <li><Link to="/products?category=cabinets" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Cabinets</Link></li>
              <li><Link to="/products?category=doors" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Doors</Link></li>
              <li><Link to="/products?category=countertops" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Countertops</Link></li>
              <li><Link to="/products?category=furniture" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">Furniture</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white/60 uppercase tracking-widest text-xs mb-4">{t('footer.support')}</h4>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">{t('footer.contact')}</Link></li>
              <li><Link to="/faq" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">{t('footer.faq')}</Link></li>
              <li><Link to="/privacy" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" className="text-white/40 hover:text-[#D4AF37] text-sm transition-colors">{t('footer.terms')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/20 text-xs">© 2025 HomeDeco. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="text-white/20 text-xs">Crafted in Turkey</span>
            <span className="text-white/10">•</span>
            <span className="text-white/20 text-xs">Delivered across Europe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
