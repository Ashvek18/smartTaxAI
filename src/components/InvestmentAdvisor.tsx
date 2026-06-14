import React, { useState, useEffect } from 'react';
import { User, InvestmentProduct } from '../types';
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  User as UserIcon, 
  Check, 
  AlertCircle, 
  ShieldAlert, 
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Loader2
} from 'lucide-react';

interface RecommendedProduct {
  product: InvestmentProduct;
  matchScore: number;
  priorityReason: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'advisor';
  text: string;
  timestamp: string;
}

interface InvestmentAdvisorProps {
  user: User;
  token: string | null;
}

export default function InvestmentAdvisor({ user, token }: InvestmentAdvisorProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [remaining80C, setRemaining80C] = useState(0);

  // Chatbot states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'advisor',
      text: `Hello ${user.name}! I am your automated AI Tax Advisor. I have calibrated my recommendations to your age (${user.profile.age} years) and ${user.profile.riskAppetite.toUpperCase()} risk profile. Ask me anything about Indian Income tax, HRA, SIP targets, or optimizing Sec 80C exemptions.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatError, setChatError] = useState('');

  // Sourced suggestions for instant questions
  const quickPrompts = [
    "Should I choose Old or New Tax Regime?",
    "How can I maximize my Section 80C deductions?",
    "Suggest a high returns low risk portfolio",
    "How do I qualify for Metro HRA under Section 10(13A)?"
  ];

  const fetchRecommendations = async () => {
    setLoadingProds(true);
    try {
      const res = await fetch('/api/investments/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRecommendations(data.recommendations || []);
        setRemaining80C(data.remaining80Climit || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProds(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || sendingMsg) return;
    
    setChatError('');
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setSendingMsg(true);

    try {
      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: chatHistory.map(h => ({ sender: h.sender, text: h.text }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat executor failure.');

      const advisorMsg: ChatMessage = {
        id: `advisor_${Date.now()}`,
        sender: 'advisor',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory(prev => [...prev, advisorMsg]);
    } catch (err: any) {
      setChatError(err.message || 'AI advisor offline. Ensure server is up-to-date.');
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div id="investment_engine" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Dynamic Products Matches catalog (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-5">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600 animate-pulse" /> Matching Financial Products
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Calibrated according to active user investment profiles</p>
            </div>
            {remaining80C > 0 && (
              <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-lg text-[10.5px] font-semibold border border-amber-100 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> ₹{remaining80C.toLocaleString('en-IN')} unspent 80C capacity
              </span>
            )}
          </div>

          {loadingProds ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <div key={rec.product.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all bg-slate-50/20 space-y-3 relative flex flex-col justify-between">
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {rec.matchScore}% Match
                  </span>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-405">{rec.product.category}</span>
                    <h4 className="font-bold text-xs text-slate-800 max-w-[80%] leading-snug">{rec.product.name}</h4>
                    <p className="text-[10.5px] text-slate-500 leading-relaxed mt-1.5">{rec.product.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100/50 space-y-1.5 text-[10px] font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span>Expected return:</span>
                      <span className="text-emerald-600 font-bold">~{rec.product.expectedReturns}% CAGR</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lock-in Tenure:</span>
                      <span className="font-bold text-slate-755">{rec.product.lockInValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exemption Advantage:</span>
                      <span className="font-bold text-slate-755">{rec.product.taxBenefits.split(' ')[0]} {rec.product.taxBenefits.split(' ')[1] || ''}</span>
                    </div>
                    <div className="p-2 bg-indigo-50/30 rounded mt-2 text-[9px] text-indigo-705 leading-relaxed">
                      💡 {rec.priorityReason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive AI Chatbot (1 col) */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[580px] justify-between">
        {/* Chat top header */}
        <div className="px-5 py-4 bg-slate-900 border-b border-slate-900 text-white flex items-center gap-2.5">
          <BrainCircuit className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="font-bold text-xs tracking-tight uppercase">AI Tax Advisor</h4>
            <p className="text-[8.5px] text-slate-400">Expert chat consultation pilot</p>
          </div>
        </div>

        {/* Chat history list */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20 text-xs scrollbar-thin">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'advisor' && (
                <div className="p-1 bg-slate-900 text-emerald-400 rounded-lg text-xs mt-0.5">
                  <BrainCircuit className="w-3.5 h-3.5" />
                </div>
              )}
              
              <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-white border border-slate-150 text-slate-800 rounded-tl-none shadow-xs'
              }`}>
                {msg.text}
                <span className={`block text-[8px] text-right mt-1.5 ${msg.sender === 'user' ? 'text-indigo-250 opacity-80' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="p-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {sendingMsg && (
            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-slate-900 text-emerald-400 rounded-lg text-xs mt-0.5">
                <BrainCircuit className="w-3.5 h-3.5 animate-bounce" />
              </div>
              <div className="p-3.5 bg-white border border-slate-150 rounded-2xl rounded-tl-none text-slate-400 italic">
                AI Pilot analyzing guidelines...
              </div>
            </div>
          )}

          {chatError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong>Advisor Interface Error:</strong>
                <p className="text-[10px] text-rose-600 mt-1">{chatError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-2 border-t border-slate-100 bg-white grid grid-cols-2 gap-1.5">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              id={`quick_prompt_${idx}`}
              type="button"
              onClick={() => handleSendMessage(p)}
              disabled={sendingMsg}
              className="px-2 py-1 bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/50 rounded-lg text-[9.5px] text-slate-500 hover:text-slate-700 text-left transition-colors cursor-pointer leading-normal line-clamp-2"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat input form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(chatInput);
          }} 
          className="p-3 border-t border-slate-100 bg-white flex gap-2"
        >
          <input
            id="advisor_chat_input"
            type="text"
            placeholder="Type your taxation question here..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={sendingMsg}
            className="flex-1 text-xs border border-slate-200 hover:border-slate-300 focus:border-indigo-500 px-3 py-2.5 rounded-xl focus:outline-none transition-colors"
          />
          <button
            id="advisor_chat_send"
            type="submit"
            disabled={!chatInput.trim() || sendingMsg}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-550 border border-indigo-600 text-white rounded-xl flex justify-center items-center cursor-pointer transition-colors disabled:opacity-30 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
