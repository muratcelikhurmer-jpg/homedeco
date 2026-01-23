import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import AIAssistant from '../components/AIAssistant';

export default function AssistantPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-24" data-testid="assistant-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-['Playfair_Display'] text-white mb-4">
            {t('ai.title')}
          </h1>
          <p className="text-white/40 max-w-2xl mx-auto">
            {t('ai.subtitle')}
          </p>
        </div>

        <div className="h-[600px]">
          <AIAssistant />
        </div>

        {/* Tips Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Share Inspiration",
              desc: "Upload Pinterest images or photos of products you like"
            },
            {
              title: "Describe Your Space",
              desc: "Tell us about the room dimensions and style preferences"
            },
            {
              title: "Ask Questions",
              desc: "Our AI will guide you through material and design choices"
            }
          ].map((tip, idx) => (
            <div key={idx} className="bg-[#121212] border border-white/5 p-6">
              <div className="w-8 h-8 bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                <span className="text-[#D4AF37] font-['Playfair_Display'] text-lg">{idx + 1}</span>
              </div>
              <h3 className="text-white font-medium mb-2">{tip.title}</h3>
              <p className="text-white/40 text-sm">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
