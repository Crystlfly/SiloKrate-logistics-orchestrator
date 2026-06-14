import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import TypingIndicator from './TypingIndicator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: "Hello! I am SiloKrate AI. I can help you analyze inventory, track shipments, or manage user access. What do you need help with?",
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newUserMsg = { id: Date.now(), role: 'user', text: inputMessage };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await fetch(`http://${import.meta.env.VITE_SERVER_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: newUserMsg.text,
          history: messages 
        })
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Authentication failed. Please log in again.");
      }

      const data = await response.json();

      const newAiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: data.reply || "Sorry, I couldn't process that.",
      };
      setMessages((prev) => [...prev, newAiMsg]);

    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: "System Error: Unable to reach SiloKrate AI neural net. " + error.message,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end">
      
      {isOpen && (
        <div className="mb-3 sm:mb-4 w-[calc(100vw-2rem)] sm:w-80 md:w-96 h-[calc(100vh-6rem)] sm:h-[500px] max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-120px)] bg-[#0F1219] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-[#161A22] border-b border-zinc-800 p-3 sm:p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Sparkles size={16} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">SiloKrate AI</h3>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-white p-2 sm:p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>

                <div className={`rounded-xl p-3 text-sm break-words overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent ${
                  msg.role === 'user' 
                    ? 'max-w-[85%] sm:max-w-[80%] bg-zinc-800 text-white rounded-tr-sm' 
                    : 'w-full max-w-[95%] sm:max-w-[95%] bg-[#161A22] border border-zinc-800 text-zinc-300 rounded-tl-sm'
                }`}>
                {msg.role === 'user' ? (
                    msg.text
                ) : (
                    <div className="prose prose-invert prose-sm max-w-none text-zinc-300
                      [&>p]:mb-2 
                      [&>ul]:list-disc [&>ul]:ml-4 [&>ul]:mb-2 
                      [&>ol]:list-decimal [&>ol]:ml-4 
                      
                      [&>table]:w-full [&>table]:mt-4 [&>table]:mb-2 [&>table]:border-collapse [&>table]:text-sm [&>table]:mr-6
                      [&>table_th]:border [&>table_th]:border-zinc-700 [&>table_th]:bg-zinc-800/50 [&>table_th]:p-2 [&>table_th]:text-left [&>table_th]:text-zinc-200
                      [&>table_td]:border [&>table_td]:border-zinc-800 [&>table_td]:p-2 [&>table_td]:text-zinc-300">
                      
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>      
                          {msg.text}
                      </ReactMarkdown>
                  </div>
                )}
                </div>
              </div>
            ))}
            
            {/* Typing Indication */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Bot size={12} />
                </div>
                <div className="bg-[#161A22] border border-zinc-800 rounded-xl rounded-tl-sm p-3">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-2 sm:p-3 bg-[#161A22] border-t border-zinc-800 shrink-0">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask SiloKrate AI..."
                className="w-full bg-[#0B0E14] border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-zinc-600"
              />
              <button 
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="absolute right-2 p-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} className="ml-0.5" /> 
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 ${
          isOpen ? 'bg-zinc-800 hover:bg-zinc-700 text-white rotate-90 scale-90' : 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-105 hover:rotate-12'
        }`}
      >
        {isOpen ? <X size={20} className="-rotate-90 sm:w-6 sm:h-6" /> : <MessageSquare size={20} className="sm:w-6 sm:h-6" />}
      </button>
      
    </div>
  );
};

export default ChatWidget;