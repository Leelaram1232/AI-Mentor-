'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { chatWithMentor } from '@/utils/groqApi';
import { saveChatMessage } from '@/utils/authClient';

export default function FloatingMentor() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your AI Career Mentor. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 550 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Initial position fix for different screens
  useEffect(() => {
    setPos({ x: window.innerWidth - 420, y: window.innerHeight - 550 });
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (user) await saveChatMessage(user.id, 'user', userMsg.content);
      const res = await chatWithMentor([...messages, userMsg], profile);
      const aiMsg = { role: 'assistant', content: res };
      setMessages(prev => [...prev, aiMsg]);
      if (user) await saveChatMessage(user.id, 'assistant', res);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const onDragStart = (e) => {
    if (window.innerWidth < 768) return;
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging) return;
      setPos({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      });
    };
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="pop-in"
        style={{
          position: 'fixed', bottom: '90px', right: '20px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'var(--primary-blue)', color: 'white',
          border: 'none', boxShadow: '0 8px 32px var(--primary-blue-glow)',
          cursor: 'pointer', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', transition: 'all 0.3s'
        }}
      >
        👩‍🏫
      </button>
    );
  }

  return (
    <div className="pop-in" style={{
      position: 'fixed', 
      left: isMobile ? 0 : pos.x, 
      top: isMobile ? 'auto' : pos.y, 
      bottom: isMobile ? 0 : 'auto',
      width: isMobile ? '100%' : '380px', 
      zIndex: 10000,
    }}>
      <div className="glass-panel" style={{
        borderRadius: isMobile ? '24px 24px 0 0' : 16, overflow: 'hidden',
        display: 'flex', flexDirection: 'column', height: isMobile ? '70vh' : '500px',
        boxShadow: '0 20px 80px rgba(0,0,0,0.3)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'
      }}>
        {/* Header */}
        <div onMouseDown={onDragStart} style={{
          background: 'linear-gradient(90deg, var(--bg-primary), var(--primary-blue-light))',
          padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>👩‍🏫</span>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>AI Pop Mentor</span>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {/* Chat Content */}
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.02)' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 16, fontSize: '0.85rem', lineHeight: 1.5,
                background: m.role === 'user' ? 'var(--primary-blue)' : 'var(--card-bg)',
                color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                border: m.role === 'user' ? 'none' : '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', background: 'var(--card-bg)', borderRadius: 12, display: 'flex', gap: 4 }}>
              <div className="dot" style={{ width: 6, height: 6, background: 'var(--primary-blue)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
              <div className="dot" style={{ width: 6, height: 6, background: 'var(--primary-blue)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></div>
              <div className="dot" style={{ width: 6, height: 6, background: 'var(--primary-blue)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)' }}>
          <input 
            value={input} onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            style={{
              flex: 1, padding: '0.6rem 1rem', borderRadius: 12,
              border: '2px solid var(--border-color)', background: 'var(--input-bg)',
              color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem'
            }}
          />
          <button 
            onClick={handleSend}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
