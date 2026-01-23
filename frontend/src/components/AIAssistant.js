import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Send, Image, Mic, MicOff, Loader2, X, Ruler, Wand2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import MeasurementTool from './MeasurementTool';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AIAssistant({ onProductSuggestion }) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showMeasurementTool, setShowMeasurementTool] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: t('ai.welcome'),
      timestamp: new Date().toISOString()
    }]);
  }, [language]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      // Set language based on current selection
      const langMap = {
        en: 'en-US', de: 'de-DE', tr: 'tr-TR',
        fr: 'fr-FR', ar: 'ar-SA', nl: 'nl-NL'
      };
      recognitionRef.current.lang = langMap[language] || 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [language]);

  const handleSend = async () => {
    if (!input.trim() && selectedImages.length === 0) return;

    const userMessage = {
      role: 'user',
      content: input,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImages([]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: input,
        images: selectedImages.length > 0 ? selectedImages : undefined,
        language: language
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        generatedImage: response.data.generated_image, // AI generated design image
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('common.error'),
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate design visualization directly
  const handleGenerateDesign = async () => {
    // Get description from conversation context or input
    const lastMessages = messages.slice(-5);
    const context = lastMessages.map(m => m.content).join(' ');
    
    // Extract product info from context
    let productType = 'cabinet';
    let style = 'modern';
    let description = input || 'Yatak odası için şık dolap tasarımı';
    
    if (context.toLowerCase().includes('dolap') || context.toLowerCase().includes('cabinet')) {
      productType = 'cabinet';
    } else if (context.toLowerCase().includes('kapı') || context.toLowerCase().includes('door')) {
      productType = 'door';
    } else if (context.toLowerCase().includes('tezgah') || context.toLowerCase().includes('counter')) {
      productType = 'countertop';
    }
    
    if (context.toLowerCase().includes('modern')) style = 'modern';
    if (context.toLowerCase().includes('klasik') || context.toLowerCase().includes('classic')) style = 'classic';
    if (context.toLowerCase().includes('minimal')) style = 'minimalist';
    
    // Use context as description if no input
    if (!input && context) {
      description = context.slice(0, 500);
    }
    
    // Find user's room photo from messages (last uploaded image)
    let roomImageBase64 = null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'user' && msg.images && msg.images.length > 0) {
        // Get the last uploaded image (likely the room photo)
        roomImageBase64 = msg.images[msg.images.length - 1];
        break;
      }
    }
    
    // Also check currently selected images
    if (!roomImageBase64 && selectedImages.length > 0) {
      roomImageBase64 = selectedImages[selectedImages.length - 1];
    }
    
    setIsGeneratingImage(true);
    
    // Add user message about generating
    const userMsg = {
      role: 'user',
      content: roomImageBase64 
        ? (language === 'tr' 
          ? '✨ Tasarım odanıza uygulanıyor (fal.ai)...' 
          : '✨ Applying design to your room (fal.ai)...')
        : (language === 'tr' 
          ? '✨ Tasarım görseli oluşturuluyor...' 
          : '✨ Generating design visualization...'),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      let response;
      
      // If we have user's room photo, use fal.ai to edit it directly
      if (roomImageBase64) {
        // Use fal.ai image-to-image editing
        response = await axios.post(`${API}/edit-room-image`, {
          room_image_base64: roomImageBase64,
          edit_prompt: description
        }, { timeout: 120000 }); // 2 minute timeout for image generation
      } else {
        // No room photo - generate new design with OpenAI
        response = await axios.post(`${API}/generate-quick-design`, {
          description: description,
          product_type: productType,
          style: style,
          room_type: 'bedroom'
        });
      }
      
      if (response.data.image_base64) {
        const isEdited = response.data.edited;
        const assistantMsg = {
          role: 'assistant',
          content: isEdited
            ? (language === 'tr'
              ? '🎨 İşte odanıza özel tasarım! Mobilyayı kendi odanızda görebilirsiniz. Değişiklik yapmamı ister misiniz? (örn: "Rafları ekle", "Rengi değiştir", "Daha fazla çekmece")'
              : '🎨 Here is your personalized design! You can see the furniture in your own room. Would you like me to make any changes?')
            : (language === 'tr'
              ? 'İşte tasarım önerim! Bu görseli beğendiniz mi? Kendi odanızın fotoğrafını yüklerseniz, bu tasarımı odanıza uygulayabilirim.'
              : 'Here is my design suggestion! Do you like it? If you upload a photo of your room, I can apply this design to your space.'),
          generatedImage: response.data.image_base64,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error('Design generation error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: language === 'tr' 
          ? 'Görsel oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
          : 'An error occurred while generating the design. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImages(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle measurement result
  const handleMeasurementComplete = (measurement) => {
    const measurementText = language === 'tr' 
      ? `📏 Ölçüm sonucu: ${measurement.value} cm (${measurement.accuracy})`
      : language === 'de'
      ? `📏 Messergebnis: ${measurement.value} cm (${measurement.accuracy})`
      : `📏 Measurement result: ${measurement.value} cm (${measurement.accuracy})`;
    
    // Add measurement as a user message with the captured image
    const userMessage = {
      role: 'user',
      content: measurementText,
      images: measurement.image ? [measurement.image] : undefined,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Auto-send to AI for context
    setInput(measurementText);
    if (measurement.image) {
      setSelectedImages([measurement.image]);
    }
  };

  return (
    <>
      {/* Measurement Tool Modal */}
      {showMeasurementTool && (
        <MeasurementTool
          onMeasurementComplete={handleMeasurementComplete}
          onClose={() => setShowMeasurementTool(false)}
        />
      )}
      
      <div className="flex flex-col h-full bg-[#121212] rounded-none border border-white/5" data-testid="ai-assistant">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D4AF37]/30">
            <img 
              src="https://images.unsplash.com/photo-1577561776790-1a20c419b1a2?w=100&h=100&fit=crop"
              alt="Design Concierge"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-white font-['Playfair_Display'] text-lg">{t('ai.title')}</h3>
            <p className="text-white/40 text-sm">{t('ai.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-6">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20' 
                    : 'bg-white/5 border border-white/5'
                } p-4 ${msg.isError ? 'border-red-500/30' : ''}`}
              >
                {/* User uploaded images */}
                {msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.images.map((img, imgIdx) => (
                      <img 
                        key={imgIdx}
                        src={img}
                        alt={`Uploaded ${imgIdx + 1}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
                
                {/* Message text */}
                <p className={`text-sm whitespace-pre-wrap ${
                  msg.role === 'user' ? 'text-white' : 'text-white/80'
                }`}>
                  {msg.content}
                </p>
                
                {/* AI Generated Design Image */}
                {msg.generatedImage && (
                  <div className="mt-4 border border-[#D4AF37]/30 rounded-lg overflow-hidden">
                    <div className="bg-[#D4AF37]/10 px-3 py-2 flex items-center gap-2">
                      <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
                        ✨ AI Design Visualization
                      </span>
                    </div>
                    <img 
                      src={`data:image/png;base64,${msg.generatedImage}`}
                      alt="AI Generated Design"
                      className="w-full max-w-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        // Open full size in new tab
                        const w = window.open();
                        w.document.write(`<img src="data:image/png;base64,${msg.generatedImage}" />`);
                      }}
                    />
                    <div className="bg-black/30 px-3 py-2">
                      <p className="text-white/40 text-xs">Click image to view full size</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 p-4 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                <span className="text-white/40 text-sm">{t('ai.thinking')}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="px-6 py-3 border-t border-white/5 bg-white/5">
          <div className="flex flex-wrap gap-2">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative">
                <img src={img} alt={`Selected ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-end space-x-3">
          {/* Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            multiple
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-white/40 hover:text-[#D4AF37] hover:bg-white/5"
            data-testid="upload-image-btn"
          >
            <Image className="w-5 h-5" />
          </Button>

          {/* Voice Input */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={`${isRecording ? 'text-red-500 bg-red-500/10' : 'text-white/40 hover:text-[#D4AF37]'} hover:bg-white/5`}
            data-testid="voice-input-btn"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Measurement Tool */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMeasurementTool(true)}
            className="text-white/40 hover:text-[#D4AF37] hover:bg-white/5"
            data-testid="measurement-tool-btn"
            title={language === 'tr' ? 'Oda Ölçümü' : 'Room Measurement'}
          >
            <Ruler className="w-5 h-5" />
          </Button>

          {/* Generate Design Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGenerateDesign}
            disabled={isGeneratingImage}
            className="text-white/40 hover:text-[#D4AF37] hover:bg-white/5"
            data-testid="generate-design-btn"
            title={language === 'tr' ? 'Tasarım Oluştur' : 'Generate Design'}
          >
            {isGeneratingImage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5" />
            )}
          </Button>

          {/* Text Input */}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.placeholder')}
            className="flex-1 min-h-[44px] max-h-32 bg-[#0A0A0A] border-white/10 focus:border-[#D4AF37] rounded-none text-white placeholder:text-white/20 resize-none"
            data-testid="chat-input"
          />

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={isLoading || isGeneratingImage || (!input.trim() && selectedImages.length === 0)}
            className="bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none h-11 px-6"
            data-testid="send-message-btn"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Generate Design Full Button - More visible */}
        {messages.length > 2 && !isGeneratingImage && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <Button
              onClick={handleGenerateDesign}
              disabled={isGeneratingImage}
              className="w-full bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 rounded-none py-3"
              data-testid="generate-design-full-btn"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {language === 'tr' ? '✨ Tasarım Görseli Oluştur' : '✨ Generate Design Visualization'}
            </Button>
          </div>
        )}
        
        {/* Loading indicator for image generation */}
        {isGeneratingImage && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[#D4AF37]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">
              {language === 'tr' ? 'Tasarım oluşturuluyor... (30-60 sn)' : 'Generating design... (30-60 sec)'}
            </span>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
