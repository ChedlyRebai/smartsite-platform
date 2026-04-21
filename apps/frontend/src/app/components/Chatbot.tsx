import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, X, Minimize2, Maximize2, MessageCircle, Loader2,
  Globe, ChevronDown, Zap, Bot, Mic, MicOff, Volume2, VolumeX,
} from 'lucide-react';
import { useLocation } from 'react-router';
import {
  sendToDetectedService,
  sendToService,
  detectBestService,
  SERVICES,
  AiChatMessage,
  ServiceKey,
} from '../action/ai-chat.action';

// ─── i18n ─────────────────────────────────────────────────────────────────────
type Lang = 'en' | 'fr' | 'ar';
const T = {
  en: {
    title: 'SmartSite AI',
    placeholder: 'Ask anything or click 🎤…',
    send: 'Send',
    loading: 'Thinking…',
    error: 'Something went wrong. Please try again.',
    newChat: 'New chat',
    autoDetect: 'Auto-detect service',
    serviceLabel: 'Service',
    online: 'Online',
    welcome: 'Hello! I am your SmartSite AI assistant. Ask me anything by typing or using the microphone.',
    welcomeSub: 'You can also manually select a service below.',
    listening: 'Listening… speak now',
    voiceNotSupported: 'Voice not supported in this browser',
    tapToSpeak: 'Tap to speak',
    tapToStop: 'Tap to stop',
    speaking: 'Speaking…',
  },
  fr: {
    title: 'SmartSite AI',
    placeholder: 'Posez votre question ou cliquez sur 🎤…',
    send: 'Envoyer',
    loading: 'Réflexion…',
    error: 'Une erreur est survenue. Veuillez réessayer.',
    newChat: 'Nouvelle conversation',
    autoDetect: 'Détection automatique',
    serviceLabel: 'Service',
    online: 'En ligne',
    welcome: 'Bonjour ! Je suis votre assistant IA SmartSite. Posez votre question en tapant ou en utilisant le microphone.',
    welcomeSub: 'Vous pouvez aussi sélectionner un service manuellement ci-dessous.',
    listening: 'Écoute en cours… parlez maintenant',
    voiceNotSupported: 'Voix non supportée dans ce navigateur',
    tapToSpeak: 'Appuyez pour parler',
    tapToStop: 'Appuyez pour arrêter',
    speaking: 'Lecture en cours…',
  },
  ar: {
    title: 'SmartSite AI',
    placeholder: 'اسأل أي شيء أو انقر على 🎤…',
    send: 'إرسال',
    loading: 'جاري التفكير…',
    error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    newChat: 'محادثة جديدة',
    autoDetect: 'كشف تلقائي',
    serviceLabel: 'الخدمة',
    online: 'متصل',
    welcome: 'مرحباً! أنا مساعدك الذكي. اسأل بالكتابة أو استخدم الميكروفون.',
    welcomeSub: 'يمكنك أيضاً اختيار خدمة يدوياً أدناه.',
    listening: 'جاري الاستماع… تحدث الآن',
    voiceNotSupported: 'الصوت غير مدعوم في هذا المتصفح',
    tapToSpeak: 'انقر للتحدث',
    tapToStop: 'انقر للإيقاف',
    speaking: 'جاري القراءة…',
  },
};

// ─── Service badge colors ──────────────────────────────────────────────────────
const SERVICE_COLORS: Record<string, string> = {
  'user-authentication':  'bg-blue-100 text-blue-700',
  'gestion-site':         'bg-green-100 text-green-700',
  'gestion-planing':      'bg-purple-100 text-purple-700',
  'incident-management':  'bg-red-100 text-red-700',
  'notification':         'bg-yellow-100 text-yellow-700',
  'gestion-fournisseurs': 'bg-orange-100 text-orange-700',
  'paiement':             'bg-emerald-100 text-emerald-700',
  'materials-service':    'bg-cyan-100 text-cyan-700',
  'resource-optimization':'bg-indigo-100 text-indigo-700',
};

