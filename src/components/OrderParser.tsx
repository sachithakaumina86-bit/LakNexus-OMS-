import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Trash2, Mic, AlertCircle, Copy, Check, FileText, Send, Sparkles, 
  RefreshCw, MapPin, Phone, User, ShoppingCart, Truck, AlertTriangle, Printer 
} from "lucide-react";
import { ScrapedOrder, OrderItem, CustomerDetails } from "../types";
import { lookupCity, getStandardizedCourierAddress } from "../cities";

// High-quality Sri Lankan real presets for WhatsApp, Singlish, and pure Sinhala script transcriptions
const SAMPLE_PRESETS = [
  {
    name: "Scenario A: Messy WhatsApp (Sinhala Translation)",
    text: "කමල් පෙරේරා. නොම්මර 45, ගාලු පාර, කොළඹ 3. ෆෝන් එක 0771234567. බඩු තමයි රතු පාට සරම් 2යි."
  },
  {
    name: "Scenario B: Singlish Voice Transcript (Vague Location)",
    text: "Malli check order. Customer Name: Prasanna Jayasekara. Phone 0715566778. Address is Unawatuna town. Delivery for 1 Blue Linen shirt L size, price is 2400."
  },
  {
    name: "Scenario C: Chaotic Copy-Paste (No Phone - RTO Trigger)",
    text: "TikTok Inbox:\nCustomer: Sanduni Perera\nAddress: No 12/A, Temple road, Pohorabawa\nItems needed: 1 Black handbag medium size.\nDelivery urgent!"
  }
];

interface OrderParserProps {
  onSaveOrder: (order: ScrapedOrder) => void;
}

