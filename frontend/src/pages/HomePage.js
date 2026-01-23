import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Shield, Truck, CreditCard, Headphones } from 'lucide-react';
import { Button } from "@/components/ui/button";
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function HomePage() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const trustItems = [
    { icon: Shield, title: t('trust.quality'), key: 'quality' },
    { icon: Truck, title: t('trust.shipping'), key: 'shipping' },
    { icon: CreditCard, title: t('trust.payment'), key: 'payment' },
    { icon: Headphones, title: t('trust.support'), key: 'support' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1633174102090-ac62872538dd?w=1920&q=80"
            alt="Luxury Kitchen"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-['Playfair_Display'] text-white leading-tight mb-6" data-testid="hero-title">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-white/60 mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/assistant">
                <Button className="bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none uppercase tracking-widest text-xs font-bold px-8 py-6" data-testid="hero-cta">
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="bg-transparent border border-white/20 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] rounded-none uppercase tracking-widest text-xs font-bold px-8 py-6" data-testid="hero-cta-secondary">
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustItems.map(({ icon: Icon, title, key }) => (
                <div key={key} className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-white/60 text-sm">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-['Playfair_Display'] text-white mb-4" data-testid="categories-title">
              {t('categories.title')}
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>

          {/* Tetris Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {categories.slice(0, 4).map((cat, idx) => (
              <Link 
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className={`group relative overflow-hidden ${
                  idx === 0 ? 'md:col-span-7 md:row-span-2 min-h-[500px]' :
                  idx === 1 ? 'md:col-span-5 min-h-[240px]' :
                  idx === 2 ? 'md:col-span-5 min-h-[240px]' :
                  'md:col-span-12 min-h-[200px]'
                }`}
                data-testid={`category-${cat.slug}`}
              >
                <img
                  src={cat.image_url}
                  alt={cat.name[language] || cat.name.en}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <h3 className="text-2xl md:text-3xl font-['Playfair_Display'] text-white mb-2">
                    {cat.name[language] || cat.name.en}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {cat.description[language] || cat.description.en}
                  </p>
                  <span className="inline-flex items-center text-[#D4AF37] text-xs uppercase tracking-widest font-bold group-hover:translate-x-2 transition-transform">
                    {t('categories.viewAll')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-['Playfair_Display'] text-white mb-4">
              {t('process.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                step: '01', 
                title: t('process.step1Title'), 
                desc: t('process.step1Desc'),
                image: 'https://images.unsplash.com/photo-1577561776790-1a20c419b1a2?w=600'
              },
              { 
                step: '02', 
                title: t('process.step2Title'), 
                desc: t('process.step2Desc'),
                image: 'https://images.unsplash.com/photo-1722411927625-0e478acf502b?w=600'
              },
              { 
                step: '03', 
                title: t('process.step3Title'), 
                desc: t('process.step3Desc'),
                image: 'https://images.unsplash.com/photo-1762814618321-b95fd7660cd1?w=600'
              }
            ].map(({ step, title, desc, image }) => (
              <div key={step} className="group">
                <div className="relative overflow-hidden mb-6 aspect-[4/3]">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="text-[#D4AF37] text-6xl font-['Playfair_Display'] opacity-80">{step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-['Playfair_Display'] text-white mb-3">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-['Playfair_Display'] text-white mb-6">
            Ready to Create Your Custom Piece?
          </h2>
          <p className="text-white/40 text-lg mb-10 max-w-2xl mx-auto">
            Start a conversation with our AI design assistant and bring your vision to life.
          </p>
          <Link to="/assistant">
            <Button className="bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none uppercase tracking-widest text-xs font-bold px-12 py-6">
              {t('hero.cta')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