interface Message extends AiChatMessage {
  service?: string;
  serviceLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ChatbotWidget: React.FC<{ className?: string }> = ({ className = '' }) => {
  const location = useLocation();

  // UI state
  const [isOpen, setIsOpen]           = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [language, setLanguage]       = useState<Lang>('fr');
  const [selectedService, setSelectedService] = useState<ServiceKey | 'auto'>('auto');
  const [showServiceMenu, setShowServiceMenu] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AiChatMessage[]>([]);

  // Voice state
  const [isListening, setIsListening]       = useState(false);
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [ttsEnabled, setTtsEnabled]         = useState(true);
  const [interimText, setInterimText]       = useState('');

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLInputElement>(null);
  const recognitionRef  = useRef<SpeechRecognition | null>(null);
  const synthRef        = useRef<SpeechSynthesis | null>(null);

  const t     = T[language];
  const isRTL = language === 'ar';

  // ── Init voice support ──────────────────────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
    synthRef.current = window.speechSynthesis || null;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimText]);

  useEffect(() => {
    if (isOpen && !isMinimized) inputRef.current?.focus();
  }, [isOpen, isMinimized]);

  // ── TTS — speak assistant reply ─────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US';
    utter.rate  = 1;
    utter.pitch = 1;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend   = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utter);
  }, [ttsEnabled, language]);

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  // ── STT — start listening ───────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    // Stop TTS if playing
    stopSpeaking();

    const rec: SpeechRecognition = new SR();
    rec.lang           = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-SA' : 'en-US';
    rec.continuous     = false;
    rec.interimResults = true;

    rec.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) {
        setInput(prev => (prev + ' ' + final).trim());
        setInterimText('');
      } else {
        setInterimText(interim);
      }
    };

    rec.onerror = () => {
      setIsListening(false);
      setInterimText('');
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = rec;
    rec.start();
  }, [language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText('');
  }, []);

  const toggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || isLoading) return;

    stopListening();
    stopSpeaking();

    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setInterimText('');
    setIsLoading(true);

    try {
      const result = selectedService === 'auto'
        ? await sendToDetectedService(text, location.pathname, conversationHistory, language)
        : await sendToService(selectedService, text, conversationHistory, language);

      const assistantMsg: Message = {
        role: 'assistant',
        content: result.reply,
        timestamp: new Date(),
        service: result.service,
        serviceLabel: result.serviceLabel,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: result.reply },
      ]);

      // Auto-speak the reply
      if (ttsEnabled) speak(result.reply);

    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t.error, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    stopSpeaking();
    stopListening();
    setMessages([]);
    setConversationHistory([]);
    setInput('');
    setInterimText('');
  };

  const toggleLanguage = () => {
    const langs: Lang[] = ['fr', 'en', 'ar'];
    setLanguage(l => langs[(langs.indexOf(l) + 1) % 3]);
  };

  const currentAutoService  = selectedService === 'auto' ? detectBestService('', location.pathname) : selectedService;
  const currentServiceLabel = selectedService === 'auto'
    ? `Auto → ${SERVICES[currentAutoService].label}`
    : SERVICES[selectedService].label;

  // ── Closed bubble ────────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none"
          aria-label="Open AI chat"
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-blue-500/30 blur-md opacity-70 motion-safe:animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white" />
          <Bot className="relative w-7 h-7 text-white" />
        </button>
      </div>
    );
  }

  // ── Open widget ──────────────────────────────────────────────────────────────
  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300
        ${isMinimized ? 'w-80 h-14' : 'w-[420px] h-[660px]'}
        ${isRTL ? 'left-6 right-auto' : ''}
        ${className}`}
    >
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-3 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">{t.title}</p>
            <p className="text-blue-100 text-xs truncate">{t.online} • {currentServiceLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={toggleLanguage} className="p-2 hover:bg-white/10 rounded-lg" title="Language">
            <Globe className="w-4 h-4 text-white" />
          </button>
          {/* TTS toggle */}
          <button
            onClick={() => { setTtsEnabled(v => !v); if (isSpeaking) stopSpeaking(); }}
            className="p-2 hover:bg-white/10 rounded-lg"
            title={ttsEnabled ? 'Désactiver la lecture vocale' : 'Activer la lecture vocale'}
          >
            {ttsEnabled
              ? <Volume2 className="w-4 h-4 text-white" />
              : <VolumeX className="w-4 h-4 text-white/50" />
            }
          </button>
          <button onClick={handleNewChat} className="p-2 hover:bg-white/10 rounded-lg" title={t.newChat}>
            <MessageCircle className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setIsMinimized(v => !v)} className="p-2 hover:bg-white/10 rounded-lg">
            {isMinimized ? <Maximize2 className="w-4 h-4 text-white" /> : <Minimize2 className="w-4 h-4 text-white" />}
          </button>
          <button onClick={() => { setIsOpen(false); stopSpeaking(); stopListening(); }} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* ── Service selector ── */}
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 relative">
            <button
              onClick={() => setShowServiceMenu(v => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-gray-700 font-medium text-xs">{t.serviceLabel} :</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  selectedService === 'auto' ? 'bg-blue-100 text-blue-700'
                  : SERVICE_COLORS[selectedService] || 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedService === 'auto' ? t.autoDetect : SERVICES[selectedService].label}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showServiceMenu ? 'rotate-180' : ''}`} />
            </button>

            {showServiceMenu && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => { setSelectedService('auto'); setShowServiceMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${selectedService === 'auto' ? 'bg-blue-50' : ''}`}
                >
                  <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-medium text-blue-700">{t.autoDetect}</span>
                  {selectedService === 'auto' && <span className="ml-auto text-blue-500 text-xs">✓</span>}
                </button>
                <div className="border-t border-gray-100" />
                <div className="max-h-52 overflow-y-auto">
                  {(Object.keys(SERVICES) as ServiceKey[]).map(key => (
                    <button
                      key={key}
                      onClick={() => { setSelectedService(key); setShowServiceMenu(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedService === key ? 'bg-gray-50' : ''}`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${SERVICE_COLORS[key]?.split(' ')[0] || 'bg-gray-300'}`} />
                      <span className="text-gray-700">{SERVICES[key].label}</span>
                      <span className="ml-auto text-xs text-gray-400 truncate max-w-[100px]">{key}</span>
                      {selectedService === key && <span className="text-blue-500 text-xs ml-1">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Messages ── */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
            onClick={() => setShowServiceMenu(false)}
          >
            {messages.length === 0 && (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-7 h-7 text-blue-600" />
                </div>
                <h4 className="text-gray-800 font-semibold mb-1 text-sm">{t.title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed mb-1 px-4">{t.welcome}</p>
                <p className="text-gray-400 text-xs px-4">{t.welcomeSub}</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center px-2">
                  {[
                    language === 'fr' ? 'Comment créer un site ?' : language === 'ar' ? 'كيف أنشئ موقعاً؟' : 'How to create a site?',
                    language === 'fr' ? 'Signaler un incident' : language === 'ar' ? 'الإبلاغ عن حادث' : 'Report an incident',
                    language === 'fr' ? 'Gérer les matériaux' : language === 'ar' ? 'إدارة المواد' : 'Manage materials',
                    language === 'fr' ? 'Statut des paiements' : language === 'ar' ? 'حالة المدفوعات' : 'Payment status',
                  ].map((s, i) => (
                    <button key={i} onClick={() => handleSend(s)}
                      className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
                <div className={`max-w-[85%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'assistant' && msg.serviceLabel && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SERVICE_COLORS[msg.service || ''] || 'bg-gray-100 text-gray-500'}`}>
                      {msg.serviceLabel}
                    </span>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  {/* Re-read button for assistant */}
                  {msg.role === 'assistant' && synthRef.current && (
                    <button
                      onClick={() => speak(msg.content)}
                      className="text-[10px] text-gray-400 hover:text-blue-500 flex items-center gap-1 px-1"
                    >
                      <Volume2 className="w-3 h-3" /> Relire
                    </button>
                  )}
                  <span className="text-[10px] text-gray-400 px-1">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-500">{t.loading}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Voice listening indicator ── */}
          {(isListening || interimText) && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
              <div className="flex gap-0.5 items-end h-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-1 bg-blue-500 rounded-full animate-pulse"
                    style={{ height: `${Math.random() * 12 + 4}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <span className="text-xs text-blue-600 flex-1 truncate">
                {interimText || t.listening}
              </span>
              <button onClick={stopListening} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                Stop
              </button>
            </div>
          )}

          {/* ── Speaking indicator ── */}
          {isSpeaking && (
            <div className="px-4 py-1.5 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 flex-1">{t.speaking}</span>
              <button onClick={stopSpeaking} className="text-xs text-emerald-500 hover:text-emerald-700 font-medium">
                Stop
              </button>
            </div>
          )}

          {/* ── Input ── */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              {/* Mic button */}
              {voiceSupported ? (
                <button
                  onClick={toggleVoice}
                  title={isListening ? t.tapToStop : t.tapToSpeak}
                  className={`p-2.5 rounded-xl transition-all shrink-0 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  {isListening
                    ? <MicOff className="w-5 h-5 text-white" />
                    : <Mic className="w-5 h-5" />
                  }
                </button>
              ) : (
                <button disabled title={t.voiceNotSupported}
                  className="p-2.5 rounded-xl bg-gray-100 text-gray-300 cursor-not-allowed shrink-0">
                  <Mic className="w-5 h-5" />
                </button>
              )}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={t.placeholder}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
              />

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-xl transition-colors shrink-0"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Voice hint */}
            {voiceSupported && !isListening && messages.length === 0 && (
              <p className="text-center text-[10px] text-gray-400 mt-1.5">
                🎤 {language === 'fr' ? 'Cliquez sur le micro pour parler' : language === 'ar' ? 'انقر على الميكروفون للتحدث' : 'Click the mic to speak'}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatbotWidget;