export default function OrderParser({ onSaveOrder }: OrderParserProps) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Active Parsed State to allow direct merchant editing before saving
  const [parsedData, setParsedData] = useState<any>(null);

  // Read dynamic settings from OMS Configuration
  const rtoThreshold = Number(localStorage.getItem("laknexus_rto_threshold") || "65");
  const storeName = localStorage.getItem("laknexus_merchant_name") || "LakNexus OMS Demo Store";
  const defaultCourier = localStorage.getItem("laknexus_default_courier") || "Koombiyo Logistics";
  
  // Mic speech states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const recordingInterval = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Clipboard feedbacks
  const [copiedInvoiceFlag, setCopiedInvoiceFlag] = useState<"58" | "80" | null>(null);

  // Handler to start/stop native SpeechRecognition for Sinhala/English
  const toggleSpeechRecording = () => {
    const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechObj) {
      alert("Speech recognition is not natively supported in this browser. Please copy-paste some voice transcripts or type directly in Sinhala!");
      return;
    }

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      clearInterval(recordingInterval.current);
      setRecordingTimer(0);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Start recording
      setIsRecording(true);
      setErrorStatus(null);
      const SpeechNode = new SpeechObj();
      SpeechNode.lang = "si-LK"; // Direct Sinhalese speech pattern matching standard
      SpeechNode.continuous = true;
      SpeechNode.interimResults = true;

      SpeechNode.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      SpeechNode.onerror = (err: any) => {
        console.error("Speech Error:", err);
        setIsRecording(false);
        clearInterval(recordingInterval.current);
        setRecordingTimer(0);
      };

      recognitionRef.current = SpeechNode;
      SpeechNode.start();

      recordingInterval.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);
    }
  };

  // Triggers the Backend Gemini-API Order Scraper
  const handleProcessText = async (customText?: string) => {
    const textToProcess = customText || inputText;
    if (!textToProcess.trim()) {
      setErrorStatus("Please write, speak, or select a scenario preset first.");
      return;
    }

    setIsLoading(true);
    setErrorStatus(null);
    setParsedData(null);

    try {
      const response = await fetch("/api/process-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToProcess }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const data = resJson.data;
        const blacklistRaw = localStorage.getItem("laknexus_blacklist_numbers") || "[]";
        let blacklistArr: string[] = [];
        try {
          blacklistArr = JSON.parse(blacklistRaw);
        } catch (e) {}

        const checkMatch = (phone: string) => {
          if (!phone) return false;
          const cleanPhone = phone.replace(/[^0-9]/g, "");
          return blacklistArr.some((b) => {
            const cleanB = b.replace(/[^0-9]/g, "");
            return cleanPhone.endsWith(cleanB) || cleanB.endsWith(cleanPhone);
          });
        };

        if (checkMatch(data.phone1) || checkMatch(data.phone2)) {
          data.rtoRiskScore = 99;
          data.rtoWarningSinhala = "අනතුරු ඇඟවීම: පාරිභෝගිකයා අසාදු ලේඛනගත දුරකථන අංකයකි! RTO අවදානම 99% කි.";
          data.rtoWarningEnglish = "ALERT: This phone number is blacklisted in your database registry! RTO is 99%.";
        }
        setParsedData(data);
      } else {
        setErrorStatus(resJson.error || "Failed to process customer data.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus("Connection timeout or server offline. Running local calculations.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper inside parser to edit order items in state
  const updateOrderItem = (itemIdx: number, field: keyof OrderItem, val: any) => {
    if (!parsedData) return;
    const itemsCpy = [...parsedData.items];
    itemsCpy[itemIdx] = { ...itemsCpy[itemIdx], [field]: val };
    setParsedData({ ...parsedData, items: itemsCpy });
  };

  const removeOrderItem = (itemIdx: number) => {
    if (!parsedData) return;
    const itemsCpy = parsedData.items.filter((_: any, i: number) => i !== itemIdx);
    setParsedData({ ...parsedData, items: itemsCpy });
  };

  const addOrderItem = () => {
    if (!parsedData) return;
    const newItem = { name: "New Product", quantity: 1, price: 1500, size: "Free", color: "Mixed" };
    setParsedData({ ...parsedData, items: [...parsedData.items, newItem] });
  };

  // Dynamic calculations of delivery fees based on province and merchant custom pricing guidelines
  const getSubtotal = () => {
    if (!parsedData || !parsedData.items) return 0;
    return parsedData.items.reduce((sum: number, it: any) => sum + (Number(it.price) * Number(it.quantity)), 0);
  };

  const currentProvinceFee = () => {
    const wpFee = Number(localStorage.getItem("laknexus_wp_fee") || "350");
    const outstationFee = Number(localStorage.getItem("laknexus_outstation_fee") || "450");
    const otherFee = Number(localStorage.getItem("laknexus_other_fee") || "550");

    if (!parsedData) return wpFee;
    const prov = parsedData.province || "Western";
    if (prov.toLowerCase().includes("western")) return wpFee;
    if (["southern", "central", "sabaragamuwa"].includes(prov.toLowerCase())) return outstationFee;
    return otherFee;
  };

  const generateThermalBill = (widthMm: 58 | 80) => {
    if (!parsedData) return "";
    const w = widthMm === 58 ? 32 : 48;
    const divider = "-".repeat(w);
    const dblDivider = "=".repeat(w);
    const sub = getSubtotal();
    const fee = currentProvinceFee();
    const tot = sub + fee;

    const formattedDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });

    const justify = (left: string, right: string) => {
      const padLen = w - left.length - right.length;
      if (padLen <= 0) return left + " " + right;
      return left + " ".repeat(padLen) + right;
    };

    const center = (text: string) => {
      if (text.length >= w) return text;
      const pad = Math.floor((w - text.length) / 2);
      return " ".repeat(pad) + text;
    };

    const lines = [
      center(storeName.toUpperCase()),
      center("ලක්නෙක්සස් සිල්ලර වෙළඳසැල"),
      center("No. 100, High Level Rd, Colombo"),
      center("Tel: 011-2345678"),
      divider,
      center("** POS RECEIPT / බිල්පත **"),
      divider,
      `DATE/කාලය: ${formattedDate}`,
      `BILL NO  : LN-TEMP-${Math.floor(100 + Math.random() * 899)}`,
      divider,
      "CUSTOMER INFO / පාරිභෝගිකයා:",
      `Name/නම  : ${parsedData.customerName}`,
      `Tel/දුරකථන: ${parsedData.phone1}`,
      parsedData.phone2 ? `Tel2/අතිරේක: ${parsedData.phone2}` : "",
      `Addr/ලිපිනය: ${parsedData.addressLine1 || ""}`,
      parsedData.addressLine2 ? `             ${parsedData.addressLine2}` : "",
      `City/නගරය : ${parsedData.city} (${parsedData.district} Dist)`,
      divider,
      "ITEMS / මිලදී ගත් දෑ:",
      divider,
      ...parsedData.items.flatMap((it: any) => {
        const specs = [it.size, it.color].filter(Boolean).join("/");
        const specStr = specs ? ` (${specs})` : "";
        const itemHeader = `* ${it.name}${specStr}`;
        const itemCalculation = `  ${it.quantity} x Rs. ${Number(it.price).toLocaleString()}`;
        const itemCost = `Rs. ${(it.quantity * it.price).toLocaleString()}`;
        return [itemHeader, justify(itemCalculation, itemCost)];
      }),
      divider,
      justify("SUBTOTAL / එකතුව", `Rs. ${sub.toLocaleString()}`),
      justify("DELIVERY / ප්‍රවාහන", `Rs. ${fee.toLocaleString()}`),
      center(`(${parsedData.courierRecommended || defaultCourier})`),
      dblDivider,
      justify("GRAND TOTAL / එකතුව", `Rs. ${tot.toLocaleString()}`),
      dblDivider,
      center("THANK YOU! / ස්තූතියි!"),
      center("නැවත පැමිණෙන්න!"),
      center("Powered by LakNexus OMS AI"),
      divider
    ].filter((line) => line !== null && line !== undefined && line !== "");

    return lines.join("\n");
  };

  const copyToClipboard = (text: string, type: "58" | "80") => {
    navigator.clipboard.writeText(text);
    setCopiedInvoiceFlag(type);
    setTimeout(() => setCopiedInvoiceFlag(null), 1800);
  };

  // Commit verified order to history state
  const handleApproveAndSave = (status: "Approved" | "High Risk Hold") => {
    if (!parsedData) return;
    const sub = getSubtotal();
    const fee = currentProvinceFee();
    const tot = sub + fee;

    const finalOrder: ScrapedOrder = {
      id: "LN-" + Math.floor(100000 + Math.random() * 900000),
      customer: {
        name: parsedData.customerName,
        phone1: parsedData.phone1,
        phone2: parsedData.phone2,
        address: {
          line1: parsedData.addressLine1 || "Standard Delivery",
          line2: parsedData.addressLine2 || "",
          city: parsedData.city || "Colombo",
          district: parsedData.district || "Colombo",
          province: parsedData.province || "Western"
        }
      },
      items: parsedData.items.map((it: any, i: number) => ({
        id: String(i),
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        size: it.size,
        color: it.color
      })),
      rtoRisk: {
        score: parsedData.rtoRiskScore,
        level: parsedData.rtoRiskScore >= 75 ? "CRITICAL" : parsedData.rtoRiskScore >= 55 ? "HIGH" : "LOW",
        warningSinhala: parsedData.rtoWarningSinhala,
        warningEnglish: parsedData.rtoWarningEnglish,
        reasons: parsedData.rtoRiskReasons || []
      },
      courier: {
        recommended: parsedData.courierRecommended || "Koombiyo",
        fee,
        reason: parsedData.courierReason || "Fastest outstation cash collect service matching this district",
        ratesSummary: `Rs. ${fee} for standard 2kg`
      },
      invoice: {
        subtotal: sub,
        deliveryFee: fee,
        total: tot,
        thermalLayout58: generateThermalBill(58),
        thermalLayout80: generateThermalBill(80)
      },
      createdAt: new Date().toLocaleDateString("si-LK") + " " + new Date().toLocaleTimeString("si-LK"),
      rawInput: inputText || "Manual Preset Entry",
      status
    };

    onSaveOrder(finalOrder);
    setParsedData(null);
    setInputText("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Input panel */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-blue-600 size-5" />
            LakNexus AI Input Centre
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Feed WhatsApp snippets, noisy Viber texts, or speak out Sinhala voice instructions.
          </p>
        </div>

        {/* Preset scenario shortcuts */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quick Scenario Presets
          </p>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_PRESETS.map((preset, index) => (
              <button
                id={`preset-btn-${index}`}
                key={index}
                onClick={() => {
                  setInputText(preset.text);
                  handleProcessText(preset.text);
                }}
                className="p-3 text-left border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 rounded-xl text-xs transition-all flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                <div className="truncate font-semibold text-slate-700">{preset.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Area and Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Messy Chat Or Transcript
            </label>
            
            {/* Live voice recording toggles */}
            <button
              id="voice-recorder-toggle-btn"
              onClick={toggleSpeechRecording}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-bold transition-all relative overflow-hidden ${
                isRecording 
                  ? "bg-rose-500 text-white animate-pulse border border-rose-500/55" 
                  : "bg-slate-900/40 backdrop-blur-md border border-cyan-500/50 hover:border-fuchsia-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(217,70,239,0.3)] text-cyan-400 hover:text-fuchsia-300 cursor-pointer"
              }`}
            >
              <Mic size={14} className={isRecording ? "animate-bounce text-white" : "text-cyan-400"} />
              <span className={isRecording ? "text-white" : "text-cyan-400 font-extrabold uppercase tracking-wider"}>
                {isRecording 
                  ? `Recording: ${recordingTimer}s (Speak Sinhala)` 
                  : "sinhala voice translation"
                }
              </span>
            </button>
          </div>

          <textarea
            className="w-full h-44 text-sm p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 bg-slate-50/50"
            placeholder="Type Siri Lankan delivery details, paste rough WhatsApp transcripts or speak Sinhala natively using the voice button..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>

        {errorStatus && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorStatus}</span>
          </div>
        )}

        <button
          id="scrape-order-action-btn"
          onClick={() => handleProcessText()}
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-100 hover:shadow-lg transition-all group"
        >
          {isLoading ? (
            <>
              <RefreshCw className="animate-spin size-4" /> Processing Sri Lankan database...
            </>
          ) : (
            <>
              <Send className="size-4 group-hover:translate-x-0.5 transition-transform" /> Scrape & Parse with LakNexus AI
            </>
          )}
        </button>
      </div>

      {/* Right Output panel */}
      <div className="lg:col-span-7 space-y-6">
        <AnimatePresence mode="wait">
          {!parsedData ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[450px]"
            >
              <FileText className="text-slate-300 size-12 mb-4" />
              <h3 className="text-base font-bold text-slate-700">Awaiting LakNexus Scraper Input</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Once you speak or insert text files, LakNexus parses names, phone, RTO risks, automatic Sri Lankan cities completeness, and invoices in split-seconds.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel p-6 rounded-2xl shadow-md space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                    LakNexus Core Scrape Successful
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">Processed Customer Profile</h3>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 p-1 rounded">
                    100% Client-editable
                  </span>
                </div>
              </div>

              {/* RTO Risk Alert banner - Professional Polish themed styles */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-4 transition-all shadow-sm ${
                  parsedData.rtoRiskScore >= rtoThreshold
                    ? "bg-amber-50/50 border-amber-300 status-glow-amber text-amber-900"
                    : "bg-emerald-50/50 border-emerald-300 status-glow-green text-emerald-950"
                }`}
              >
                {parsedData.rtoRiskScore >= rtoThreshold ? (
                  <div className="w-10 h-10 rounded-full border-4 border-amber-200 flex items-center justify-center bg-white text-amber-600 font-extrabold text-xs shrink-0">{parsedData.rtoRiskScore}%</div>
                ) : (
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-200 flex items-center justify-center bg-white text-emerald-600 font-extrabold text-xs shrink-0">{parsedData.rtoRiskScore}%</div>
                )}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 select-none">
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {parsedData.rtoRiskScore >= rtoThreshold ? "RTO RISK ALERT (අධික අවදානම)" : "SECURE COD DISPATCH ZONE"}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${parsedData.rtoRiskScore >= rtoThreshold ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {parsedData.rtoRiskScore >= rtoThreshold ? "HIGH RISK" : "STABLE"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold">{parsedData.rtoWarningSinhala}</p>
                  <p className="text-[11px] opacity-80 font-medium italic">{parsedData.rtoWarningEnglish}</p>
                  {parsedData.rtoRiskReasons && parsedData.rtoRiskReasons.length > 0 && (
                    <div className="mt-2 text-[10px] opacity-90 pl-3 border-l-2 border-slate-300">
                      <span className="font-bold select-none text-slate-500">Risk factors identified:</span>
                      <ul className="list-disc pl-3 mt-0.5 space-y-0.5 text-slate-600">
                        {parsedData.rtoRiskReasons.map((r: string, idx: number) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive customer inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1 select-none">
                    <User size={12} /> Customer Contact Details
                  </h4>
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full text-sm px-3 py-1.5 rounded bg-white border border-slate-200 focus:outline-none focus:border-blue-500"
                      value={parsedData.customerName}
                      onChange={(e) => setParsedData({ ...parsedData, customerName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Phone 1</label>
                      <input
                        type="text"
                        className="w-full text-sm px-3 py-1.5 rounded bg-white border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                        value={parsedData.phone1}
                        onChange={(e) => setParsedData({ ...parsedData, phone1: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Phone 2 (fallback)</label>
                      <input
                        type="text"
                        placeholder="None found"
                        className="w-full text-sm px-3 py-1.5 rounded bg-white border border-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                        value={parsedData.phone2 || ""}
                        onChange={(e) => setParsedData({ ...parsedData, phone2: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1 select-none">
                    <MapPin size={12} /> AI-Deduced Location Details
                  </h4>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase text-slate-400 font-bold">Address Line</label>
                      <button
                        id="ai-standardize-address-btn"
                        type="button"
                        onClick={() => {
                          const std = getStandardizedCourierAddress(
                            parsedData.addressLine1,
                            parsedData.addressLine2 || "",
                            parsedData.city,
                            parsedData.district
                          );
                          setParsedData({
                            ...parsedData,
                            addressLine1: std,
                            addressLine2: ""
                          });
                        }}
                        className="text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded transition-all flex items-center gap-1 shrink-0"
                      >
                        <Sparkles size={8} /> Auto-Standardize (Courier-Ready)
                      </button>
                    </div>
                    <input
                      type="text"
                      className="w-full text-sm px-3 py-1.5 rounded bg-white border border-slate-200 focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                      value={parsedData.addressLine1}
                      onChange={(e) => setParsedData({ ...parsedData, addressLine1: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">City</label>
                      <input
                        type="text"
                        className="w-full text-xs px-2 py-1.5 rounded bg-white border border-slate-200 focus:outline-none focus:border-blue-500 font-bold"
                        value={parsedData.city}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = lookupCity(val);
                          const updatedDistrict = found ? found.district : parsedData.district;
                          const updatedProvince = found ? found.province : parsedData.province;
                          
                          // If city is found, auto-standardized address with newly updated district
                          let updatedAddress = parsedData.addressLine1;
                          if (found) {
                            updatedAddress = getStandardizedCourierAddress(
                              parsedData.addressLine1,
                              "",
                              found.city,
                              found.district
                            );
                          }
                          
                          setParsedData({
                            ...parsedData,
                            city: val,
                            district: updatedDistrict,
                            province: updatedProvince,
                            addressLine1: updatedAddress
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">District</label>
                      <input
                        type="text"
                        className="w-full text-xs px-2 py-1.5 rounded bg-slate-50 border border-slate-100 focus:outline-none text-slate-500 font-bold"
                        value={parsedData.district}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Province</label>
                      <input
                        type="text"
                        className="w-full text-xs px-2 py-1.5 rounded bg-slate-50 border border-slate-100 focus:outline-none text-slate-500 font-bold"
                        value={parsedData.province}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order items grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-1 select-none">
                    <ShoppingCart size={12} /> Extracted Items & Specifications
                  </h4>
                  <button
                    id="add-item-manually-btn"
                    onClick={addOrderItem}
                    className="p-1 px-2.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-all flex items-center gap-1"
                  >
                    <Plus size={10} /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {parsedData.items && parsedData.items.map((it: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          className="w-full text-xs font-semibold px-2 py-1 rounded bg-white border border-slate-200 focus:outline-none focus:border-blue-500"
                          value={it.name}
                          onChange={(e) => updateOrderItem(i, "name", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Qty</label>
                          <input
                            type="number"
                            min="1"
                            className="w-12 text-xs text-center font-bold px-1 py-1 rounded bg-white border border-slate-200"
                            value={it.quantity}
                            onChange={(e) => updateOrderItem(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Price</label>
                          <input
                            type="number"
                            min="0"
                            className="w-16 text-xs text-center px-1 py-1 rounded bg-white border border-slate-200"
                            value={it.price}
                            onChange={(e) => updateOrderItem(i, "price", Math.max(0, parseInt(e.target.value) || 0))}
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Size</label>
                          <input
                            type="text"
                            placeholder="M"
                            className="w-12 text-xs text-center px-1 py-1 rounded bg-white border border-slate-200"
                            value={it.size || ""}
                            onChange={(e) => updateOrderItem(i, "size", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] uppercase tracking-wider font-bold text-slate-400">Color</label>
                          <input
                            type="text"
                            placeholder="Red"
                            className="w-16 text-xs text-center px-1 py-1 rounded bg-white border border-slate-200"
                            value={it.color || ""}
                            onChange={(e) => updateOrderItem(i, "color", e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeOrderItem(i)}
                        className="p-1 px-1.5 text-rose-500 hover:bg-rose-50 rounded transition-all shrink-0 self-end sm:self-auto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Courier recommendations */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex items-start gap-3">
                <div className="w-8 h-8 rounded text-center leading-8 text-sm font-bold text-blue-600 bg-blue-100 shrink-0">K</div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block select-none">
                    Courier Recommendation Strategy
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {parsedData.courierRecommended || "Koombiyo Delivery"}
                    </span>
                    <span className="text-xs text-blue-600 font-bold">
                      ETA: 24-48 HRS • Low RTO Route
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{parsedData.courierReason || "Optimized outstation route for this district with verified cash handling reliability statistics."}</p>
                </div>
              </div>

              {/* Bill layouts / Thermal Preview Toggle */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between select-none">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Printer size={12} /> Print & Instant Billing Engine
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 58mm copy */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">58mm Thermal Bill Layout</span>
                        <button
                          onClick={() => copyToClipboard(generateThermalBill(58), "58")}
                          className="p-1 px-2 text-[10px] bg-slate-200/50 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1 transition-all"
                        >
                          {copiedInvoiceFlag === "58" ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                          {copiedInvoiceFlag === "58" ? "Copied!" : "Copy 58mm"}
                        </button>
                      </div>
                      <pre className="thermal-preview-container text-[10px] font-mono whitespace-pre text-slate-500 bg-white p-2.5 rounded border border-slate-150 h-32 overflow-y-auto">
                        {generateThermalBill(58)}
                      </pre>
                    </div>
                  </div>

                  {/* 80mm copy */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">80mm Thermal Bill Layout</span>
                        <button
                          onClick={() => copyToClipboard(generateThermalBill(80), "80")}
                          className="p-1 px-2 text-[10px] bg-slate-200/50 hover:bg-slate-200 rounded text-slate-700 flex items-center gap-1 transition-all"
                        >
                          {copiedInvoiceFlag === "80" ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                          {copiedInvoiceFlag === "80" ? "Copied!" : "Copy 80mm"}
                        </button>
                      </div>
                      <pre className="thermal-preview-container text-[10px] font-mono whitespace-pre text-slate-500 bg-white p-2.5 rounded border border-slate-150 h-32 overflow-y-auto">
                        {generateThermalBill(80)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>

              {/* Double approvals trigger */}
              <div className="flex gap-4 border-t border-slate-200 pt-6">
                <button
                  id="approve-hold-btn"
                  onClick={() => handleApproveAndSave("High Risk Hold")}
                  className={`flex-1 py-3 border text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm ${
                    parsedData.rtoRiskScore >= rtoThreshold
                      ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                  }`}
                >
                  Flag High RTO Risk (රඳවා ගන්න)
                </button>
                <button
                  id="approve-save-btn"
                  onClick={() => handleApproveAndSave("Approved")}
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all"
                >
                  GENERATE INVOICE & BOOK COURIER
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
