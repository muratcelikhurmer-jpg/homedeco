import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Send, Image, Mic, MicOff, Loader2, X, Ruler } from 'lucide-react';
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
                className={`max-w-[80%] ${
                  msg.role === 'user' 
                    ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20' 
                    : 'bg-white/5 border border-white/5'
                } p-4 ${msg.isError ? 'border-red-500/30' : ''}`}
              >
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
                <p className={`text-sm whitespace-pre-wrap ${
                  msg.role === 'user' ? 'text-white' : 'text-white/80'
                }`}>
                  {msg.content}
                </p>
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
            disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
            className="bg-[#D4AF37] text-black hover:bg-[#C5A028] rounded-none h-11 px-6"
            data-testid="send-message-btn"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
