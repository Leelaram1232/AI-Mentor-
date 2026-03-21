'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { getChatHistory, saveChatMessage, clearChatHistory } from '@/utils/authClient';
import { chatWithMentor, voiceChatWithMentor } from '@/utils/groqApi';
import useDashboardStore from '@/store/dashboardStore';
import { jsPDF } from 'jspdf';

const FormattedMessage = ({ content }) => {
  if (!content) return null;

  // Split content by potential table blocks
  const parts = content.split(/(\|[^\n]+\|\n\|[- :|]+\|\n(?!(?:\|[^\n]+\|\n)).+)/s);

  return (
    <>
      {parts.map((part, i) => {
        // Detect if part is a table
        if (part.trim().startsWith('|') && part.includes('| ---')) {
          const rows = part.trim().split('\n');
          const header = rows[0].split('|').filter(cell => cell.trim() !== '');
          const dataRows = rows.slice(2).map(row => row.split('|').filter(cell => cell.trim() !== ''));

          return (
            <div key={i} style={{ overflowX: 'auto', margin: '1rem 0', borderRadius: 12, border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(59, 130, 246, 0.1)', borderBottom: '2px solid var(--border-color)' }}>
                    {header.map((h, hi) => <th key={hi} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--primary-blue)' }}>{h.trim()}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--border-color)', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      {row.map((cell, ci) => <td key={ci} style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{cell.trim()}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Handle other markdown bits (bold, newlines)
        return (
          <div key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: i < parts.length - 1 ? '1rem' : 0 }}>
            {part.split('\n').map((line, li) => (
              <p key={li} style={{ margin: '0 0 0.5rem 0' }}>
                {line.split(/(\*\*[^*]+\*\*)/).map((segment, si) => {
                  if (segment.startsWith('**') && segment.endsWith('**')) {
                    return <strong key={si} style={{ color: 'var(--primary-blue)', fontWeight: 700 }}>{segment.slice(2, -2)}</strong>;
                  }
                  return segment;
                })}
              </p>
            ))}
          </div>
        );
      })}
    </>
  );
};

// Language code mapping for Speech API
const SPEECH_LANG_CODES = {
  'English': 'en-US', 'Hindi': 'hi-IN', 'Telugu': 'te-IN', 'Tamil': 'ta-IN',
  'Kannada': 'kn-IN', 'Bengali': 'bn-IN', 'Marathi': 'mr-IN', 'Gujarati': 'gu-IN',
  'Malayalam': 'ml-IN', 'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE', 'Japanese': 'ja-JP',
};

export default function AIMentorTab() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('chat'); // 'chat' | 'voice'
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle'); // idle | listening | thinking | speaking
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [hasExactVoiceMatch, setHasExactVoiceMatch] = useState(true);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const voiceTranscriptRef = useRef('');
  const messagesRef = useRef([]);
  const { mentorTopic, setMentorTopic } = useDashboardStore();
  const [activeExplanation, setActiveExplanation] = useState(null);

  useEffect(() => { voiceTranscriptRef.current = voiceTranscript; }, [voiceTranscript]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const preferredLanguage = profile?.preferred_language || 'English';
  const speechLangCode = SPEECH_LANG_CODES[preferredLanguage] || 'en-US';

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const history = await getChatHistory(user.id);
        setMessages(history.map(m => ({ role: m.role, content: m.content })));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [user]);

  // Handle roadmap topic explanation request
  useEffect(() => {
    if (mentorTopic && profile) {
      setMode('voice');
      const triggerExplanation = async () => {
        const topic = mentorTopic;
        setMentorTopic(null); // Clear it so it doesn't re-trigger
        const promptText = `Explain the topic: "${topic}" in detail.`;
        const userMsg = { role: 'user', content: promptText, isVoice: true };
        setMessages(prev => [...prev, userMsg]);
        setVoiceStatus('thinking');
        
        try {
          await saveChatMessage(user.id, 'user', userMsg.content);
          const response = await voiceChatWithMentor([...messagesRef.current, userMsg], profile);
          const aiMsg = { role: 'assistant', content: response, isVoice: true, isExplanation: true, topic: topic };
          setMessages(prev => [...prev, aiMsg]);
          await saveChatMessage(user.id, 'assistant', response);
          setActiveExplanation(aiMsg);
          speakText(response);
        } catch (e) {
          setVoiceStatus('idle');
          console.error(e);
        }
      };
      triggerExplanation();
    }
  }, [mentorTopic, profile]);

  const downloadExplanationAsPDF = (msg) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text('AI Mentor', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Topic Explanation', 105, 30, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Topic: ${msg.topic || 'General Guidance'}`, 20, 45);
    
    let y = 60;
    const lines = msg.content.split('\n');
    lines.forEach(line => {
      if (line.includes('|')) {
        doc.setFont('courier', 'normal'); // Use courier for tables
      } else {
        doc.setFont('helvetica', 'normal');
      }
      const splitLine = doc.splitTextToSize(line, 170);
      doc.text(splitLine, 20, y);
      y += (splitLine.length * 7);
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated via AI Mentor Voice Assistant on ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
    
    doc.save(`Explanation_${(msg.topic || 'Mentor').replace(/\s+/g, '_')}.pdf`);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Initialize speech synthesis ref and load voices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        if (!synthRef.current) return;
        const voices = synthRef.current.getVoices();
        
        // 1. Precise match by lang prefix (e.g., 'te')
        const langPrefix = speechLangCode.split('-')[0].toLowerCase();
        let filtered = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
        
        // 2. Fallback: Search for language name in the voice name (e.g., "Telugu")
        if (filtered.length === 0) {
          const langName = Object.keys(SPEECH_LANG_CODES).find(key => SPEECH_LANG_CODES[key] === speechLangCode);
          if (langName) {
            filtered = voices.filter(v => 
              v.name.toLowerCase().includes(langName.toLowerCase()) || 
              v.lang.toLowerCase().includes(langPrefix)
            );
          }
        }
        
        if (filtered.length === 0) {
          setHasExactVoiceMatch(false);
          filtered = voices; // Fallback to all if nothing found
        } else {
          setHasExactVoiceMatch(true);
        }
        
        // Sort: Prioritize "Natural" or "Google" or "Microsoft" voices if available
        filtered.sort((a, b) => {
          const aLower = a.name.toLowerCase();
          const bLower = b.name.toLowerCase();
          if (aLower.includes('natural') && !bLower.includes('natural')) return -1;
          if (!aLower.includes('natural') && bLower.includes('natural')) return 1;
          if (aLower.includes('google') && !bLower.includes('google')) return -1;
          return 0;
        });

        setAvailableVoices(filtered);
        
        const savedVoice = localStorage.getItem(`mentor_voice_${speechLangCode}`);
        setSelectedVoiceURI(prev => {
          // If we have a saved voice for this language, use it
          if (savedVoice && filtered.some(v => v.voiceURI === savedVoice)) return savedVoice;
          // If the current selected voice is valid for this language, keep it
          if (filtered.some(v => v.voiceURI === prev)) return prev;
          // Default to the first found language voice
          return filtered.length > 0 ? filtered[0].voiceURI : '';
        });
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, [speechLangCode]);

  const handleVoiceSelect = (uri) => {
    setSelectedVoiceURI(uri);
    localStorage.setItem(`mentor_voice_${speechLangCode}`, uri);
  };

  // ─── TEXT CHAT (always English) ──────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      await saveChatMessage(user.id, 'user', userMsg.content);
      const response = await chatWithMentor([...messages, userMsg], profile);
      const aiMsg = { role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMsg]);
      await saveChatMessage(user.id, 'assistant', response);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally { setSending(false); }
  };

  const handleClear = async () => {
    try { await clearChatHistory(user.id); setMessages([]); } catch (e) { console.error(e); }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // ─── VOICE COMMUNICATION (in preferred language) ─────────────────────────
  const speakText = useCallback((text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    
    // Improved markdown stripping for TTS
    const cleanText = text
      .replace(/[#*`_~]/g, '') // Strip symbols
      .replace(/\|/g, ' ') // Strip table pipes
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Strip links
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = speechLangCode;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Set voice with robust matching
    const voices = synthRef.current.getVoices();
    let bestVoice = null;

    if (selectedVoiceURI) {
      bestVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
    }

    if (!bestVoice) {
      const langPrefix = speechLangCode.split('-')[0].toLowerCase();
      const langName = Object.keys(SPEECH_LANG_CODES).find(key => SPEECH_LANG_CODES[key] === speechLangCode);
      
      // Try to find by lang prefix
      bestVoice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
      
      // Try to find by name if prefix failed
      if (!bestVoice && langName) {
        bestVoice = voices.find(v => v.name.toLowerCase().includes(langName.toLowerCase()));
      }
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
      // Important: some browsers need the lang to match the voice exactly or it ignores the voice
      utterance.lang = bestVoice.lang;
    }

    utterance.onstart = () => { setIsSpeaking(true); setVoiceStatus('speaking'); };
    utterance.onend = () => { setIsSpeaking(false); setVoiceStatus('idle'); };
    utterance.onerror = () => { setIsSpeaking(false); setVoiceStatus('idle'); };

    synthRef.current.speak(utterance);
  }, [speechLangCode, selectedVoiceURI]);

  const stopSpeaking = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    setVoiceStatus('idle');
  };
  
  // Voice text input state
  const [voiceTextInput, setVoiceTextInput] = useState('');

  const submitVoiceText = async () => {
    if (!voiceTextInput.trim() || sending) return;
    const finalText = voiceTextInput.trim();
    
    // Stop any ongoing speech/listening
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    
    setVoiceStatus('thinking');
    setVoiceTextInput('');
    const userMsg = { role: 'user', content: finalText, isVoice: true };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    
    try {
      await saveChatMessage(user.id, 'user', userMsg.content);
      const response = await voiceChatWithMentor(updatedMessages, profile);
      const aiMsg = { role: 'assistant', content: response, isVoice: true };
      
      setMessages(prev => [...prev, aiMsg]);
      await saveChatMessage(user.id, 'assistant', response);
      speakText(response);
    } catch (e) {
      setVoiceStatus('idle');
      console.error(e);
    }
  };

  const handleVoiceKeyPress = (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      submitVoiceText(); 
    } 
  };

  const handleVoiceInput = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    // Stop any ongoing speech
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);

    const recognition = new SpeechRecognition();
    recognition.lang = speechLangCode;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('listening');
      setVoiceTranscript('');
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);
    };

    recognition.onend = async () => {
      setIsListening(false);
      // Use the ref since the closure might have a stale value for voiceTranscript
      const finalText = voiceTranscriptRef.current;
      
      if (!finalText || !finalText.trim()) {
        setVoiceStatus('idle');
        setVoiceTranscript('');
        return;
      }
      
      setVoiceStatus('thinking');
      const userMsg = { role: 'user', content: finalText.trim(), isVoice: true };
      
      // Calculate new messages array instead of relying on functional state
      // Use the messages ref to avoid stale closure state
      const updatedMessages = [...messagesRef.current, userMsg];
      setMessages(updatedMessages);
      
      try {
        await saveChatMessage(user.id, 'user', userMsg.content);
        
        // Pass the updated array explicitly
        const response = await voiceChatWithMentor(updatedMessages, profile);
        const aiMsg = { role: 'assistant', content: response, isVoice: true };
        
        setMessages(prev => [...prev, aiMsg]);
        await saveChatMessage(user.id, 'assistant', response);
        speakText(response);
      } catch (e) {
        setVoiceStatus('idle');
        console.error(e);
      }
      setVoiceTranscript('');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setVoiceStatus('idle');
      setVoiceTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechLangCode, isListening, profile, user, speakText]);

  const suggested = ['🗺️ What skills should I learn first?', '📝 How should I prepare my resume?', '🎯 How to prepare for interviews?', '💼 What projects should I build?', '📈 What careers are in demand?', '🚀 How to get my first internship?'];

  // Voice status display
  const voiceStatusLabel = {
    idle: 'Tap microphone to speak',
    listening: `Listening in ${preferredLanguage}...`,
    thinking: 'AI is thinking...',
    speaking: `Speaking in ${preferredLanguage}...`,
  };

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 2 }}>🤖 AI Career Mentor</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            {mode === 'chat' ? 'Chat in English • Type your questions' : `Voice in ${preferredLanguage} • Speak naturally`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Mode Toggle */}
          <div style={{
            display: 'flex', borderRadius: 10, overflow: 'hidden',
            border: '2px solid var(--border-color)', background: 'var(--glass-bg)',
          }}>
            <button onClick={() => { setMode('chat'); stopSpeaking(); }} style={{
              padding: '0.45rem 0.85rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
              fontFamily: 'Outfit, sans-serif', fontWeight: 600, transition: 'all 0.2s',
              background: mode === 'chat' ? 'var(--primary-blue)' : 'transparent',
              color: mode === 'chat' ? '#fff' : 'var(--text-secondary)',
            }}>💬 Chat</button>
            <button onClick={() => setMode('voice')} style={{
              padding: '0.45rem 0.85rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
              fontFamily: 'Outfit, sans-serif', fontWeight: 600, transition: 'all 0.2s',
              background: mode === 'voice' ? 'var(--primary-blue)' : 'transparent',
              color: mode === 'voice' ? '#fff' : 'var(--text-secondary)',
            }}>🎙️ Voice</button>
          </div>
          {messages.length > 0 && (
            <button onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>Clear</button>
          )}
        </div>
      </div>

      {/* ═══════════════ CHAT MODE ═══════════════ */}
      {mode === 'chat' && (
        <>
          {/* Messages */}
          <div className="glass-card" style={{ borderRadius: 16, padding: '1rem', minHeight: 400, maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="ai-loader" style={{ width: 60, height: 60 }}>
                  <div className="ai-ring"></div><div className="ai-ring"></div><div className="ai-ring"></div>
                  <span className="ai-brain" style={{ fontSize: '1.2rem' }}>🧠</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🧠</div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Hi! I'm your AI Career Mentor</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto 1rem' }}>
                  I can help you with career guidance, interview prep, skill development, and more!
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                  {suggested.map((q, i) => (
                    <span key={i} className="skill-pill" onClick={() => setInput(q.replace(/^[^\s]+\s/, ''))}
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}>{q}</span>
                  ))}
                </div>
              </div>
            ) : (
              messages.filter(m => !m.isVoice).map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                    <FormattedMessage content={msg.content} />
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div className="chat-bubble-ai" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(i => (<span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-secondary)', animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your career... (English)"
              rows={1}
              style={{
                flex: 1, padding: '0.85rem 1rem', borderRadius: 12,
                border: '2px solid var(--border-color)', background: 'var(--input-bg)',
                color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif',
                resize: 'none', outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button className="btn-ce btn-ce-primary" onClick={handleSend} disabled={!input.trim() || sending}
              style={{ padding: '0 1.25rem', minWidth: 0, fontSize: '1.2rem' }}>
              {sending ? '...' : '→'}
            </button>
          </div>
        </>
      )}

      {/* ═══════════════ VOICE MODE ═══════════════ */}
      {mode === 'voice' && (
        <div className="glass-card" style={{ borderRadius: 16, padding: '2rem', textAlign: 'center', minHeight: 450, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          {/* ─── NEW AI VOICE VISUALIZER ─── */}
          <div style={{ marginBottom: '2rem', marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
            
            {/* The visualizer container becomes the clickable button */}
            <div 
              style={{
                width: 240, height: 240, 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
              }}
              onClick={() => {
                if (voiceStatus === 'idle') handleVoiceInput();
                else if (voiceStatus === 'listening') recognitionRef.current?.stop();
                else if (voiceStatus === 'speaking' || voiceStatus === 'thinking') stopSpeaking();
              }}
            >
              
              {/* STATE 1: IDLE / THINKING / SPEAKING -> GLOWING ORB */}
              {voiceStatus !== 'listening' && (
                <div className={`ai-orb ${voiceStatus}`}>
                  <div className="orb-core">
                    <div className="orb-particles"></div>
                  </div>
                  <div className="orb-ring ring-1"></div>
                  <div className="orb-ring ring-2"></div>
                  <div className="orb-glow"></div>
                </div>
              )}

              {/* STATE 2: LISTENING -> MULTICOLOR WAVEFORM */}
              {voiceStatus === 'listening' && (
                <div className="ai-waveform">
                  <div className="wave wave-blue"></div>
                  <div className="wave wave-red"></div>
                  <div className="wave wave-green"></div>
                  <div className="wave wave-cyan"></div>
                  <div className="wave wave-blue-light"></div>
                </div>
              )}
              
            </div>
          </div>

          {/* Status Label */}
          <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            {voiceStatusLabel[voiceStatus]}
          </div>

          {availableVoices.length > 1 && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Voice Type:</span>
              <select 
                value={selectedVoiceURI} 
                onChange={(e) => handleVoiceSelect(e.target.value)}
                style={{
                  padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                  border: '1px solid var(--border-color)', background: 'var(--glass-bg)',
                  color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', minWidth: '180px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {availableVoices.map(voice => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Missing Language Pack Warning */}
          {!hasExactVoiceMatch && preferredLanguage !== 'English' && (
            <div style={{ padding: '0.6rem', marginBottom: '1.5rem', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem', color: 'var(--text-primary)', maxWidth: '400px' }}>
              ⚠️ Defaulting to an English voice. Your device/browser doesn't have a <strong>{preferredLanguage}</strong> voice installed. 
              <br/><em>Tip: Try using <strong>Google Chrome</strong> or installing the {preferredLanguage} language pack in Windows Settings.</em>
            </div>
          )}

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {voiceStatus === 'idle' && `Click the orb to start`}
            {voiceStatus === 'listening' && 'Listening intently... Click to stop.'}
            {voiceStatus === 'thinking' && 'Processing your question...'}
            {voiceStatus === 'speaking' && 'Click the orb to interrupt'}
          </div>

          {/* Transcript / Current Voice Text */}
          {voiceTranscript && (
            <div style={{
              width: '100%', maxWidth: 500,
              padding: '1rem 1.25rem', borderRadius: 12, marginBottom: '1rem',
              background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-primary)',
              textAlign: 'left',
            }}>
              <span style={{ color: 'var(--primary-blue)', fontWeight: 600, fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>
                🎤 You're saying:
              </span>
              "{voiceTranscript}"
            </div>
          )}

          {/* Recent Voice Conversation */}
          <div style={{ width: '100%', maxWidth: 650, textAlign: 'left', maxHeight: '350px', overflowY: 'auto', padding: '0.5rem' }} className="no-scrollbar">
            {messages.filter(m => m.isVoice).slice(-8).map((msg, idx) => (
              <div key={idx} style={{
                padding: '1rem', borderRadius: 16, marginBottom: '0.75rem',
                background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                border: msg.role === 'user' ? '1px solid rgba(59, 130, 246, 0.1)' : '1px solid var(--border-color)',
                borderLeft: `4px solid ${msg.role === 'user' ? 'var(--primary-blue)' : 'var(--success-green)'}`,
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: msg.role === 'user' ? 'var(--primary-blue)' : 'var(--success-green)', display: 'block', marginBottom: 6 }}>
                  {msg.role === 'user' ? '🎤 YOU' : `🔊 AI MENTOR (${preferredLanguage})`}
                </span>
                <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                  <FormattedMessage content={msg.content} />
                </div>
                
                {msg.isExplanation && (
                  <button 
                    onClick={() => downloadExplanationAsPDF(msg)}
                    style={{
                      display: 'block', marginTop: '0.5rem', background: 'var(--primary-blue)',
                      color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px',
                      fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600
                    }}
                  >
                    📥 Download Summary (PDF)
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Voice Text Input Option */}
          <div style={{ width: '100%', maxWidth: 500, marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <textarea 
              value={voiceTextInput} 
              onChange={e => setVoiceTextInput(e.target.value)} 
              onKeyDown={handleVoiceKeyPress}
              placeholder={`Or type in English (AI replies in ${preferredLanguage})...`}
              rows={1}
              style={{
                flex: 1, padding: '0.85rem 1rem', borderRadius: 12,
                border: '2px solid var(--border-color)', background: 'var(--input-bg)',
                color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif',
                resize: 'none', outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary-blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button className="btn-ce btn-ce-primary" onClick={submitVoiceText} disabled={!voiceTextInput.trim() || voiceStatus === 'thinking' || voiceStatus === 'listening'}
              style={{ padding: '0 1.25rem', minWidth: 0, fontSize: '1.2rem', opacity: (!voiceTextInput.trim() || voiceStatus === 'thinking' || voiceStatus === 'listening') ? 0.5 : 1 }}>
              →
            </button>
          </div>
          
        </div>
      )}

      {/* ─── NEW CSS ANIMATIONS FOR VOICE VISUALIZER ─── */}
      <style jsx>{`
        /* GLOWING ORB STYLES (Idle, Thinking, Speaking) */
        .ai-orb {
          position: relative;
          width: 180px; height: 180px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.5s ease;
        }

        /* Idle State - gentle glow */
        .ai-orb.idle .orb-glow { opacity: 0.4; transform: scale(0.9); }
        .ai-orb.idle .orb-core { box-shadow: 0 0 30px rgba(37, 99, 235, 0.4) inset; }

        /* Thinking State - pulsing intense glow */
        .ai-orb.thinking { animation: orbPulse 2s ease-in-out infinite; }
        .ai-orb.thinking .orb-glow { opacity: 0.8; background: radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%); }
        .ai-orb.thinking .orb-core { box-shadow: 0 0 50px rgba(139, 92, 246, 0.6) inset; border-color: rgba(139,92,246,0.5); }
        .ai-orb.thinking .orb-particles { animation: spin 4s linear infinite; background-image: radial-gradient(purple 1px, transparent 1px); }

        /* Speaking State - audio reactive pulse */
        .ai-orb.speaking { animation: orbSpeak 0.8s ease-in-out infinite alternate; }
        .ai-orb.speaking .orb-glow { opacity: 0.9; background: radial-gradient(circle, rgba(16,185,129,0.5) 0%, transparent 70%); }
        .ai-orb.speaking .orb-core { box-shadow: 0 0 60px rgba(16, 185, 129, 0.5) inset; border-color: rgba(16,185,129,0.5); }
        .ai-orb.speaking .orb-particles { animation: spin 2s linear infinite reverse; background-image: radial-gradient(green 1px, transparent 1px); }

        .orb-core {
          position: relative;
          width: 120px; height: 120px;
          background: #000; /* Dark core representing the AI */
          border-radius: 50%;
          border: 2px solid rgba(37, 99, 235, 0.4);
          overflow: hidden;
          z-index: 10;
          box-shadow: 0 0 40px rgba(37, 99, 235, 0.6) inset;
          transition: all 0.3s ease;
        }

        .orb-particles {
          position: absolute;
          width: 200%; height: 200%;
          top: -50%; left: -50%;
          background-image: radial-gradient(rgba(96, 165, 250, 0.8) 1px, transparent 1px);
          background-size: 8px 8px;
          opacity: 0.6;
          animation: spin 10s linear infinite;
        }

        .orb-glow {
          position: absolute;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.5) 0%, transparent 65%);
          border-radius: 50%;
          z-index: 1;
          filter: blur(10px);
          transition: all 0.5s ease;
        }

        .orb-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px dashed rgba(59, 130, 246, 0.4);
          z-index: 5;
        }

        .ring-1 {
          width: 140px; height: 140px;
          animation: spin 8s linear infinite reverse;
        }

        .ring-2 {
          width: 160px; height: 160px;
          border: 1px dotted rgba(96, 165, 250, 0.3);
          animation: spin 12s linear infinite;
        }

        /* WAVEFORM STYLES (Listening Mode) */
        .ai-waveform {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 80px;
          width: 100%;
        }

        .wave {
          width: 18px;
          border-radius: 10px;
          background: var(--primary-blue);
          animation: waveAnim 1s ease-in-out infinite alternate;
        }

        .wave-blue { height: 20px; background: #3b82f6; animation-delay: 0.1s; }
        .wave-red { height: 40px; background: #ef4444; animation-delay: 0.3s; box-shadow: 0 0 10px #ef4444; }
        .wave-green { height: 60px; background: #10b981; animation-delay: 0.5s; box-shadow: 0 0 15px #10b981; }
        .wave-cyan { height: 35px; background: #06b6d4; animation-delay: 0.2s; box-shadow: 0 0 10px #06b6d4; }
        .wave-blue-light { height: 25px; background: #60a5fa; animation-delay: 0.4s; }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes orbPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes orbSpeak {
          0% { transform: scale(1); filter: brightness(1); }
          100% { transform: scale(1.15); filter: brightness(1.3); }
        }

        @keyframes waveAnim {
          0% { height: 10px; opacity: 0.5; }
          100% { height: 75px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
