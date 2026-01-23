import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import ProductConfigurator from '../components/ProductConfigurator';
import { ArrowRight } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProductsPage() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const categorySlug = searchParams.get('category');
    if (categorySlug && categories.length > 0) {
      const cat = categories.find(c => c.slug === categorySlug);
      setSelectedCategory(cat || null);
    }
  }, [searchParams, categories]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="products-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-['Playfair_Display'] text-white mb-4">
            {t('categories.title')}
          </h1>
          <p className="text-white/40">{t('categories.subtitle')}</p>
        </div>

        {/* Category Selection */}
        {!selectedCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className="group relative overflow-hidden aspect-[4/3] border border-white/5 hover:border-[#D4AF37]/30 transition-colors"
                data-testid={`select-category-${cat.slug}`}
              >
                <img
                  src={cat.image_url}
                  alt={cat.name[language] || cat.name.en}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-['Playfair_Display'] text-white mb-2">
                    {cat.name[language] || cat.name.en}
                  </h3>
                  <p className="text-white/60 text-sm line-clamp-2">
                    {cat.description[language] || cat.description.en}
                  </p>
                  <span className="inline-flex items-center text-[#D4AF37] text-xs uppercase tracking-widest font-bold mt-4 group-hover:translate-x-2 transition-transform">
                    Configure
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left - Preview */}
            <div className="relative">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-white/40 hover:text-white text-sm uppercase tracking-widest mb-6 inline-flex items-center"
                data-testid="back-to-categories"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                All Categories
              </button>
              
              <div className="aspect-square overflow-hidden border border-white/5">
                <img
                  src={selectedCategory.image_url}
                  alt={selectedCategory.name[language] || selectedCategory.name.en}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="mt-6">
                <h2 className="text-3xl font-['Playfair_Display'] text-white mb-3">
                  {selectedCategory.name[language] || selectedCategory.name.en}
                </h2>
                <p className="text-white/60 leading-relaxed">
                  {selectedCategory.description[language] || selectedCategory.description.en}
                </p>
              </div>
            </div>

            {/* Right - Configurator */}
            <ProductConfigurator 
              category={selectedCategory}
              onAddToCart={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
