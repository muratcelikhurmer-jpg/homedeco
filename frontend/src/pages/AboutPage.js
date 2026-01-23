import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Truck, Award, Users } from 'lucide-react';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="about-page">
      {/* Hero */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-['Playfair_Display'] text-white mb-6">
                Crafting European Excellence
              </h1>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                HomeDeco bridges the gap between Turkish craftsmanship and European homes. 
                We combine traditional manufacturing expertise with modern AI technology 
                to deliver custom home products that meet the highest European standards.
              </p>
              <div className="flex items-center space-x-6 text-white/40 text-sm">
                <span className="flex items-center">
                  <Award className="w-4 h-4 mr-2 text-[#D4AF37]" />
                  DIN Certified
                </span>
                <span className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-[#D4AF37]" />
                  CE Marked
                </span>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1722411927625-0e478acf502b?w=800"
                alt="Craftsman"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-['Playfair_Display'] text-white mb-12 text-center">
            Why Choose HomeDeco
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "European Standards",
                desc: "All products manufactured to DIN standards with CE marking"
              },
              {
                icon: Users,
                title: "AI-Powered Design",
                desc: "Our AI assistant helps you design exactly what you need"
              },
              {
                icon: Truck,
                title: "Secure Delivery",
                desc: "Insured shipping from Turkey to your European doorstep"
              },
              {
                icon: Award,
                title: "Quality Guarantee",
                desc: "Escrow payment ensures you only pay for quality products"
              }
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-16 h-16 bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-6">
                  <Icon className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <h3 className="text-white font-['Playfair_Display'] text-xl mb-3">{title}</h3>
                <p className="text-white/40 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-['Playfair_Display'] text-white mb-12 text-center">
            Our Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Design with AI",
                desc: "Share your vision with our AI assistant. Upload inspiration images, describe your needs, and get personalized recommendations.",
                image: "https://images.unsplash.com/photo-1577561776790-1a20c419b1a2?w=600"
              },
              {
                step: "02",
                title: "Expert Manufacturing",
                desc: "Your custom product is crafted by skilled artisans in Turkey using premium materials and European quality standards.",
                image: "https://images.unsplash.com/photo-1722411927625-0e478acf502b?w=600"
              },
              {
                step: "03",
                title: "Secure Delivery",
                desc: "We photograph your finished product before shipping. Your payment is released only after verified shipment.",
                image: "https://images.unsplash.com/photo-1762814618321-b95fd7660cd1?w=600"
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
                    <span className="text-[#D4AF37] text-5xl font-['Playfair_Display']">{step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-['Playfair_Display'] text-white mb-3">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Info */}
      <section className="py-24 bg-[#121212]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-['Playfair_Display'] text-white mb-8 text-center">
            Shipping to Europe
          </h2>
          <div className="bg-[#0A0A0A] border border-white/5 p-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-2 h-2 bg-[#D4AF37] rounded-full mt-2"></div>
                <div>
                  <h4 className="text-white font-medium">Container Shipping (Free)</h4>
                  <p className="text-white/40 text-sm">Monthly consolidated shipments. Estimated delivery: 3-4 weeks</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-2 h-2 bg-[#D4AF37] rounded-full mt-2"></div>
                <div>
                  <h4 className="text-white font-medium">Express Road Freight</h4>
                  <p className="text-white/40 text-sm">Direct delivery via road transport. Estimated delivery: 5-7 days</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-2 h-2 bg-[#D4AF37] rounded-full mt-2"></div>
                <div>
                  <h4 className="text-white font-medium">Air Freight (UPS/DHL)</h4>
                  <p className="text-white/40 text-sm">Fastest option for urgent orders. Estimated delivery: 2-3 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
