import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage, languages } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { Menu, X, ShoppingCart, Globe, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { itemCount } = useCart();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/products', label: t('nav.products') },
    { path: '/assistant', label: t('nav.assistant') },
    { path: '/about', label: t('nav.about') },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" data-testid="nav-logo">
            <div className="w-10 h-10 bg-[#D4AF37] flex items-center justify-center">
              <span className="text-black font-bold text-xl font-['Playfair_Display']">H</span>
            </div>
            <span className="text-white text-xl font-['Playfair_Display'] tracking-tight">HomeDeco</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-link-${link.path.replace('/', '') || 'home'}`}
                className={`text-sm uppercase tracking-widest transition-colors duration-300 ${
                  isActive(link.path)
                    ? 'text-[#D4AF37]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-white/60 hover:text-white hover:bg-white/5"
                  data-testid="language-selector"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="uppercase text-xs">{language}</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#121212] border-white/10">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`cursor-pointer ${language === lang.code ? 'text-[#D4AF37]' : 'text-white/80'}`}
                    data-testid={`lang-${lang.code}`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            <Link to="/cart" data-testid="nav-cart">
              <Button variant="ghost" className="relative text-white/60 hover:text-white hover:bg-white/5">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] text-black text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Admin Link */}
            <Link to="/admin" className="hidden md:block" data-testid="nav-admin">
              <Button variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5 text-xs uppercase tracking-widest">
                {t('nav.admin')}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-6 border-t border-white/5 mt-4 pt-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm uppercase tracking-widest py-2 ${
                    isActive(link.path) ? 'text-[#D4AF37]' : 'text-white/60'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm uppercase tracking-widest py-2 text-white/40"
              >
                {t('nav.admin')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
