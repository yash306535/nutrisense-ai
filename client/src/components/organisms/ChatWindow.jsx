import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Bot } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { aiAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import Avatar from '../atoms/Avatar';
import Spinner from '../atoms/Spinner';
import { formatTime } from '../../utils/formatters';
import { QUICK_REPLIES } from '../../utils/constants';

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-slate-100 rounded-2xl rounded-tl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-slate-400 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function ChatWindow() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => aiAPI.getChatHistory({ limit: 30 }).then((r) => r.data.data),
    onSuccess: (data) => setLocalMessages(data.messages || []),
  });

  useEffect(() => {
    if (historyData?.messages) setLocalMessages(historyData.messages);
  }, [historyData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isTyping]);

  const sendMutation = useMutation({
    mutationFn: (msg) => aiAPI.chat({ message: msg }),
    onMutate: (msg) => {
      const userMsg = { role: 'user', content: msg, createdAt: new Date().toISOString(), _id: Date.now().toString() };
      setLocalMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setMessage('');
    },
    onSuccess: (res) => {
      const reply = res.data.data.reply;
      const botMsg = { role: 'assistant', content: reply, createdAt: new Date().toISOString(), _id: (Date.now() + 1).toString() };
      setLocalMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    },
    onError: () => {
      setIsTyping(false);
      toast.error('Failed to get response. Try again.');
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => aiAPI.clearChatHistory(),
    onSuccess: () => {
      setLocalMessages([]);
      qc.invalidateQueries({ queryKey: ['chat-history'] });
    },
  });

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <Bot size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary" style={{ fontFamily: 'Sora' }}>NutriBot</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-text-muted">AI Dietitian · Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
          className="p-2 rounded-xl text-text-muted hover:text-error hover:bg-error/10 transition-colors"
          title="Clear chat"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

        {localMessages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🤖</div>
            <h3 className="font-bold text-text-primary mb-1">Hi, I'm NutriBot!</h3>
            <p className="text-text-muted text-sm">Your personal AI dietitian. Ask me anything about nutrition!</p>
          </div>
        )}

        <AnimatePresence>
          {localMessages.map((msg, idx) => (
            <motion.div
              key={msg._id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-accent" />
                </div>
              )}
              {msg.role === 'user' && <Avatar src={user?.avatar} name={user?.name} size="sm" />}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-white text-text-primary rounded-tl-sm shadow-sm border border-slate-100'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-text-muted px-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2">
            <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
              <Bot size={14} className="text-accent" />
            </div>
            <TypingDots />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Replies */}
      {localMessages.length === 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-slate-100 bg-white">
          {QUICK_REPLIES.slice(0, 4).map((r) => (
            <button
              key={r}
              onClick={() => sendMutation.mutate(r)}
              className="shrink-0 px-3 py-1.5 rounded-full border border-slate-200 text-xs text-text-muted hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask NutriBot anything..."
            className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-text-primary outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:bg-primary/90 transition-all"
          >
            {sendMutation.isPending ? <Spinner size="sm" color="white" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
