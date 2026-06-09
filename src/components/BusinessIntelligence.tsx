import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Megaphone, ShieldAlert, MessageSquare, HelpCircle, 
  Send, Bot, User, Copy, Check, Info, FileText, ArrowRight
} from "lucide-react";
import { InventoryItem, ScrapedOrder } from "../types";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function BusinessIntelligence({ inventory, orders, currentTenantId }: { inventory: InventoryItem[], orders?: ScrapedOrder[], currentTenantId: string }) {
  // Chat console active state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`laknexus_${currentTenantId}_intelligence_chat`);
    return saved ? JSON.parse(saved) : [{
      id: "init",
      role: "assistant",
      content: "👋 ආයුබෝවන්! මම ඔබේ **LakNexus AI Business Intelligence** ව්‍යාපාරික සහකරු.\n\nඔබේ ව්‍යාපාර වර්ධනය, අලෙවිකරණය සහ අවදානම් අවම කිරීම සඳහා මට සහෝගය දිය හැක. උදව් මෙනුව ලබාගැනීමට පහත Quick triggers භාවිතා කරන්න හෝ **/menu** ලෙස ටයිප් කරන්න."
    }];
  });

  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Custom form state for Module 1 (Ad Writer)
  const [selectedProductAd, setSelectedProductAd] = useState<string>(
    inventory && inventory.length > 0 ? inventory[0].name : "Smart Wallet"
  );
  
  // Custom form state for Module 2 (RTO Predictor)
  const [rtoNotesInput, setRtoNotesInput] = useState("");
  
  // Custom form state for Module 3 (Objections)
  const [selectedObjection, setSelectedObjection] = useState("ගණන් වැඩියි");
  const [customObjection, setCustomObjection] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_intelligence_chat`, JSON.stringify(chatHistory));
  }, [chatHistory, currentTenantId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isProcessing]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const executeBIQuery = async (queryText: string) => {
    setIsProcessing(true);
    
    // Append user message
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: queryText };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const response = await fetch("/api/business-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: queryText,
          inventory,
          orders
        })
      });
      
      const data = await response.json();
      if (data && data.success) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply
        };
        setChatHistory(prev => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "Context error");
      }
    } catch (err) {
      console.error("BI error:", err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `🚨 **කණගාටුයි, පද්ධතිය සම්බන්ධ කිරීමට නොහැකි විය.** \n\nකරුණාකර ඔබගේ Gemini API Key එක නිවැරදිව ඇතුළත් කර ඇතිදැයි Settings මෙනුවෙන් පරීක්ෂා කර නැවත උත්සාහ කරන්න.`
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    executeBIQuery(chatInput.trim());
    setChatInput("");
  };

  // Automated form handlers mapping to chat triggers
  const triggerAdWriterForm = () => {
    const formattedQuery = `Write a persuasive ad for the product ${selectedProductAd}`;
    executeBIQuery(formattedQuery);
  };

  const triggerRtoPredictorForm = () => {
    if (!rtoNotesInput.trim()) {
       alert("Please type some customer notes first!");
       return;
    }
    const formattedQuery = `Inspect delivery risk with notes: ${rtoNotesInput}`;
    executeBIQuery(formattedQuery);
  };

  const triggerSalesCloserForm = () => {
    const objection = customObjection.trim() || selectedObjection;
    const formattedQuery = `Handle this customer objection: ${objection}`;
    executeBIQuery(formattedQuery);
  };

  const clearChatHistory = () => {
    if (confirm("Are you sure you want to clear BI Chat logs?")) {
      setChatHistory([{
        id: "init",
        role: "assistant",
        content: "👋 ආයුබෝවන්! මම ඔබේ **LakNexus AI Business Intelligence** ව්‍යාපාරික සහකරු.\n\nඋදව් මෙනුව ලබාගැනීමට **/menu** ලෙස ටයිප් කරන්න."
      }]);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-down pb-12">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-blue-400 select-none">
          <Sparkles size={120} />
        </div>
        <div className="space-y-1.5 z-10">
          <span className="px-3 py-1 bg-blue-600/30 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Business Intelligence Console
          </span>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            AI Growth & Risk Hub <span className="text-sm font-normal text-slate-400">| ව්‍යාපාර තීරණ සහායකයා</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Increase sales via automated social copywriting, run instant delivery risk checks on customer behavior notes, and handle direct objections.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 z-10">
          <button 
            type="button"
            onClick={() => executeBIQuery("/menu")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle size={14} className="text-blue-400" />
            <span>Show Menu (/menu)</span>
          </button>
          <button 
            type="button"
            onClick={clearChatHistory}
            className="px-4 py-2 bg-red-950/40 hover:bg-red-900/30 border border-red-900/30 text-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Main Container Dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Configured Structured Forms (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
            Instant BI Modules (පෝරම මෙවලම්)
          </h3>

          {/* Module 12.1 Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wider">
              <Megaphone size={11} />
              Module 12.1: Marketing Engine
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">AI Slogan & Ad Writer</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Generate high-converting Facebook/TikTok scripts for selected products.</p>
            </div>
            
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Inventory Product</label>
                <select 
                  value={selectedProductAd} 
                  onChange={(e) => setSelectedProductAd(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 font-medium"
                >
                  {inventory.length === 0 ? (
                    <option value="Smart Wallet">Smart Wallet (Default)</option>
                  ) : (
                    inventory.map((item) => (
                      <option key={item.id} value={item.name}>{item.name} (- Rs. {item.price})</option>
                    ))
                  )}
                </select>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={triggerAdWriterForm}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Write Ad Campaign</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Module 12.2 Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 uppercase tracking-wider">
              <ShieldAlert size={11} />
              Module 12.2: Courier Risk Analyzer
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">AI RTO Risk Predictor</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Evaluate RTO probability percentage & real-time delivery advice on customer notes.</p>
            </div>
            
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Behavior / Text Notes</label>
                <textarea
                  rows={2}
                  value={rtoNotesInput}
                  onChange={(e) => setRtoNotesInput(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 font-medium placeholder-slate-400"
                  placeholder="e.g. පාරිභෝගිකයා පසුව ගන්නම් කිව්වා, / Colombo with generic details"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setRtoNotesInput("පස්සේ ගන්නම් කිව්වා, පහු වෙලා කතා කරන්න")}
                  className="px-2 py-1 bg-slate-150 text-[10.5px] font-semibold text-slate-600 rounded-md hover:bg-slate-200/80 transition-all border border-slate-200"
                >
                  "පස්සේ ගන්නම්"
                </button>
                <button
                  type="button"
                  onClick={() => setRtoNotesInput("ගෙදර කවුරුත් නැහැ කිව්වා සෙනසුරාදා විතරක් දෙන්න")}
                  className="px-2 py-1 bg-slate-150 text-[10.5px] font-semibold text-slate-600 rounded-md hover:bg-slate-200/80 transition-all border border-slate-200"
                >
                  "ගෙදර නැහැ"
                </button>
                <button
                  type="button"
                  onClick={() => setRtoNotesInput("Colombo 3, call check later")}
                  className="px-2 py-1 bg-slate-150 text-[10.5px] font-semibold text-slate-600 rounded-md hover:bg-slate-200/80 transition-all border border-slate-200"
                >
                  "Vague Address"
                </button>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={triggerRtoPredictorForm}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Assess Delivery Risk</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Module 12.3 Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wider">
              <MessageSquare size={11} />
              Module 12.3: Sales Closer Response
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-800">AI Auto-Reply Generator</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Produce friendly Sinhala psychological responses for common customer hesitation objections.</p>
            </div>
            
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Common Objections Matrix</label>
                <div className="grid grid-cols-3 gap-2">
                  {["ගණන් වැඩියි", "ඩිලිවරි නොමිලේද?", "Confirm da?"].map((obj) => (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => {
                        setSelectedObjection(obj);
                        setCustomObjection("");
                      }}
                      className={`text-[11px] p-2 rounded-xl font-bold border text-center transition-all ${
                        selectedObjection === obj && !customObjection 
                          ? "bg-slate-900 text-white border-slate-900" 
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {obj}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Or Paste Custom Objection</label>
                <input
                  type="text"
                  value={customObjection}
                  onChange={(e) => setCustomObjection(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50 font-medium placeholder-slate-400"
                  placeholder="e.g. පස්සේ තමයි සල්ලි තියෙන්නේ"
                />
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={triggerSalesCloserForm}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Draft Closers Script</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: High-Craft Unified Terminal Chat (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-lg h-[680px]">
          {/* Terminal Title */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">AI Growth Command Console</h4>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">Dual English/Sinhala interactive query engine</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 lowercase tracking-wide block">
                /menu triggered
              </span>
            </div>
          </div>

          {/* Quick Sandbox Triggers */}
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-500 self-center uppercase tracking-widest mr-1">Quick Query:</span>
            <button
              onClick={() => executeBIQuery("/menu")}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 transition"
            >
              ℹ️ Menu (/menu)
            </button>
            <button
              onClick={() => executeBIQuery("ගණන් වැඩියි")}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 transition"
            >
              💬 "ගණන් වැඩියි" OBJ
            </button>
            <button
              onClick={() => executeBIQuery("පස්සේ ගන්නම් කිව්වා")}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 transition"
            >
              🛡️ RTO note
            </button>
            <button
              onClick={() => executeBIQuery(`Write an ad for ${selectedProductAd}`)}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 transition"
            >
              📢 Write Ad
            </button>
          </div>

          {/* Chat Logs viewport */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-50/50">
            {chatHistory.map((msg, idx) => (
              <div 
                key={msg.id} 
                className={`flex items-start gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`p-2.5 rounded-2xl shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                <div className="max-w-[85%] relative group">
                  <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white font-medium rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none markdown-body prose prose-sm max-w-none'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    )}
                  </div>

                  {/* Copy helper button for assistant responses containing ad scripts / closers answers */}
                  {msg.role === 'assistant' && msg.content && (
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded shadow-md transition-all text-[9px] flex items-center gap-1 cursor-pointer z-10"
                      title="Copy response body"
                    >
                      {copiedText === msg.id ? (
                        <>
                          <Check size={10} className="text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={10} />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Loader Indicator */}
            {isProcessing && (
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl shrink-0 bg-white border border-slate-200 text-slate-700 shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3.5 text-xs text-slate-500 shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  <span className="ml-1 font-mono text-[10px] text-slate-400">AI is formulating strategy...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form message text sender */}
          <div className="p-4 bg-slate-100 rounded-b-2xl border-t border-slate-200">
            <form onSubmit={handleSendChat} className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isProcessing}
                placeholder="Ask Module 1/2/3 queries, type /menu, or write ads..."
                className="w-full text-xs px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium bg-white disabled:bg-slate-50 disabled:text-slate-400 transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={isProcessing || !chatInput.trim()}
                className="absolute right-2 top-2 bottom-2 w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-all"
                title="Send Command"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
