import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, FileText, BarChart2, CheckCircle2, TrendingUp, AlertTriangle, 
  Settings, ArrowUpRight, ShieldCheck, Heart, LogIn, Menu, X, Sliders, ShieldAlert, Save, Trash2, HelpCircle, Truck, ClipboardList, Wallet,
  Calculator, Zap, RefreshCw, Target, Package, FolderKanban, Lightbulb,
  Plus, Search, Printer
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

// @ts-ignore
import laknexusLogo from "./assets/images/laknexus_purple_logo_1780812251577.png";

import MetricCard from "./components/MetricCard";
import OrderParser from "./components/OrderParser";
import ActiveOrders from "./components/ActiveOrders";
import FinancialPlanner from "./components/FinancialPlanner";
import InventoryManager from "./components/InventoryManager";
import BusinessIntelligence from "./components/BusinessIntelligence";
import ProductsSection from "./components/ProductsSection";
import EnterpriseSuite from "./components/EnterpriseSuite";
import { ScrapedOrder } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "parser" | "financials" | "ledger" | "settings" | "security" | "inventory" | "intelligence" | "products" | "enterprise">("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [calcActiveTab, setCalcActiveTab] = useState<"ai" | "manual">("ai");
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [quickSearchTerm, setQuickSearchTerm] = useState("");
  const [aiCalcPrompt, setAiCalcPrompt] = useState("");
  const [aiCalcResult, setAiCalcResult] = useState<{
    salesVolume: number;
    price: number;
    rtoRate: number;
    adSpend: number;
    cogs: number;
    revenue: number;
    rtoOrders: number;
    rtoLoss: number;
    productCost: number;
    profit: number;
    margin: number;
    roas: number;
  } | null>(null);

  // General configuration state loaded from local storage
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail");
  
  const tenantsList = [
    { id: "tenant_colombo_retail", name: "Colombo Retail Group", email: "colombo@laknexus.com", region: "Western Province Zone" },
    { id: "tenant_kandy_boutique", name: "Kandy Luxury Boutique", email: "kandy@laknexus.com", region: "Central Province Zone" },
    { id: "tenant_galle_trends", name: "Galle Trends Hub", email: "galle@laknexus.com", region: "Southern Province Zone" }
  ];

  const [wpFee, setWpFee] = useState<number>(() => Number(localStorage.getItem(`laknexus_${localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail"}_wp_fee`) || "350"));
  const [outstationFee, setOutstationFee] = useState<number>(() => Number(localStorage.getItem(`laknexus_${localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail"}_outstation_fee`) || "450"));
  const [otherFee, setOtherFee] = useState<number>(() => Number(localStorage.getItem(`laknexus_${localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail"}_other_fee`) || "550"));
  const [rtoThreshold, setRtoThreshold] = useState<number>(() => Number(localStorage.getItem(`laknexus_${localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail"}_rto_threshold`) || "65"));
  const [merchantName, setMerchantName] = useState<string>(() => localStorage.getItem(`laknexus_${localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail"}_merchant_name`) || "Colombo Retail Group");
  const [businessOwner, setBusinessOwner] = useState<string>(() => localStorage.getItem(`laknexus_${localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail"}_business_owner`) || "S. Kaumina");
  const [businessAddress, setBusinessAddress] = useState<string>(() => localStorage.getItem(`laknexus_${localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail"}_business_address`) || "No. 100, High Level Rd, Colombo");
  const [businessPhone, setBusinessPhone] = useState<string>(() => localStorage.getItem(`laknexus_${localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail"}_business_phone`) || "011-2345678");
  const [defaultCourier, setDefaultCourier] = useState<string>(() => localStorage.getItem(`laknexus_${localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail"}_default_courier`) || "Koombiyo Logistics");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleAiCalcParse = (promptText: string) => {
    // defaults
    let salesVolume = 100;
    let price = 2500;
    let rtoRate = 12;
    let adSpend = 20000;
    let cogs = 800;

    // simple regex extracts
    const salesMatch = promptText.match(/(\d+)\s*(?:sales|orders|items|Volume|units|pcs)/i);
    if (salesMatch) salesVolume = parseInt(salesMatch[1]) || 100;

    // price can be written as LKR 2500, Rs. 2500, Rs 2500, Rs.2500, 2500 price
    const priceMatch = promptText.match(/(?:LKR|Rs\.?|price|selling price)\s*(\d+[\d,]*)/i);
    if (priceMatch) price = parseInt(priceMatch[1].replace(/,/g, "")) || 2500;
    else {
      // backup check for "each"
      const eachMatch = promptText.match(/(\d+[\d,]*)\s*(?:each|item)/i);
      if (eachMatch) price = parseInt(eachMatch[1].replace(/,/g, "")) || 2500;
    }

    const rtoMatch = promptText.match(/(\d+(?:\.\d+)?)\s*%/);
    if (rtoMatch) rtoRate = parseFloat(rtoMatch[1]) || 12;

    const adMatch = promptText.match(/(?:ad|marketing|spend|budget|spent)\s*(?:LKR|Rs\.?|spend)?\s*(\d+[\d,]*)/i);
    if (adMatch) adSpend = parseInt(adMatch[1].replace(/,/g, "")) || 20050;

    const cogsMatch = promptText.match(/(?:COGS|cost of goods|buy|unit cost)\s*(?:LKR|Rs\.?|cost)?\s*(\d+[\d,]*)/i);
    if (cogsMatch) cogs = parseInt(cogsMatch[1].replace(/,/g, "")) || 800;

    // computations
    const revenue = salesVolume * price;
    const rtoOrders = Math.round(salesVolume * (rtoRate / 100));
    const rtoLoss = rtoOrders * 380;
    const productCost = salesVolume * cogs;
    const profit = revenue - productCost - adSpend - rtoLoss;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const roas = adSpend > 0 ? revenue / adSpend : 0;

    setAiCalcResult({
      salesVolume,
      price,
      rtoRate,
      adSpend,
      cogs,
      revenue,
      rtoOrders,
      rtoLoss,
      productCost,
      profit,
      margin,
      roas
    });
  };

  // Today's / Month's Reports state
  const [todayReportOrders, setTodayReportOrders] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_today_report_orders`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 14 : activeTenant === "tenant_kandy_boutique" ? 6 : 9;
  });

  const [todayReportRev, setTodayReportRev] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_today_report_rev`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 54600 : activeTenant === "tenant_kandy_boutique" ? 28400 : 41250;
  });

  const [monthReportOrders, setMonthReportOrders] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_month_report_orders`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 186 : activeTenant === "tenant_kandy_boutique" ? 74 : 115;
  });

  const [monthReportRev, setMonthReportRev] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_month_report_rev`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 694200 : activeTenant === "tenant_kandy_boutique" ? 312000 : 494500;
  });

  // Extended breakdown metrics
  const [todayExpenses, setTodayExpenses] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_today_expenses`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 8500 : activeTenant === "tenant_kandy_boutique" ? 4300 : 5900;
  });

  const [todayPosCompleted, setTodayPosCompleted] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_today_pos_completed`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 5 : activeTenant === "tenant_kandy_boutique" ? 2 : 3;
  });

  const [todayOnline, setTodayOnline] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_today_online`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 9 : activeTenant === "tenant_kandy_boutique" ? 4 : 6;
  });

  const [todayDelivered, setTodayDelivered] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_today_delivered`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 4 : activeTenant === "tenant_kandy_boutique" ? 1 : 2;
  });

  const [todayPending, setTodayPending] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_today_pending`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 8 : activeTenant === "tenant_kandy_boutique" ? 4 : 6;
  });

  const [todayReturned, setTodayReturned] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_today_returned`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 2 : activeTenant === "tenant_kandy_boutique" ? 1 : 1;
  });

  const [monthExpenses, setMonthExpenses] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_month_expenses`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 145000 : activeTenant === "tenant_kandy_boutique" ? 62000 : 84000;
  });

  const [monthDelivered, setMonthDelivered] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_month_delivered`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 125 : activeTenant === "tenant_kandy_boutique" ? 48 : 78;
  });

  const [monthPosCompleted, setMonthPosCompleted] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_month_pos_completed`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 48 : activeTenant === "tenant_kandy_boutique" ? 20 : 30;
  });

  const [monthReturned, setMonthReturned] = useState<number>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_month_returned`);
    if (saved) return Number(saved);
    return activeTenant === "tenant_colombo_retail" ? 13 : activeTenant === "tenant_kandy_boutique" ? 6 : 7;
  });

  // High-contrast warehouse dark mode configuration state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem("laknexus_dark_mode") === "true");

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");

  const [showTenantResetModal, setShowTenantResetModal] = useState(false);
  const [tenantResetConfirmation, setTenantResetConfirmation] = useState("");
  const [resetCounter, setResetCounter] = useState(0);

  const handleHardReset = () => {
    setOrders([]);
    setInventory([]);
    setBlacklist([]);
    
    localStorage.removeItem("laknexus_orders");
    localStorage.removeItem("laknexus_inventory");
    localStorage.removeItem("laknexus_blacklist_numbers");
    localStorage.removeItem("laknexus_intelligence_chat");
    tenantsList.forEach(t => {
      localStorage.removeItem(`laknexus_${t.id}_intelligence_chat`);
    });
    
    setWpFee(350);
    setOutstationFee(450);
    setOtherFee(550);
    setRtoThreshold(65);
    setMerchantName("LakNexus OMS Demo Store");
    setDefaultCourier("Koombiyo Logistics");
    
    localStorage.setItem("laknexus_wp_fee", "350");
    localStorage.setItem("laknexus_outstation_fee", "450");
    localStorage.setItem("laknexus_other_fee", "550");
    localStorage.setItem("laknexus_rto_threshold", "65");
    localStorage.setItem("laknexus_merchant_name", "LakNexus OMS Demo Store");
    localStorage.setItem("laknexus_default_courier", "Koombiyo Logistics");

    setResetCounter(prev => prev + 1);
    setShowResetModal(false);
    setResetConfirmation("");
    
    setSuccessToast("LakNexus OMS Restored to Production State.");
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Multi-tenant safe, isolated factory reset strictly targeting current logged-in client data
  const handleTenantFactoryReset = () => {
    // Clear tenant specific cache & tables in state
    setOrders([]);
    setInventory([]);
    
    // Clear in localStorage
    localStorage.setItem(`laknexus_${currentTenantId}_orders`, JSON.stringify([]));
    localStorage.setItem(`laknexus_${currentTenantId}_inventory`, JSON.stringify([]));
    localStorage.removeItem(`laknexus_${currentTenantId}_intelligence_chat`);
    
    // Reset configurations to standard defaults for this tenant
    const defaultName = tenantsList.find(t => t.id === currentTenantId)?.name || "LakNexus OMS";
    setMerchantName(defaultName);
    setWpFee(350);
    setOutstationFee(450);
    setOtherFee(550);
    setRtoThreshold(65);
    setDefaultCourier("Koombiyo Logistics");

    localStorage.setItem(`laknexus_${currentTenantId}_merchant_name`, defaultName);
    localStorage.setItem(`laknexus_${currentTenantId}_wp_fee`, "350");
    localStorage.setItem(`laknexus_${currentTenantId}_outstation_fee`, "450");
    localStorage.setItem(`laknexus_${currentTenantId}_other_fee`, "550");
    localStorage.setItem(`laknexus_${currentTenantId}_rto_threshold`, "65");
    localStorage.setItem(`laknexus_${currentTenantId}_default_courier`, "Koombiyo Logistics");

    // Reset this specific client's metrics on "Today's Report" and "Month's Report" back to zero (0)
    setTodayReportOrders(0);
    setTodayReportRev(0);
    setTodayExpenses(0);
    setTodayPosCompleted(0);
    setTodayOnline(0);
    setTodayDelivered(0);
    setTodayPending(0);
    setTodayReturned(0);
    setMonthReportOrders(0);
    setMonthReportRev(0);
    setMonthExpenses(0);
    setMonthDelivered(0);
    setMonthPosCompleted(0);
    setMonthReturned(0);

    localStorage.setItem(`laknexus_${currentTenantId}_today_report_orders`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_today_report_rev`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_today_expenses`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_today_pos_completed`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_today_online`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_today_delivered`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_today_pending`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_today_returned`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_month_report_orders`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_month_report_rev`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_month_expenses`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_month_delivered`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_month_pos_completed`, "0");
    localStorage.setItem(`laknexus_${currentTenantId}_month_returned`, "0");

    setResetCounter(prev => prev + 1);
    setShowTenantResetModal(false);
    setTenantResetConfirmation("");

    setSuccessToast(`LakNexus Client: ${defaultName} Data Wiped Successfully.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    localStorage.setItem("laknexus_dark_mode", nextMode.toString());
    setSuccessToast(nextMode ? "Warehouse Dark Mode Active! / ගබඩා අඳුරු මාදිලිය සක්‍රීයයි!" : "Standard Theme Restored / සාමාන්‍ය තේමාව සක්‍රීයයි.");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Blacklist phone registry state
  const [blacklist, setBlacklist] = useState<string[]>(() => {
    const saved = localStorage.getItem("laknexus_blacklist_numbers");
    return saved ? JSON.parse(saved) : ["0771112223", "0719998887", "0754445556"];
  });
  const [newBlacklistNum, setNewBlacklistNum] = useState("");

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem("laknexus_wp_fee", wpFee.toString());
    localStorage.setItem("laknexus_outstation_fee", outstationFee.toString());
    localStorage.setItem("laknexus_other_fee", otherFee.toString());
    localStorage.setItem("laknexus_rto_threshold", rtoThreshold.toString());
    localStorage.setItem("laknexus_merchant_name", merchantName);
    localStorage.setItem("laknexus_default_courier", defaultCourier);

    // Save tenant-specific values
    localStorage.setItem(`laknexus_${currentTenantId}_wp_fee`, wpFee.toString());
    localStorage.setItem(`laknexus_${currentTenantId}_outstation_fee`, outstationFee.toString());
    localStorage.setItem(`laknexus_${currentTenantId}_other_fee`, otherFee.toString());
    localStorage.setItem(`laknexus_${currentTenantId}_rto_threshold`, rtoThreshold.toString());
    localStorage.setItem(`laknexus_${currentTenantId}_merchant_name`, merchantName);
    localStorage.setItem(`laknexus_${currentTenantId}_default_courier`, defaultCourier);
    localStorage.setItem(`laknexus_${currentTenantId}_business_owner`, businessOwner);
    localStorage.setItem(`laknexus_${currentTenantId}_business_address`, businessAddress);
    localStorage.setItem(`laknexus_${currentTenantId}_business_phone`, businessPhone);

    // Save global fallback keys for direct reading compatibility across views
    localStorage.setItem("laknexus_business_owner", businessOwner);
    localStorage.setItem("laknexus_business_address", businessAddress);
    localStorage.setItem("laknexus_business_phone", businessPhone);
    
    setSuccessToast("OMS configuration saved! / සැකසුම් යාවත්කාලීන කරන ලදී!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  useEffect(() => {
    localStorage.setItem("laknexus_blacklist_numbers", JSON.stringify(blacklist));
  }, [blacklist]);

  const handleAddBlacklist = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = newBlacklistNum.trim().replace(/[^0-9]/g, "");
    if (!cleaned) return;
    if (cleaned.length < 9) {
      alert("Please enter a valid Sri Lankan phone number (9-10 digits).");
      return;
    }
    if (!blacklist.includes(cleaned)) {
      setBlacklist([...blacklist, cleaned]);
      setSuccessToast("Number blacklisted! / අංකය අසාදු ලේඛනයට එක් කරන ලදී!");
      setTimeout(() => setSuccessToast(null), 3000);
    }
    setNewBlacklistNum("");
  };

  const handleRemoveBlacklist = (numberToRemove: string) => {
    setBlacklist(blacklist.filter((num) => num !== numberToRemove));
    setSuccessToast("Number removed! / අසාදු ලේඛනයෙන් ඉවත් කරන ලදී!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Initial real-world demo orders to load into localStorage on first-time open
  const defaultOrders: ScrapedOrder[] = [
    {
      id: "LN-837492",
      customer: {
        name: "Kamal Perera",
        phone1: "0771234567",
        address: {
          line1: "No 45, Galle Road",
          city: "Colombo 3",
          district: "Colombo",
          province: "Western"
        }
      },
      items: [
        { id: "0", name: "Red Saree Cotton Sarong", quantity: 2, price: 1800, size: "Free Size", color: "Red" }
      ],
      rtoRisk: {
        score: 20,
        level: "LOW",
        warningSinhala: "ආරක්ෂිත ඇණවුමක්, COD මගින් යැවීමට සුදුසුයි.",
        warningEnglish: "Secure order, ready to dispatch.",
        reasons: ["Verified contact phone format", "High-accuracy address information"]
      },
      courier: {
        recommended: "Koombiyo Logistics",
        fee: 350,
        reason: "Fastest next-day cash collect service for Western province",
        ratesSummary: "Rs. 350 standard 1kg"
      },
      invoice: {
        subtotal: 3600,
        deliveryFee: 350,
        total: 3950,
        thermalLayout58: "",
        thermalLayout80: ""
      },
      createdAt: "2026-06-05 10:30 AM",
      rawInput: "WhatsApp standard checkout",
      status: "Approved"
    },
    {
      id: "LN-192847",
      customer: {
        name: "Sanduni Perera",
        phone1: "0711122330",
        address: {
          line1: "No 12/A, Temple road",
          city: "Pohorabawa",
          district: "Ratnapura",
          province: "Sabaragamuwa"
        }
      },
      items: [
        { id: "0", name: "Genuine Black Handbag", quantity: 1, price: 4200, size: "Medium", color: "Black" }
      ],
      rtoRisk: {
        score: 85,
        level: "CRITICAL",
        warningSinhala: "ඇණවුම භාරදීමේ ඉහළ අවදානමක් ඇත. කරුණාකර තහවුරු කරගැනීම සඳහා අත්තිකාරම් මුදලක් ලබාගන්න (අත්තිකාරම් මුදලක් ලබාගන්න).",
        warningEnglish: "High risk of delivery failure. Recommended to request an advance payment prior to dispatch.",
        reasons: ["Extremely new TikTok profile matched", "No phone alternative provided", "Sub-provincial address resolution matches outstation risk zones"]
      },
      courier: {
        recommended: "Domex Courier",
        fee: 450,
        reason: "Excellent branch representation in Ratnapura district",
        ratesSummary: "Rs. 450 standard 1kg"
      },
      invoice: {
        subtotal: 4200,
        deliveryFee: 450,
        total: 4650,
        thermalLayout58: "",
        thermalLayout80: ""
      },
      createdAt: "2026-06-05 11:15 AM",
      rawInput: "TikTok direct raw checkout",
      status: "High Risk Hold"
    }
  ];

  const [orders, setOrders] = useState<ScrapedOrder[]>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_orders`);
    return saved ? JSON.parse(saved) : defaultOrders;
  });

  const [inventory, setInventory] = useState<any[]>(() => {
    const activeTenant = localStorage.getItem("laknexus_current_tenant_id") || "tenant_colombo_retail";
    const saved = localStorage.getItem(`laknexus_${activeTenant}_inventory`);
    if (saved) return JSON.parse(saved);
    return [
      { id: "1", name: "Smart Wallet", cost: 1000, price: 2450, stock: 50 },
      { id: "2", name: "Mens Luxury Watch", cost: 2500, price: 4990, stock: 30 },
    ];
  });

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_orders`, JSON.stringify(orders));
  }, [orders, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_inventory`, JSON.stringify(inventory));
  }, [inventory, currentTenantId]);

  // Load tenant-specific values when tenant selection changes
  useEffect(() => {
    localStorage.setItem("laknexus_current_tenant_id", currentTenantId);

    // Load orders
    const tenantOrdersKey = `laknexus_${currentTenantId}_orders`;
    const savedOrders = localStorage.getItem(tenantOrdersKey);
    let loadedOrders = defaultOrders;
    if (savedOrders) {
      loadedOrders = JSON.parse(savedOrders);
    } else {
      if (currentTenantId === "tenant_colombo_retail") {
        loadedOrders = defaultOrders;
      } else if (currentTenantId === "tenant_kandy_boutique") {
        loadedOrders = [
          {
            id: "KB-904812",
            customer: {
              name: "Anjana Bandara",
              phone1: "0770987654",
              address: { line1: "No 120, William Gopallawa Mawatha", city: "Kandy", district: "Kandy", province: "Central" }
            },
            items: [{ id: "1", name: "Mens Luxury Watch", quantity: 1, price: 4990, size: "Gold Premium", color: "Gold" }],
            rtoRisk: { score: 18, level: "LOW", warningSinhala: "ආරක්ෂිත ඇණවුමකි", warningEnglish: "Low risk order, secure to fulfill", reasons: ["Verified central phone", "High-accuracy address"] },
            courier: { recommended: "Domex Courier", fee: 450, reason: "Best delivery network in Central Province", ratesSummary: "LKR 450 standard weight" },
            invoice: { subtotal: 4990, deliveryFee: 450, total: 5440, thermalLayout58: "", thermalLayout80: "" },
            createdAt: "2026-06-05 09:12 AM",
            rawInput: "Kandy live order chat",
            status: "Approved"
          }
        ];
      } else if (currentTenantId === "tenant_galle_trends") {
        loadedOrders = [
          {
            id: "GF-402911",
            customer: {
              name: "Nisansala De Silva",
              phone1: "0711234123",
              address: { line1: "99 Pedlar Street", city: "Galle Fort", district: "Galle", province: "Southern" }
            },
            items: [{ id: "2", name: "Smart Wallet", quantity: 2, price: 2450, size: "Free Size", color: "Tan" }],
            rtoRisk: { score: 35, level: "LOW", warningSinhala: "ආරක්ෂිත ඇණවුමකි", warningEnglish: "Verified safe customer history", reasons: ["Previous successful delivers"] },
            courier: { recommended: "Koombiyo Logistics", fee: 450, reason: "Excellent next day parcel routing in Southern province", ratesSummary: "LKR 450 flat weight" },
            invoice: { subtotal: 4900, deliveryFee: 450, total: 5350, thermalLayout58: "", thermalLayout80: "" },
            createdAt: "2026-06-06 01:45 PM",
            rawInput: "Galle storefront cart checkout",
            status: "Pending Check"
          }
        ];
      }
      localStorage.setItem(tenantOrdersKey, JSON.stringify(loadedOrders));
    }
    setOrders(loadedOrders);

    // Load inventory
    const tenantInvKey = `laknexus_${currentTenantId}_inventory`;
    const savedInv = localStorage.getItem(tenantInvKey);
    let loadedInv = [
      { id: "1", name: "Smart Wallet", cost: 1000, price: 2450, stock: 50 },
      { id: "2", name: "Mens Luxury Watch", cost: 2500, price: 4990, stock: 30 },
    ];
    if (savedInv) {
      loadedInv = JSON.parse(savedInv);
    } else {
      if (currentTenantId === "tenant_kandy_boutique") {
        loadedInv = [
          { id: "1", name: "Kandy Tea Special Blend", cost: 600, price: 1500, stock: 120 },
          { id: "2", name: "Mens Luxury Watch", cost: 2500, price: 4990, stock: 45 }
        ];
      } else if (currentTenantId === "tenant_galle_trends") {
        loadedInv = [
          { id: "1", name: "Genuine Leather Sandals", cost: 1400, price: 2990, stock: 65 },
          { id: "2", name: "Smart Wallet", cost: 1000, price: 2450, stock: 80 }
        ];
      }
      localStorage.setItem(tenantInvKey, JSON.stringify(loadedInv));
    }
    setInventory(loadedInv);

    // Configurations
    const loadedWp = Number(localStorage.getItem(`laknexus_${currentTenantId}_wp_fee`) || "350");
    const loadedOutstation = Number(localStorage.getItem(`laknexus_${currentTenantId}_outstation_fee`) || "450");
    const loadedOther = Number(localStorage.getItem(`laknexus_${currentTenantId}_other_fee`) || "550");
    const loadedRto = Number(localStorage.getItem(`laknexus_${currentTenantId}_rto_threshold`) || "65");
    
    setWpFee(loadedWp);
    setOutstationFee(loadedOutstation);
    setOtherFee(loadedOther);
    setRtoThreshold(loadedRto);

    const savedMerchant = localStorage.getItem(`laknexus_${currentTenantId}_merchant_name`);
    let loadedMerchant = tenantsList.find(t => t.id === currentTenantId)?.name || "LakNexus";
    if (savedMerchant) {
      loadedMerchant = savedMerchant;
    } else {
      localStorage.setItem(`laknexus_${currentTenantId}_merchant_name`, loadedMerchant);
    }
    setMerchantName(loadedMerchant);

    const savedCourier = localStorage.getItem(`laknexus_${currentTenantId}_default_courier`) || "Koombiyo Logistics";
    setDefaultCourier(savedCourier);

    const savedOwner = localStorage.getItem(`laknexus_${currentTenantId}_business_owner`) || (currentTenantId === "tenant_colombo_retail" ? "S. Kaumina" : currentTenantId === "tenant_kandy_boutique" ? "K. Perera" : "G. Silva");
    setBusinessOwner(savedOwner);
    localStorage.setItem(`laknexus_${currentTenantId}_business_owner`, savedOwner);
    localStorage.setItem("laknexus_business_owner", savedOwner);

    const savedAddress = localStorage.getItem(`laknexus_${currentTenantId}_business_address`) || "No. 100, High Level Rd, Colombo";
    setBusinessAddress(savedAddress);
    localStorage.setItem(`laknexus_${currentTenantId}_business_address`, savedAddress);
    localStorage.setItem("laknexus_business_address", savedAddress);

    const savedPhone = localStorage.getItem(`laknexus_${currentTenantId}_business_phone`) || "011-2345678";
    setBusinessPhone(savedPhone);
    localStorage.setItem(`laknexus_${currentTenantId}_business_phone`, savedPhone);
    localStorage.setItem("laknexus_business_phone", savedPhone);

    // Today / Month metrics
    const savedTodayOrders = localStorage.getItem(`laknexus_${currentTenantId}_today_report_orders`);
    const savedTodayRev = localStorage.getItem(`laknexus_${currentTenantId}_today_report_rev`);
    const savedMonthOrders = localStorage.getItem(`laknexus_${currentTenantId}_month_report_orders`);
    const savedMonthRev = localStorage.getItem(`laknexus_${currentTenantId}_month_report_rev`);

    if (savedTodayOrders) setTodayReportOrders(Number(savedTodayOrders));
    else {
      const defaultTodayOrd = currentTenantId === "tenant_colombo_retail" ? 14 : currentTenantId === "tenant_kandy_boutique" ? 6 : 9;
      setTodayReportOrders(defaultTodayOrd);
      localStorage.setItem(`laknexus_${currentTenantId}_today_report_orders`, defaultTodayOrd.toString());
    }

    if (savedTodayRev) setTodayReportRev(Number(savedTodayRev));
    else {
      const defaultTodayRev = currentTenantId === "tenant_colombo_retail" ? 54600 : currentTenantId === "tenant_kandy_boutique" ? 28400 : 41250;
      setTodayReportRev(defaultTodayRev);
      localStorage.setItem(`laknexus_${currentTenantId}_today_report_rev`, defaultTodayRev.toString());
    }

    if (savedMonthOrders) setMonthReportOrders(Number(savedMonthOrders));
    else {
      const defaultMonthOrd = currentTenantId === "tenant_colombo_retail" ? 186 : currentTenantId === "tenant_kandy_boutique" ? 74 : 115;
      setMonthReportOrders(defaultMonthOrd);
      localStorage.setItem(`laknexus_${currentTenantId}_month_report_orders`, defaultMonthOrd.toString());
    }

    if (savedMonthRev) setMonthReportRev(Number(savedMonthRev));
    else {
      const defaultMonthRev = currentTenantId === "tenant_colombo_retail" ? 694200 : currentTenantId === "tenant_kandy_boutique" ? 312000 : 494500;
      setMonthReportRev(defaultMonthRev);
      localStorage.setItem(`laknexus_${currentTenantId}_month_report_rev`, defaultMonthRev.toString());
    }

    const savedTodayExpenses = localStorage.getItem(`laknexus_${currentTenantId}_today_expenses`);
    const savedTodayPosCompleted = localStorage.getItem(`laknexus_${currentTenantId}_today_pos_completed`);
    const savedTodayOnline = localStorage.getItem(`laknexus_${currentTenantId}_today_online`);
    const savedTodayDelivered = localStorage.getItem(`laknexus_${currentTenantId}_today_delivered`);
    const savedTodayPending = localStorage.getItem(`laknexus_${currentTenantId}_today_pending`);
    const savedTodayReturned = localStorage.getItem(`laknexus_${currentTenantId}_today_returned`);

    const savedMonthExpenses = localStorage.getItem(`laknexus_${currentTenantId}_month_expenses`);
    const savedMonthDelivered = localStorage.getItem(`laknexus_${currentTenantId}_month_delivered`);
    const savedMonthPosCompleted = localStorage.getItem(`laknexus_${currentTenantId}_month_pos_completed`);
    const savedMonthReturned = localStorage.getItem(`laknexus_${currentTenantId}_month_returned`);

    if (savedTodayExpenses) setTodayExpenses(Number(savedTodayExpenses));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 8500 : currentTenantId === "tenant_kandy_boutique" ? 4300 : 5900;
      setTodayExpenses(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_today_expenses`, defVal.toString());
    }

    if (savedTodayPosCompleted) setTodayPosCompleted(Number(savedTodayPosCompleted));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 5 : currentTenantId === "tenant_kandy_boutique" ? 2 : 3;
      setTodayPosCompleted(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_today_pos_completed`, defVal.toString());
    }

    if (savedTodayOnline) setTodayOnline(Number(savedTodayOnline));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 9 : currentTenantId === "tenant_kandy_boutique" ? 4 : 6;
      setTodayOnline(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_today_online`, defVal.toString());
    }

    if (savedTodayDelivered) setTodayDelivered(Number(savedTodayDelivered));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 4 : currentTenantId === "tenant_kandy_boutique" ? 1 : 2;
      setTodayDelivered(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_today_delivered`, defVal.toString());
    }

    if (savedTodayPending) setTodayPending(Number(savedTodayPending));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 8 : currentTenantId === "tenant_kandy_boutique" ? 4 : 6;
      setTodayPending(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_today_pending`, defVal.toString());
    }

    if (savedTodayReturned) setTodayReturned(Number(savedTodayReturned));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 2 : currentTenantId === "tenant_kandy_boutique" ? 1 : 1;
      setTodayReturned(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_today_returned`, defVal.toString());
    }

    if (savedMonthExpenses) setMonthExpenses(Number(savedMonthExpenses));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 145000 : currentTenantId === "tenant_kandy_boutique" ? 62000 : 84000;
      setMonthExpenses(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_month_expenses`, defVal.toString());
    }

    if (savedMonthDelivered) setMonthDelivered(Number(savedMonthDelivered));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 125 : currentTenantId === "tenant_kandy_boutique" ? 48 : 78;
      setMonthDelivered(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_month_delivered`, defVal.toString());
    }

    if (savedMonthPosCompleted) setMonthPosCompleted(Number(savedMonthPosCompleted));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 48 : currentTenantId === "tenant_kandy_boutique" ? 20 : 30;
      setMonthPosCompleted(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_month_pos_completed`, defVal.toString());
    }

    if (savedMonthReturned) setMonthReturned(Number(savedMonthReturned));
    else {
      const defVal = currentTenantId === "tenant_colombo_retail" ? 13 : currentTenantId === "tenant_kandy_boutique" ? 6 : 7;
      setMonthReturned(defVal);
      localStorage.setItem(`laknexus_${currentTenantId}_month_returned`, defVal.toString());
    }
  }, [currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_today_report_orders`, todayReportOrders.toString());
  }, [todayReportOrders, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_today_report_rev`, todayReportRev.toString());
  }, [todayReportRev, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_month_report_orders`, monthReportOrders.toString());
  }, [monthReportOrders, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_month_report_rev`, monthReportRev.toString());
  }, [monthReportRev, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_today_expenses`, todayExpenses.toString());
  }, [todayExpenses, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_today_pos_completed`, todayPosCompleted.toString());
  }, [todayPosCompleted, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_today_online`, todayOnline.toString());
  }, [todayOnline, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_today_delivered`, todayDelivered.toString());
  }, [todayDelivered, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_today_pending`, todayPending.toString());
  }, [todayPending, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_today_returned`, todayReturned.toString());
  }, [todayReturned, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_month_expenses`, monthExpenses.toString());
  }, [monthExpenses, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_month_delivered`, monthDelivered.toString());
  }, [monthDelivered, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_month_pos_completed`, monthPosCompleted.toString());
  }, [monthPosCompleted, currentTenantId]);

  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_month_returned`, monthReturned.toString());
  }, [monthReturned, currentTenantId]);

  // Handle saving new parsed order
  const handleSaveOrder = (newOrder: ScrapedOrder) => {
    setOrders([newOrder, ...orders]);
    
    // Increment real-time dashboard metrics
    setTodayReportOrders(prev => prev + 1);
    setTodayReportRev(prev => prev + newOrder.invoice.total);
    setTodayExpenses(prev => prev + (newOrder.courier.fee || 350));
    setTodayOnline(prev => prev + 1);
    setTodayPending(prev => prev + 1);

    setMonthReportOrders(prev => prev + 1);
    setMonthReportRev(prev => prev + newOrder.invoice.total);
    setMonthExpenses(prev => prev + (newOrder.courier.fee || 350));

    // Automatically deduct stock based on standard items matching by name (Section 1 fulfillment)
    let updatedInventory = [...inventory];
    for (const item of newOrder.items) {
       const invIdx = updatedInventory.findIndex(i => i.name.toLowerCase() === item.name.toLowerCase());
       if (invIdx !== -1) {
          updatedInventory[invIdx] = {
             ...updatedInventory[invIdx],
             stock: Math.max(0, updatedInventory[invIdx].stock - item.quantity)
          };
       }
    }
    setInventory(updatedInventory);
    
    setActiveTab("ledger"); // Switch view to order board instantly
  };

  const handleDeleteOrder = (id: string) => {
    const orderToDelete = orders.find(o => o.id === id);
    if (orderToDelete) {
      // Deduct order details from report states
      setTodayReportOrders(prev => Math.max(0, prev - 1));
      setTodayReportRev(prev => Math.max(0, prev - orderToDelete.invoice.total));
      setTodayExpenses(prev => Math.max(0, prev - (orderToDelete.courier.fee || 350)));
      
      if (orderToDelete.status === "Delivered") {
        setTodayDelivered(prev => Math.max(0, prev - 1));
        setMonthDelivered(prev => Math.max(0, prev - 1));
      } else if (orderToDelete.status === "Returned") {
        setTodayReturned(prev => Math.max(0, prev - 1));
        setMonthReturned(prev => Math.max(0, prev - 1));
      } else {
        setTodayPending(prev => Math.max(0, prev - 1));
      }

      setMonthReportOrders(prev => Math.max(0, prev - 1));
      setMonthReportRev(prev => Math.max(0, prev - orderToDelete.invoice.total));
      setMonthExpenses(prev => Math.max(0, prev - (orderToDelete.courier.fee || 350)));
    }
    setOrders(orders.filter((o) => o.id !== id));
  };

  const handleUpdateStatus = (id: string, status: ScrapedOrder["status"]) => {
    const orderToUpdate = orders.find(o => o.id === id);
    if (orderToUpdate && orderToUpdate.status !== status) {
      // If transitioned to Delivered
      if (status === "Delivered") {
        if (orderToUpdate.status === "Pending Check" || orderToUpdate.status === "Approved" || orderToUpdate.status === "High Risk Hold") {
          setTodayPending(prev => Math.max(0, prev - 1));
        }
        setTodayDelivered(prev => prev + 1);
        setMonthDelivered(prev => prev + 1);
      } else if (status === "Returned") {
        if (orderToUpdate.status === "Pending Check" || orderToUpdate.status === "Approved" || orderToUpdate.status === "High Risk Hold") {
          setTodayPending(prev => Math.max(0, prev - 1));
        }
        setTodayReturned(prev => prev + 1);
        setMonthReturned(prev => prev + 1);
      }
    }

    const updated = orders.map((o) => {
      if (o.id === id) {
        return { ...o, status };
      }
      return o;
    });
    setOrders(updated);
  };

  // Stats Counters
  const totalRevenue = orders.reduce((sum, o) => {
    if (o.status !== "High Risk Hold") {
      return sum + o.invoice.total;
    }
    return sum;
  }, 0);

  const pendingCount = orders.filter((o) => o.status === "Pending Check").length;
  const dispatchCount = orders.filter((o) => o.status === "Approved" || o.status === "Dispatched").length;
  const holdCount = orders.filter((o) => o.status === "High Risk Hold").length;

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none">
      {/* Sidebar Brand Label only */}
      <div className="p-6 border-b border-slate-800 flex flex-col items-center bg-slate-950/45 text-center">
        <h2 className="tracking-tight flex items-center justify-center gap-1">
          <span style={{
            background: "linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 800,
            fontSize: "1.2rem",
            filter: "drop-shadow(0 0 1px rgba(184, 134, 11, 0.5))"
          }}>LakNexus OMS</span>
        </h2>
        <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Sri Lanka System Console</p>
      </div>

      {/* Scrollable Nav Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0 flex flex-col">
        
        {/* DASHBOARD (ඩෑෂ්බෝඩ්) */}
        <div className="mt-4 first:mt-0 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 select-none">
            DASHBOARD (ඩෑෂ්බෝඩ්)
          </p>
          
          <button
            id="sidebar-tab-dashboard"
            onClick={() => {
              setActiveTab("dashboard");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "dashboard" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <BarChart2 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "dashboard" 
                  ? "text-emerald-200 drop-shadow-[0_0_8px_rgba(52,211,153,0.85)]" 
                  : "text-emerald-400/90 group-hover:text-emerald-300"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100 font-bold">Dashboard</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">ඩෑෂ්බෝඩ්</p>
            </div>
          </button>
        </div>

        {/* PRODUCTS (භාණ්ඩ කළමනාකරණය) */}
        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 select-none">
            Products (භාණ්ඩ)
          </p>
          <button
            id="sidebar-tab-products"
            onClick={() => {
              setActiveTab("products");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "products" 
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/30" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <FolderKanban 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "products" 
                  ? "text-amber-250 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)]" 
                  : "text-amber-500/80 group-hover:text-amber-300"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100 font-bold">Products Manager</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">භාණ්ඩ කළමනාකරණය</p>
            </div>
          </button>
        </div>
        
        {/* Group 1: Core Operations */}
        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 select-none">
            Core Operations (ප්‍රධාන මෙහෙයුම්)
          </p>
          <button
            id="sidebar-tab-parser"
            onClick={() => {
              setActiveTab("parser");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "parser" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Sparkles 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "parser" 
                  ? "text-cyan-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.75)]" 
                  : "text-cyan-500/80 group-hover:text-cyan-300"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100">AI Scraper & Voice Decoder</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">සිංහල AI පිටපත් කරන්නා</p>
            </div>
          </button>

          <button
            id="sidebar-tab-ledger"
            onClick={() => {
              setActiveTab("ledger");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "ledger" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Zap 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "ledger" 
                  ? "text-amber-200 drop-shadow-[0_0_8px_rgba(245,158,11,0.75)]" 
                  : "text-amber-500/80 group-hover:text-amber-300"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100 flex items-center justify-between">
                <span>Active Orders</span>
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[8px] font-extrabold">{orders.length}</span>
              </p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">ඇණවුම් කළමනාකරණය</p>
            </div>
          </button>
        </div>

        {/* Group 2: Financials */}
        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 select-none">
            Financials (මූල්‍ය කළමනාකරණය)
          </p>
          <button
            id="sidebar-tab-financials"
            onClick={() => {
              setActiveTab("financials");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "financials" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <BarChart2 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "financials" 
                  ? "text-emerald-200 drop-shadow-[0_0_8px_rgba(16,185,129,0.75)]" 
                  : "text-emerald-500/80 group-hover:text-emerald-300"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100">Ad-Spend & ROI Analyst</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">ප්‍රචාරණ සහ ලාභ විශ්ලේෂණය</p>
            </div>
          </button>
        </div>

        {/* Group 3: Inventory Management */}
        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 select-none">
            Inventory Management (ගබඩා කළමනාකරණය)
          </p>
          <button
            id="sidebar-tab-inventory"
            onClick={() => {
              setActiveTab("inventory");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "inventory" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <RefreshCw 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "inventory" 
                  ? "text-slate-100 drop-shadow-[0_0_8px_rgba(203,213,225,0.75)]" 
                  : "text-slate-400 group-hover:text-slate-200"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100">Live Inventory Controller</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">තොග පාලන පද්ධතිය</p>
            </div>
          </button>
        </div>

        {/* Group 3.5: Growth & Risk Mitigation */}
        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 select-none">
            Growth & Decision Support (ව්‍යාපාර සහය)
          </p>
          <button
            id="sidebar-tab-intelligence"
            onClick={() => {
              setActiveTab("intelligence");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "intelligence" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Target 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "intelligence" 
                  ? "text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)]" 
                  : "text-amber-500/80 group-hover:text-amber-300"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100">AI Growth & Risk Hub</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">ව්‍යාපාර තීරණ සහායකයා</p>
            </div>
          </button>

          <button
            id="sidebar-tab-enterprise"
            onClick={() => {
              setActiveTab("enterprise");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "enterprise" 
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <ShieldCheck 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "enterprise" 
                  ? "text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.85)]" 
                  : "text-purple-500/80 group-hover:text-purple-300"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100">Enterprise Compliance</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">මෙහෙයුම් සහ අනුකූලතාවය</p>
            </div>
          </button>
        </div>

        {/* Group 4: System Settings */}
        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1 select-none">
            System Settings (පද්ධති සැකසුම්)
          </p>
          <button
            id="sidebar-tab-settings"
            onClick={() => {
              setActiveTab("settings");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "settings" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Settings 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "settings" 
                  ? "text-blue-200 drop-shadow-[0_0_8px_rgba(59,130,246,0.75)]" 
                  : "text-blue-500/80 group-hover:text-blue-300"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100">OMS General Settings</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">මූලික පද්ධති සැකසුම්</p>
            </div>
          </button>

          <button
            id="sidebar-tab-security"
            onClick={() => {
              setActiveTab("security");
              setIsMobileSidebarOpen(false);
            }}
            className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
              activeTab === "security" 
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <ShieldCheck 
              size={18} 
              className={`shrink-0 transition-colors duration-200 ${
                activeTab === "security" 
                  ? "text-red-300 drop-shadow-[0_0_8px_rgba(239,68,68,0.85)]" 
                  : "text-red-500/80 group-hover:text-red-400"
              }`} 
            />
            <div className="flex-1">
              <p className="leading-tight text-slate-100">Live COD Security Advisor</p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">COD ආරක්ෂණ උපදේශකයා</p>
            </div>
          </button>
        </div>

      </div>

      {/* Quick Sri Lankan status indicator */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[10px] space-y-1 select-none text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-400">All Nodes Secure</span>
        </div>
        <p className="font-medium text-slate-500">Active Zone: Western Province</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col ${isDarkMode ? "dark-warehouse" : ""}`}>
      
      {/* Top Premium Ribbon Bar */}
      <div className="bg-slate-900 text-white text-xs py-2 px-6 flex justify-between items-center border-b border-slate-800 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LakNexus Connected
          </span>
          <p className="hidden md:inline font-medium text-slate-300">
            Sri Lanka's Ultimate AI-Powered Order Management System (OMS)
          </p>
        </div>
        <div className="flex items-center gap-4 font-semibold text-slate-400">
          <span>COD Zone Rate Mappings Adjusted</span>
          <span className="hidden md:inline">|</span>
          <span>Time: 2026-06-05 UTC</span>
        </div>
      </div>

      {/* Main split viewport workspace */}
      <div className="flex-1 flex flex-row min-h-0 relative">
        
        {/* Permanent Desktop Sidebar Column */}
        <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-slate-800 bg-slate-900 text-white z-20">
          {renderSidebarContent()}
        </aside>

        {/* Right workspace scrolls individually */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Main Container Header */}
          <header className="bg-white border-b border-slate-200 py-3 px-4 lg:px-8 shadow-sm relative shrink-0">
            <div className="max-w-7xl mx-auto flex flex-row items-center justify-between w-full flex-nowrap gap-3 md:gap-4">
              
              {/* Logo Brand Title */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm md:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                      {merchantName}
                    </h1>
                    <span className="text-[9px] font-bold tracking-widest text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                      OMS v4.2
                    </span>
                  </div>
                  <div className="hidden lg:flex flex-col">
                    <p className="text-[10px] text-slate-400 font-medium leading-tight">
                      Core process automation console for Sri Lankan e-commerce merchants
                    </p>
                    <div className="flex items-center gap-2.5 mt-0.5 text-[10px] text-slate-450 font-bold">
                      <span className="flex items-center gap-0.5">👤 Owner: <span className="text-slate-700 font-black">{businessOwner || "Not Set"}</span></span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-mono">📞 {businessPhone}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">📍 <span className="truncate max-w-[220px]" title={businessAddress}>{businessAddress}</span></span>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Sidebar Toggle Button */}
                <button
                  id="toggle-mobile-menu-btn"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="md:hidden p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center text-slate-705 shrink-0"
                  title="Show Menu"
                >
                  <Menu size={14} />
                </button>
              </div>

              {/* Strict Horizontal Row for Cards + Calculator */}
              <div className="flex flex-row items-center gap-2 md:gap-3 flex-nowrap shrink-0 ml-auto overflow-x-auto no-scrollbar py-0.5">
                
                {/* CARD 1: Hold & Backlogs */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-md h-11 shrink-0 select-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.65)]" />
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-tight">Hold Status</span>
                    <span className="text-[11px] md:text-xs font-semibold text-white leading-tight font-mono whitespace-nowrap">
                      {holdCount} Flagged
                    </span>
                  </div>
                </div>

                {/* CARD 2: Revenue & Yield */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-md h-11 shrink-0 select-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.65)]" />
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-tight">Revenue Yield</span>
                    <span className="text-[11px] md:text-xs font-semibold text-amber-400 leading-tight font-mono whitespace-nowrap">
                      Rs. {totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* CARD 3: Security Advisor */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-md h-11 shrink-0 select-none">
                  <ShieldCheck size={14} className="text-blue-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-tight">System Security</span>
                    <span className="text-[11px] md:text-xs font-semibold text-emerald-400 leading-tight flex items-center gap-1 font-mono whitespace-nowrap">
                      Advisor Live
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
                    </span>
                  </div>
                </div>

                {/* QUICK ACCESS ACTION BUTTON */}
                <button
                  id="navbar-quick-actions-btn"
                  onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                  className="h-11 w-11 flex items-center justify-center rounded-xl cursor-pointer border border-cyan-500/40 bg-cyan-950/20 backdrop-blur-md shadow-[0_0_12px_rgba(6,182,212,0.15)] text-cyan-300 hover:bg-cyan-900/45 hover:shadow-[0_0_18px_rgba(6,182,212,0.45)] transition-all duration-300 select-none shrink-0"
                  title="Quick Access Console (⚡)"
                >
                  <Zap size={16} className="text-cyan-300 animate-pulse" />
                </button>

                {/* RESTORE CALCULATOR BUTTON (FAR RIGHT) */}
                <button
                  id="navbar-ai-calc-btn"
                  onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
                  className="h-11 w-11 flex items-center justify-center rounded-xl cursor-pointer border border-[#d97706]/40 bg-[#d97706]/20 backdrop-blur-md shadow-[0_0_12px_rgba(217,119,6,0.2)] text-white hover:bg-[#d97706]/35 hover:shadow-[0_0_20px_rgba(217,119,6,0.55)] transition-all duration-300 select-none shrink-0"
                  title="Smart Financial Calculator"
                >
                  <span className="text-xl select-none leading-none">📟</span>
                </button>

              </div>

            </div>
          </header>

          {/* Primary Container Grid inside layout right viewport */}
          <main className="max-w-7xl mx-auto px-6 lg:px-12 mt-8 space-y-8 w-full flex-1">
            
            {activeTab === "ledger" && (
              <>
                {/* Dynamic Metric Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <MetricCard
                    title="Total Scraped Orders"
                    value={orders.length}
                    icon={<FileText size={20} />}
                    subtitle="Overall recorded dispatches"
                    trend={{ value: "4.5%", isPositive: true }}
                    color="blue"
                  />
                  <MetricCard
                    title="Sourced Revenue"
                    value={`Rs. ${totalRevenue.toLocaleString()}`}
                    icon={<TrendingUp size={20} />}
                    subtitle="COD approved transactions"
                    trend={{ value: "12.3%", isPositive: true }}
                    color="indigo"
                  />
                  <MetricCard
                    title="Dispatched (Approved)"
                    value={dispatchCount}
                    icon={<CheckCircle2 size={20} />}
                    subtitle="Passed COD confirmation checks"
                    trend={{ value: "8.1%", isPositive: true }}
                    color="emerald"
                  />
                  <MetricCard
                    title="High RTO Risks Flashes"
                    value={holdCount}
                    icon={<AlertTriangle size={20} />}
                    subtitle="Flagged outstation backlogs"
                    trend={{ value: "1.2%", isPositive: false }}
                    color="amber"
                  />
                </div>

                {/* Order Status Distribution Donut Chart (recharts integration) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center font-sans">
                  <div className="md:col-span-1 space-y-4">
                    <div>
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block">
                        Live Analytics
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1.5">
                        Order Status Distribution
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        Real-time status metrics of customer dispatches and fraud checks.
                      </p>
                    </div>
                    
                    <div className="space-y-2 mt-4 font-semibold text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                          <span>Pending Check (පරීක්ෂා වෙමින්)</span>
                        </div>
                        <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{pendingCount}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Approved (අනුමත වූ)</span>
                        </div>
                        <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{dispatchCount}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                          <span>High Risk (අවදානම් සහිත)</span>
                        </div>
                        <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">{holdCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 h-64 md:h-52 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Pending Check", value: pendingCount, color: "#f59e0b" },
                            { name: "Approved / Dispatched", value: dispatchCount, color: "#10b981" },
                            { name: "High-Risk Hold", value: holdCount, color: "#f43f5e" }
                          ].filter(item => item.value > 0)}
                          cx="55%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {[
                            { name: "Pending Check", value: pendingCount, color: "#f59e0b" },
                            { name: "Approved / Dispatched", value: dispatchCount, color: "#10b981" },
                            { name: "High-Risk Hold", value: holdCount, color: "#f43f5e" }
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderRadius: '12px', 
                            color: '#fff', 
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Legend 
                          verticalAlign="middle" 
                          align="right" 
                          layout="vertical"
                          wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {orders.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-md rounded-xl">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No active orders in database</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Content Display Panels switcher */}
            <div className="min-h-[450px]">
              {activeTab === "dashboard" && (
                <div className="w-full space-y-6">
                  {/* Real-time side-by-side report grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  
                    {/* Card 1: Today's Summary */}
                    <div id="dashboard-today-card" className="bg-slate-900/40 backdrop-blur-md border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-2xl p-6 flex flex-col justify-between h-full text-white">
                      <div>
                        {/* Title and Date Row */}
                        <div className="flex justify-between items-center pb-4 border-b border-blue-500/10 mb-4">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-200 tracking-wider">Date</div>
                            <div className="text-sm font-bold text-slate-100 font-mono">Jun 07, 2026</div>
                          </div>
                          <div className="text-right">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Today's Summary</h3>
                            <p className="text-[9px] text-slate-300 font-medium mt-0.5">දවසේ සාරාංශය</p>
                          </div>
                        </div>

                        {/* Metrics Grid Row */}
                        <div className="grid grid-cols-3 gap-3 py-4 text-center border-b border-blue-500/10 mb-4">
                          <div className="flex flex-col items-center justify-center space-y-0.5 min-w-0">
                            <span className="text-lg md:text-xl font-mono font-bold text-white whitespace-nowrap truncate">{todayReportOrders}</span>
                            <span className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider whitespace-nowrap truncate animate-pulse">Total Orders</span>
                          </div>
                          <div className="flex flex-col items-center justify-center space-y-0.5 min-w-0">
                            <span className="text-lg md:text-xl font-mono font-bold text-emerald-400 whitespace-nowrap truncate">
                              LKR {todayReportRev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                            <span className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider whitespace-nowrap truncate">Revenue</span>
                          </div>
                          <div className="flex flex-col items-center justify-center space-y-0.5 min-w-0">
                            <span className="text-lg md:text-xl font-mono font-bold text-rose-400 whitespace-nowrap truncate">
                              LKR {todayExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                            <span className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider whitespace-nowrap truncate">Expenses</span>
                          </div>
                        </div>

                        {/* Extended Financial Health Indicators */}
                        <div className="grid grid-cols-3 gap-2 bg-[#080b13]/80 border border-slate-850 p-3 rounded-xl mt-3">
                          <div className="text-center min-w-0">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Net Profit</div>
                            <div className={`text-xs font-bold font-mono ${(todayReportRev - todayExpenses) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              LKR {(todayReportRev - todayExpenses).toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                          <div className="text-center min-w-0">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Avg Order (AOV)</div>
                            <div className="text-xs font-bold text-cyan-400 font-mono">
                              LKR {(todayReportOrders > 0 ? (todayReportRev / todayReportOrders) : 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                          <div className="text-center min-w-0">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">RTO Risk</div>
                            <div className={`text-xs font-bold font-mono ${(todayReportOrders > 0 ? (todayReturned / todayReportOrders) * 100 : 0) > 15 ? "text-rose-400" : "text-emerald-400"}`}>
                              {(todayReportOrders > 0 ? (todayReturned / todayReportOrders) * 100 : 0).toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Daily Progress Goal Tracker */}
                        <div className="mt-3 bg-[#0a0d16] p-3 rounded-xl border border-slate-850 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                              🎯 Daily Target Tracker ({Math.min(100, Math.round((todayReportRev / 100000) * 100))}% Achieved)
                            </span>
                            <span className="font-mono text-cyan-400">Goal: LKR 100,000</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-500 rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(0, (todayReportRev / 100000) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Breakdown status indicators */}
                        <div className="space-y-3 mt-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10px] text-white font-bold uppercase tracking-widest">Today's Status Breakdown</h4>
                            <span className="text-[9px] text-slate-300 font-medium">දවසේ තත්ත්වය</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2 text-center">
                            <div className="p-2 bg-[#0b0f19]/80 rounded-xl border border-slate-850 flex flex-col justify-between h-14 min-w-0">
                              <div className="text-[9px] font-bold text-slate-300 truncate uppercase tracking-wider">POS Compl.</div>
                              <div className="text-sm font-mono font-bold text-white mt-1 leading-none">{todayPosCompleted}</div>
                            </div>
                            <div className="p-2 bg-[#0b0f19]/80 rounded-xl border border-slate-850 flex flex-col justify-between h-14 min-w-0">
                              <div className="text-[9px] font-bold text-slate-300 truncate uppercase tracking-wider">Online</div>
                              <div className="text-sm font-mono font-bold text-white mt-1 leading-none">{todayOnline}</div>
                            </div>
                            <div className="p-2 bg-[#0b0f19]/80 rounded-xl border border-slate-850 flex flex-col justify-between h-14 min-w-0">
                              <div className="text-[9px] font-bold text-slate-300 truncate uppercase tracking-wider">Delivered</div>
                              <div className="text-sm font-mono font-bold text-emerald-400 mt-1 leading-none">{todayDelivered}</div>
                            </div>
                            <div className="p-2 bg-[#0b0f19]/80 rounded-xl border border-slate-850 flex flex-col justify-between h-14 min-w-0">
                              <div className="text-[9px] font-bold text-slate-300 truncate uppercase tracking-wider">Pending</div>
                              <div className="text-sm font-mono font-bold text-amber-400 mt-1 leading-none">{todayPending}</div>
                            </div>
                            <div className="p-2 bg-[#0b0f19]/80 rounded-xl border border-slate-850 flex flex-col justify-between h-14 min-w-0">
                              <div className="text-[9px] font-bold text-slate-300 truncate uppercase tracking-wider">Returned</div>
                              <div className="text-sm font-mono font-bold text-rose-400 mt-1 leading-none">{todayReturned}</div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Calibration Controls */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-extrabold uppercase tracking-widest flex items-center gap-1">
                              ⚙️ Adjust Today's Data (දත්ත සකසන්න)
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center justify-between bg-[#0b0f19]/40 p-1 px-2 rounded-lg border border-slate-800/60">
                              <span className="text-[9px] font-mono text-slate-300">Revenue</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setTodayReportRev(prev => Math.max(0, prev - 1000))} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setTodayReportRev(prev => prev + 1000)} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-[#0b0f19]/40 p-1 px-2 rounded-lg border border-slate-800/60">
                              <span className="text-[9px] font-mono text-slate-300">Expenses</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setTodayExpenses(prev => Math.max(0, prev - 500))} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setTodayExpenses(prev => prev + 500)} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-[#0b0f19]/40 p-1 px-2 rounded-lg border border-slate-800/60">
                              <span className="text-[9px] font-mono text-slate-300">Orders</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setTodayReportOrders(prev => Math.max(0, prev - 1))} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setTodayReportOrders(prev => prev + 1)} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-5 gap-1 pt-1">
                            <div className="flex flex-col items-center bg-[#0b0f19]/20 p-1 rounded-md border border-slate-850">
                              <span className="text-[7.5px] text-slate-400">Delivered</span>
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setTodayDelivered(prev => Math.max(0, prev - 1))} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-400 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setTodayDelivered(prev => prev + 1)} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex flex-col items-center bg-[#0b0f19]/20 p-1 rounded-md border border-slate-850">
                              <span className="text-[7.5px] text-slate-400">Pending</span>
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setTodayPending(prev => Math.max(0, prev - 1))} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-400 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setTodayPending(prev => prev + 1)} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex flex-col items-center bg-[#0b0f19]/20 p-1 rounded-md border border-slate-850">
                              <span className="text-[7.5px] text-slate-400">Returned</span>
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setTodayReturned(prev => Math.max(0, prev - 1))} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-400 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setTodayReturned(prev => prev + 1)} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex flex-col items-center bg-[#0b0f19]/20 p-1 rounded-md border border-slate-850">
                              <span className="text-[7.5px] text-slate-400">POS.C</span>
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setTodayPosCompleted(prev => Math.max(0, prev - 1))} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-400 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setTodayPosCompleted(prev => prev + 1)} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex flex-col items-center bg-[#0b0f19]/20 p-1 rounded-md border border-slate-850">
                              <span className="text-[7.5px] text-slate-400">Online</span>
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setTodayOnline(prev => Math.max(0, prev - 1))} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-400 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setTodayOnline(prev => prev + 1)} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive testers */}
                      <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap justify-end gap-2 text-white">
                        <button
                          type="button"
                          id="simulate-today-order"
                          onClick={() => {
                            const simId = `LN-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
                            const isOnline = Math.random() > 0.4;
                            const orderVal = 3450 + Math.floor(Math.random() * 5) * 500;
                            const courierFee = isOnline ? 450 : 350;
                            
                            const newSimOrder: ScrapedOrder = {
                              id: simId,
                              customer: {
                                name: "Simulated Guest " + simId.split("-")[2],
                                phone1: "077" + Math.floor(1000000 + Math.random() * 9000000),
                                address: {
                                  line1: "Main Junction Road",
                                  city: "Colombo 03",
                                  district: "Colombo",
                                  province: "Western"
                                }
                              },
                              items: [{ id: "0", name: "Smart Wallet", quantity: 1, price: orderVal, color: "Black" }],
                              rtoRisk: {
                                score: 12,
                                level: "LOW",
                                warningSinhala: "පිරික්සූ පාරිභෝගිකයා",
                                warningEnglish: "Verified safe client logs",
                                reasons: ["Valid cellular signature"]
                              },
                              courier: { recommended: "Koombiyo Logistics", fee: courierFee, reason: "Optimized route priority", ratesSummary: `LKR ${courierFee} rate` },
                              invoice: { subtotal: orderVal, deliveryFee: courierFee, total: orderVal + courierFee, thermalLayout58: "", thermalLayout80: "" },
                              createdAt: "2026-06-07 03:20 PM",
                              rawInput: "Live simulation request",
                              status: "Pending Check"
                            };

                            setOrders(prev => [newSimOrder, ...prev]);

                            setTodayReportOrders(prev => prev + 1);
                            setTodayReportRev(prev => prev + orderVal);
                            setTodayExpenses(prev => prev + courierFee);
                            if (isOnline) {
                              setTodayOnline(prev => prev + 1);
                            } else {
                              setTodayPosCompleted(prev => prev + 1);
                            }
                            setTodayPending(prev => prev + 1);

                            // Keep month metrics in logical harmony
                            setMonthReportOrders(prev => prev + 1);
                            setMonthReportRev(prev => prev + orderVal);
                            setMonthExpenses(prev => prev + courierFee);
                            if (!isOnline) {
                              setMonthPosCompleted(prev => prev + 1);
                            }

                            setSuccessToast(`Simulated Order ${simId} (LKR ${(orderVal + courierFee).toLocaleString()}) added directly to Ledger!`);
                            setTimeout(() => setSuccessToast(null), 3000);
                          }}
                          className="px-3 py-1.5 bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 font-extrabold text-[10px] rounded-lg border border-blue-800/60 transition-all uppercase cursor-pointer"
                        >
                          + Simulate Order
                        </button>
                        <button
                          type="button"
                          id="mark-today-delivered"
                          onClick={() => {
                            // Find first order in orders list with Pending or Approved status to mark as Delivered
                            const pendingIndex = orders.findIndex(o => o.status === "Pending Check" || o.status === "Approved" || o.status === "High Risk Hold");
                            if (pendingIndex !== -1) {
                              const targetOrder = orders[pendingIndex];
                              const orderVal = targetOrder.invoice.total;
                              
                              const updated = [...orders];
                              updated[pendingIndex] = { ...targetOrder, status: "Delivered" };
                              setOrders(updated);

                              setTodayPending(prev => Math.max(0, prev - 1));
                              setTodayDelivered(prev => prev + 1);
                              setTodayReportRev(prev => prev + orderVal);
                              
                              setMonthDelivered(prev => prev + 1);
                              setMonthReportRev(prev => prev + orderVal);
                              
                              setSuccessToast(`Transitioned Order ${targetOrder.id} to Delivered! Added LKR ${orderVal.toLocaleString()} to Today's and Month's sales.`);
                            } else {
                              // Fallback virtual increments if orders ledger empty
                              setTodayDelivered(prev => prev + 1);
                              setTodayReportOrders(prev => prev + 1);
                              setTodayReportRev(prev => prev + 4990);
                              
                              setMonthDelivered(prev => prev + 1);
                              setMonthReportOrders(prev => prev + 1);
                              setMonthReportRev(prev => prev + 4990);
                              
                              setSuccessToast("Simulated direct virtual delivery of LKR 4,990.00!");
                            }
                            setTimeout(() => setSuccessToast(null), 3000);
                          }}
                          className="px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 font-extrabold text-[10px] rounded-lg border border-emerald-800/60 transition-all uppercase cursor-pointer"
                        >
                          ✓ Confirm Delivery
                        </button>
                      </div>
                    </div>

                    {/* Card 2: This Month's Summary */}
                    <div id="dashboard-month-card" className="bg-slate-900/40 backdrop-blur-md border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] rounded-2xl p-6 flex flex-col justify-between h-full text-white">
                      <div>
                        {/* Title and Month Row */}
                        <div className="flex justify-between items-center pb-4 border-b border-blue-500/10 mb-4">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-200 tracking-wider">Month</div>
                            <div className="text-sm font-bold text-slate-100 font-mono">June 2026</div>
                          </div>
                          <div className="text-right">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">This Month</h3>
                            <p className="text-[9px] text-slate-300 font-medium mt-0.5">මාසික සාරාංශය</p>
                          </div>
                        </div>

                        {/* Metrics Grid Row */}
                        <div className="grid grid-cols-3 gap-3 py-4 text-center border-b border-blue-500/10 mb-4">
                          <div className="flex flex-col items-center justify-center space-y-0.5 min-w-0">
                            <span className="text-lg md:text-xl font-mono font-bold text-white whitespace-nowrap truncate">{monthReportOrders}</span>
                            <span className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider whitespace-nowrap truncate">Total Orders</span>
                          </div>
                          <div className="flex flex-col items-center justify-center space-y-0.5 min-w-0">
                            <span className="text-lg md:text-xl font-mono font-bold text-emerald-400 whitespace-nowrap truncate">
                              LKR {monthReportRev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                            <span className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider whitespace-nowrap truncate">Revenue</span>
                          </div>
                          <div className="flex flex-col items-center justify-center space-y-0.5 min-w-0">
                            <span className="text-lg md:text-xl font-mono font-bold text-rose-400 whitespace-nowrap truncate">
                              LKR {monthExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </span>
                            <span className="text-[10px] text-slate-200 font-semibold uppercase tracking-wider whitespace-nowrap truncate">Expenses</span>
                          </div>
                        </div>

                        {/* Extended Financial Health Indicators */}
                        <div className="grid grid-cols-3 gap-2 bg-[#080b13]/80 border border-slate-850 p-3 rounded-xl mt-3">
                          <div className="text-center min-w-0">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Net Profit</div>
                            <div className={`text-xs font-bold font-mono ${(monthReportRev - monthExpenses) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              LKR {(monthReportRev - monthExpenses).toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </div>
                          </div>
                          <div className="text-center min-w-0">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">Net Margin</div>
                            <div className={`text-xs font-bold font-mono ${(monthReportRev > 0 ? ((monthReportRev - monthExpenses) / monthReportRev) * 100 : 0) >= 30 ? "text-emerald-400" : "text-cyan-400"}`}>
                              {(monthReportRev > 0 ? ((monthReportRev - monthExpenses) / monthReportRev) * 100 : 0).toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-center min-w-0">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">RTO Cost loss</div>
                            <div className="text-xs font-bold text-rose-400 font-mono">
                              LKR {(monthReturned * 450).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Monthly Progress Goal Tracker */}
                        <div className="mt-3 bg-[#0a0d16] p-3 rounded-xl border border-slate-850 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                              📊 Monthly Sales Progress ({Math.min(100, Math.round((monthReportRev / 1000000) * 100))}% of LKR 1.0M Goal)
                            </span>
                            <span className="font-mono text-emerald-400">Goal: LKR 1,000,000</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full" 
                              style={{ width: `${Math.min(100, Math.max(0, (monthReportRev / 1000000) * 100))}%` }}
                            />
                          </div>
                        </div>

                        {/* Breakdown status indicators */}
                        <div className="space-y-3 mt-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10px] text-white font-bold uppercase tracking-widest">Monthly Status Breakdown</h4>
                            <span className="text-[9px] text-slate-300 font-medium">මාසික තත්ත්වය</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="p-2 bg-[#0b0f19]/80 rounded-xl border border-slate-850 flex flex-col justify-between h-14 min-w-0">
                              <div className="text-[9px] font-bold text-slate-300 truncate uppercase tracking-wider">Delivered</div>
                              <div className="text-sm font-mono font-bold text-emerald-400 mt-1 leading-none">{monthDelivered}</div>
                            </div>
                            <div className="p-2 bg-[#0b0f19]/80 rounded-xl border border-slate-850 flex flex-col justify-between h-14 min-w-0">
                              <div className="text-[9px] font-bold text-slate-300 truncate uppercase tracking-wider">POS Compl.</div>
                              <div className="text-sm font-mono font-bold text-white mt-1 leading-none">{monthPosCompleted}</div>
                            </div>
                            <div className="p-2 bg-[#0b0f19]/80 rounded-xl border border-slate-850 flex flex-col justify-between h-14 min-w-0">
                              <div className="text-[9px] font-bold text-slate-300 truncate uppercase tracking-wider">Returned</div>
                              <div className="text-sm font-mono font-bold text-rose-400 mt-1 leading-none">{monthReturned}</div>
                            </div>
                            <div className="p-2 bg-blue-950/40 rounded-xl border border-blue-900/30 flex flex-col justify-between h-14 min-w-0 items-center justify-center text-center">
                              <div className="text-[9px] font-bold text-blue-400 truncate uppercase tracking-wider">Success Rate</div>
                              <div className="text-sm font-mono font-bold text-blue-400 mt-1 leading-none">
                                {monthReportOrders > 0 ? Math.round((monthDelivered / monthReportOrders) * 100) : 0}%
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Calibration Controls */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-extrabold uppercase tracking-widest flex items-center gap-1">
                              ⚙️ Adjust Month's Data (දත්ත සකසන්න)
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center justify-between bg-[#0b0f19]/40 p-1 px-2 rounded-lg border border-slate-800/60">
                              <span className="text-[9px] font-mono text-slate-300">Revenue</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setMonthReportRev(prev => Math.max(0, prev - 10000))} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setMonthReportRev(prev => prev + 10000)} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-[#0b0f19]/40 p-1 px-2 rounded-lg border border-slate-800/60">
                              <span className="text-[9px] font-mono text-slate-300">Expenses</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setMonthExpenses(prev => Math.max(0, prev - 5000))} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setMonthExpenses(prev => prev + 5000)} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between bg-[#0b0f19]/40 p-1 px-2 rounded-lg border border-slate-800/60">
                              <span className="text-[9px] font-mono text-slate-300">Orders</span>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setMonthReportOrders(prev => Math.max(0, prev - 5))} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setMonthReportOrders(prev => prev + 5)} className="h-4 w-4 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <div className="flex flex-col items-center bg-[#0b0f19]/20 p-1 rounded-md border border-slate-850">
                              <span className="text-[7.5px] text-slate-400">Delivered</span>
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setMonthDelivered(prev => Math.max(0, prev - 1))} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-400 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setMonthDelivered(prev => prev + 1)} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex flex-col items-center bg-[#0b0f19]/20 p-1 rounded-md border border-slate-850">
                              <span className="text-[7.5px] text-slate-400">Returned</span>
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setMonthReturned(prev => Math.max(0, prev - 1))} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-400 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setMonthReturned(prev => prev + 1)} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                            <div className="flex flex-col items-center bg-[#0b0f19]/20 p-1 rounded-md border border-slate-850">
                              <span className="text-[7.5px] text-slate-400">POS.C</span>
                              <div className="flex gap-1 mt-1">
                                <button onClick={() => setMonthPosCompleted(prev => Math.max(0, prev - 1))} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-400 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">-</button>
                                <button onClick={() => setMonthPosCompleted(prev => prev + 1)} className="h-3.5 w-3.5 bg-[#0b0f19] text-slate-300 hover:text-white hover:bg-slate-800 text-[8px] rounded flex items-center justify-center cursor-pointer select-none">+</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive testers */}
                      <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap justify-end gap-2 text-white">
                        <button
                          type="button"
                          id="simulate-month-order"
                          onClick={() => {
                            const simId = `LN-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
                            const isOnline = Math.random() > 0.4;
                            const orderVal = 3990;
                            const courierFee = 550;
                            
                            const newSimOrder: ScrapedOrder = {
                              id: simId,
                              customer: {
                                name: "Simulated Month Guest",
                                phone1: "071" + Math.floor(1000000 + Math.random() * 9000000),
                                address: {
                                  line1: "Galle Fort Fortification",
                                  city: "Galle",
                                  district: "Galle",
                                  province: "Southern"
                                }
                              },
                              items: [{ id: "0", name: "Genuine Black Handbag", quantity: 1, price: orderVal, color: "Black" }],
                              rtoRisk: {
                                score: 10,
                                level: "LOW",
                                warningSinhala: "පිරික්සූ පාරිභෝගිකයා",
                                warningEnglish: "Verified safe client logs",
                                reasons: ["Valid cellular signature"]
                              },
                              courier: { recommended: "Domex Courier", fee: courierFee, reason: "Southern distribution prioritised", ratesSummary: `LKR ${courierFee} rate` },
                              invoice: { subtotal: orderVal, deliveryFee: courierFee, total: orderVal + courierFee, thermalLayout58: "", thermalLayout80: "" },
                              createdAt: "2026-06-02 12:45 PM",
                              rawInput: "Live month simulation request",
                              status: "Pending Check"
                            };

                            setOrders(prev => [newSimOrder, ...prev]);

                            setMonthReportOrders(prev => prev + 1);
                            setMonthReportRev(prev => prev + orderVal);
                            setMonthExpenses(prev => prev + courierFee);
                            if (isOnline) {
                              setMonthPosCompleted(prev => prev + 1);
                            }

                            setSuccessToast(`Monthly order ${simId} simulated & appended to ledger database!`);
                            setTimeout(() => setSuccessToast(null), 2500);
                          }}
                          className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 font-extrabold text-[10px] rounded-lg border border-amber-800/60 transition-all uppercase cursor-pointer"
                        >
                          + Simulate Month Order
                        </button>
                        <button
                          type="button"
                          id="increment-month-delivered"
                          onClick={() => {
                            // Find first order in orders list with Pending or Approved status to mark as Delivered
                            const pendingIndex = orders.findIndex(o => o.status === "Pending Check" || o.status === "Approved" || o.status === "High Risk Hold");
                            if (pendingIndex !== -1) {
                              const targetOrder = orders[pendingIndex];
                              const orderVal = targetOrder.invoice.total;
                              
                              const updated = [...orders];
                              updated[pendingIndex] = { ...targetOrder, status: "Delivered" };
                              setOrders(updated);

                              setMonthDelivered(prev => prev + 1);
                              setMonthReportRev(prev => prev + orderVal);
                              setSuccessToast(`Transitioned Order ${targetOrder.id} to Delivered! Added LKR ${orderVal.toLocaleString()} to Month's Revenue.`);
                            } else {
                              setMonthDelivered(prev => prev + 1);
                              setSuccessToast("Accumulated monthly delivery count increased!");
                            }
                            setTimeout(() => setSuccessToast(null), 2500);
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-105 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 transition-all uppercase cursor-pointer"
                        >
                          + Mark Delivered
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === "products" && (
                <ProductsSection 
                  currentTenantId={currentTenantId} 
                  inventory={inventory} 
                  setInventory={setInventory} 
                />
              )}

              {activeTab === "enterprise" && (
                <EnterpriseSuite
                  orders={orders}
                  inventory={inventory}
                  setOrders={setOrders}
                  setInventory={setInventory}
                  currentTenantId={currentTenantId}
                />
              )}

              {activeTab === "parser" && (
                <OrderParser onSaveOrder={handleSaveOrder} />
              )}

              {activeTab === "ledger" && (
                <ActiveOrders
                  orders={orders}
                  onDeleteOrder={handleDeleteOrder}
                  onUpdateStatus={handleUpdateStatus}
                />
              )}

              {activeTab === "financials" && (
                <FinancialPlanner key={`${currentTenantId}_cfo_${resetCounter}`} />
              )}

              {activeTab === "inventory" && (
                <InventoryManager inventory={inventory} setInventory={setInventory} orders={orders} currentTenantId={currentTenantId} />
              )}

              {activeTab === "intelligence" && (
                <BusinessIntelligence 
                  key={`${currentTenantId}_${resetCounter}`}
                  currentTenantId={currentTenantId}
                  inventory={inventory} 
                  orders={orders} 
                />
              )}

              {activeTab === "settings" && (
                <div className="space-y-6">
                  {/* General Configuration Form */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                        ⚙️ OMS General Configuration <span className="text-xs font-normal text-slate-400">| මූලික සැකසුම්</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Configure default province rates, high-risk flag hold parameters, and custom brand profiles.
                      </p>
                    </div>

                    <form onSubmit={handleSaveSettings} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Shop Details */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Store Profile / වෙළඳසැල් පැතිකඩ</h3>
                          
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 block">Merchant Shop Name (English/Sinhala)</label>
                            <input 
                              type="text" 
                              id="merchant-shop-input"
                              value={merchantName} 
                              onChange={(e) => setMerchantName(e.target.value)}
                              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-medium text-slate-750"
                              placeholder="e.g. LakNexus OMS Demo Store"
                              required
                            />
                          </div>

                          {/* Late-Night Warehouse Mode Toggle */}
                          <div className="p-4 rounded-xl border border-blue-100/60 bg-blue-50/20 space-y-2 select-none">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                  🌙 Late-Night Dark Theme
                                </span>
                                <span className="text-[10px] text-slate-500 block font-semibold">
                                  ගබඩා මෙහෙයුම් සඳහා (Warehouse Mode)
                                </span>
                              </div>
                              <button
                                type="button"
                                id="dark-mode-toggle-switch"
                                onClick={toggleDarkMode}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isDarkMode ? "bg-blue-600" : "bg-slate-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    isDarkMode ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-450 font-medium leading-relaxed">
                              Swaps the entire interface to a high-contrast dark palette to minimize eye fatigue during late-night shift packaging and warehouse audits.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 block">Default Courier Companion</label>
                            <select 
                              id="default-courier-select"
                              value={defaultCourier} 
                              onChange={(e) => setDefaultCourier(e.target.value)}
                              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-medium text-slate-750"
                            >
                              <option value="Koombiyo Logistics font-mono">Koombiyo Logistics</option>
                              <option value="Domex Courier">Domex Courier</option>
                              <option value="Pronto Lanka">Pronto Lanka</option>
                              <option value="Fardar Express">Fardar Express</option>
                              <option value="Prompt Xpress">Prompt Xpress</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 block">RTO Hold Warning Score Threshold (%)</label>
                            <div className="flex items-center gap-4">
                              <input 
                                type="range" 
                                min="30" 
                                max="90" 
                                value={rtoThreshold} 
                                onChange={(e) => setRtoThreshold(Number(e.target.value))}
                                className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              />
                              <span className="text-xs font-extrabold text-blue-600 border border-blue-100 bg-blue-50 px-2 py-1 rounded min-w-[3rem] text-center">
                                {rtoThreshold}%
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-450 leading-relaxed font-medium">
                              Any order with RTO metrics surpassing this target gets automatically held for double confirmation or manual calls.
                            </p>
                          </div>

                          {/* Corporate Identity Profile */}
                          <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 flex items-center gap-1.5 font-sans">
                              🏢 Corporate Identity / ව්‍යාපාරික තොරතුරු
                            </h3>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-600 block">Business Owner (අයිතිකරු / කළමනාකරු)</label>
                              <input 
                                type="text" 
                                id="business-owner-input"
                                value={businessOwner} 
                                onChange={(e) => setBusinessOwner(e.target.value)}
                                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-medium text-slate-750"
                                placeholder="e.g. S. Kaumina"
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-600 block">Registered Address (ලියාපදිංචි ලිපිනය)</label>
                              <input 
                                type="text" 
                                id="business-address-input"
                                value={businessAddress} 
                                onChange={(e) => setBusinessAddress(e.target.value)}
                                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-medium text-slate-750"
                                placeholder="e.g. No. 100, High Level Rd, Colombo"
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-600 block">Business Hotline (දුරකථන අංකය)</label>
                              <input 
                                type="text" 
                                id="business-phone-input"
                                value={businessPhone} 
                                onChange={(e) => setBusinessPhone(e.target.value)}
                                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-bold font-mono text-slate-755"
                                placeholder="e.g. 011-2345678"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Delivery Charges */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">COD Delivery Rate Slabs / ප්‍රවාහන ගාස්තු</h3>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 block">Western Province Base Rate (LKR)</label>
                            <input 
                              type="number" 
                              id="wp-fee-input"
                              value={wpFee} 
                              onChange={(e) => setWpFee(Number(e.target.value))}
                              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-mono font-medium"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 block">Outstation (Southern, Central, Sabaragamuwa) Base Rate (LKR)</label>
                            <input 
                              type="number" 
                              id="outstation-fee-input"
                              value={outstationFee} 
                              onChange={(e) => setOutstationFee(Number(e.target.value))}
                              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-mono font-medium"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 block">Far Outstation (Northern, Eastern, etc.) Base Rate (LKR)</label>
                            <input 
                              type="number" 
                              id="other-fee-input"
                              value={otherFee} 
                              onChange={(e) => setOtherFee(Number(e.target.value))}
                              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-mono font-medium"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end border-t border-slate-100 pt-4">
                        <button 
                          type="submit"
                          id="save-oms-config-btn"
                          className="p-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Save size={14} />
                          <span>Save OMS Configuration</span>
                        </button>
                      </div>
                    </form>

                    {/* Danger Zone */}
                    <div className="border-t border-slate-100 pt-6 mt-8 space-y-6">
                      {/* Sub-section 1: Multi-Tenant Data Reset (Clear My Account Data) */}
                      <div className="p-4 rounded-xl border border-red-200 bg-red-50/10 space-y-3">
                        <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                          ⚠️ Isolated Client Danger Zone / සේවාලාභී දත්ත මකාදැමීම
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                          This operation will clear only the current client account (<span className="font-extrabold text-slate-900">{tenantsList.find(t => t.id === currentTenantId)?.name}</span>). All client-specific items, order logs, configurations, as well as <span className="font-extrabold text-rose-700">Today's Summary</span> and <span className="font-extrabold text-rose-700">This Month's Summary</span> metrics will be restored to absolute zero. This will NOT affect any other tenants on the LakNexus network.
                        </p>
                        
                        <div className="pt-1">
                          <button
                            type="button"
                            id="tenant-reset-trigger-button"
                            onClick={() => {
                              setTenantResetConfirmation("");
                              setShowTenantResetModal(true);
                            }}
                            style={{
                              backgroundColor: "#dc2626",
                              color: "#ffffff",
                              boxShadow: "0 0 15px rgba(220, 38, 38, 0.5)",
                              fontWeight: 800,
                              fontSize: "12px",
                              letterSpacing: "0.05em"
                            }}
                            className="p-3 px-6 hover:bg-red-700 text-white font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
                          >
                            <span>🚨 Clear My Account Data</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      🔒 Live COD Security Advisor <span className="text-xs font-normal text-slate-500">| ආරක්ෂණ සහ අසාදු ලේඛන</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage Sri Lankan phone blacklist database registers and evaluate outstation risks proactively.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left pane: Blacklist registry */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Blacklist Telephone Register / අසාදු ලේඛනය</h3>
                      
                      <form onSubmit={handleAddBlacklist} className="flex gap-2">
                        <input 
                          type="text" 
                          id="blacklist-phone-input"
                          placeholder="e.g. 0771112223 (9/10 digits)"
                          value={newBlacklistNum}
                          onChange={(e) => setNewBlacklistNum(e.target.value)}
                          className="flex-1 text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono font-medium text-slate-750"
                        />
                        <button 
                          type="submit"
                          id="add-blacklist-btn"
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          Add blocked
                        </button>
                      </form>

                      {/* List of currently blacklisted numbers */}
                      <div className="border border-slate-100 rounded-2xl divide-y max-h-[220px] overflow-y-auto bg-slate-50/20">
                        {blacklist.length === 0 ? (
                          <p className="text-xs text-slate-400 p-4 text-center select-none font-medium">No blocked numbers in registry.</p>
                        ) : (
                          blacklist.map((num) => (
                            <div key={num} className="flex items-center justify-between p-3 px-4 text-xs font-medium bg-white/60">
                              <code className="text-slate-700 font-mono font-extrabold tracking-normal text-xs">{num}</code>
                              <button 
                                onClick={() => handleRemoveBlacklist(num)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                title="Remove from blacklist"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        💡 Blacklisting matches any numbers during the WhatsApp/Socials scrape stream, immediately boosting risks to 99% and raising a RTO Security Warning banner.
                      </p>
                    </div>

                    {/* Right pane: District RTO Matrix Map/Layout */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Sri Lanka District RTO Matrix / දිස්ත්‍රික් අවදානම් දර්ශකය</h3>
                      
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {[
                          { name: "Western (Colombo / Gampaha / Kalutara)", rate: "2.1% - Very Safe", level: "safe", bar: 15 },
                          { name: "Central (Kandy / Matale / Nuwara Eliya)", rate: "4.8% - Stable", level: "safe", bar: 30 },
                          { name: "Southern (Galle / Matara / Hambantota)", rate: "5.2% - Stable", level: "safe", bar: 35 },
                          { name: "Sabaragamuwa (Ratnapura / Kegalle)", rate: "11.5% - Moderate", level: "moderate", bar: 55 },
                          { name: "Uva (Badulla / Monaragala)", rate: "13.2% - Moderate", level: "moderate", bar: 65 },
                          { name: "North Western (Kurunegala / Puttalam)", rate: "6.9% - Stable", level: "safe", bar: 42 },
                          { name: "North Central (Anuradhapura / Polonnaruwa)", rate: "12.1% - Moderate", level: "moderate", bar: 60 },
                          { name: "Eastern (Trincomalee / Batticaloa / Ampara)", rate: "18.4% - Critical Zone", level: "critical", bar: 85 },
                          { name: "Northern (Jaffna / Mannar / Vavuniya)", rate: "19.3% - Critical Zone", level: "critical", bar: 90 },
                        ].map((dist) => (
                          <div key={dist.name} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/10 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-700 tracking-tight text-[11px]">{dist.name}</span>
                              <span className={`text-[10px] ${dist.level === "safe" ? "text-emerald-600" : dist.level === "moderate" ? "text-amber-500" : "text-rose-500"}`}>{dist.rate}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${dist.level === "safe" ? "bg-emerald-500" : dist.level === "moderate" ? "bg-amber-400" : "bg-rose-500"}`}
                                style={{ width: `${dist.bar}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Humble Elegant Footer following anti-slop guidelines */}
          <footer className="max-w-7xl mx-auto px-6 lg:px-12 mt-16 border-t border-slate-200/60 py-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 font-medium shrink-0">
            <p className="flex items-center gap-1.5">
              LakNexus OMS Core Automation Dashboard — Powered by Gemini AI Processing
            </p>
            <p className="flex items-center gap-1 mt-2 md:mt-0">
              Made with <Heart className="size-3 text-blue-500 fill-blue-500" /> for Sri Lankan E-commerce Entrepreneurs
            </p>
          </footer>
        </div>
      </div>

      {/* Floating success toast notifier */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white p-3.5 px-5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 z-50"
          >
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hard Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-slate-950 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 max-w-md w-full relative z-10 space-y-4 text-slate-850"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <ShieldAlert size={28} className="shrink-0 animate-bounce" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    System Destructive Operation
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">පද්ධතිය යළි පිහිටුවීම</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                You are about to execute a complete factory configuration wipe on <span style={{
                  background: "linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontSize: "1.05em",
                  filter: "drop-shadow(0 0 1px rgba(184, 134, 11, 0.5))"
                }}>LakNexus OMS</span>. This will irreversibly erase all client records, order registers, inventories, blacklists, and AI agent history.
              </p>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  id="cancel-reset-modal-btn"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  ⚪ Cancel
                </button>
                <button
                  type="button"
                  id="confirm-factory-reset-btn"
                  onClick={handleHardReset}
                  className="px-4 py-2 font-bold text-xs bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-900/10 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap animate-pulse"
                >
                  <span>🔴 Confirm Reset</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tenant-Isolated Reset Modal */}
      <AnimatePresence>
        {showTenantResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTenantResetModal(false)}
              className="absolute inset-0 bg-slate-950 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-red-100 shadow-2xl p-6 max-w-md w-full relative z-10 space-y-4 text-slate-850"
            >
              <div className="flex items-center gap-3 text-red-600">
                <ShieldAlert size={28} className="shrink-0 animate-pulse text-red-600" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Isolated Account Data Wipe
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">සේවාලාභී ගිණුම් දත්ත මකාදැමීම</p>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-semibold space-y-2 leading-relaxed">
                <p>
                  You are about to irreversibly clear all orders, inventories, rate structures, configurations, AI agent chat history and prompts inside:
                </p>
                <div className="p-3 bg-red-50/30 border border-red-100 rounded-xl font-bold text-slate-900">
                  🏢 Client Store: {tenantsList.find(t => t.id === currentTenantId)?.name}
                </div>
                <p>
                  This action will also sync and set both <span className="font-extrabold text-red-650">Today's Report</span> and <span className="font-extrabold text-red-650">Month's Report</span> back to exactly zero (0) for this client, leaving other client accounts fully untouched and intact.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  id="cancel-tenant-reset-btn"
                  onClick={() => setShowTenantResetModal(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  ⚪ Cancel
                </button>
                <button
                  type="button"
                  id="confirm-tenant-reset-btn"
                  onClick={handleTenantFactoryReset}
                  className="px-4 py-2 font-bold text-xs bg-red-600 hover:bg-red-700 shadow-md shadow-red-900/10 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>🔴 Confirm Reset</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Access Toolbar Modal */}
      <AnimatePresence>
        {isQuickActionsOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickActionsOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] max-w-md w-full relative z-10 overflow-hidden text-white p-6"
            >
              {/* Close Button Top-Right */}
              <button 
                onClick={() => setIsQuickActionsOpen(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                  <Zap size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    Quick Operations Command (⚡)
                  </h3>
                   <p className="text-[10px] text-slate-400 font-medium">වේගවත් මෙහෙයුම් කේන්ද්‍රය - LakNexus SaaS</p>
                </div>
              </div>

              {/* QUICK ACTIONS list */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("parser");
                    setIsQuickActionsOpen(false);
                  }}
                  className="flex items-center justify-between w-full h-14 p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <Plus size={16} className="text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">Create New Order</div>
                      <div className="text-[9px] text-slate-500">නව ඇණවුමක් ඇතුළත් කරන්න (Order Parser)</div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-500" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("products");
                    setIsQuickActionsOpen(false);
                  }}
                  className="flex items-center justify-between w-full h-14 p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <Package size={16} className="text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">Add New Product SKU</div>
                      <div className="text-[9px] text-slate-500">නව භාණ්ඩයක් ගබඩාවට එක් කරන්න</div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-505" />
                </button>

                {/* Quick Order Lookup Form embedded inside actions */}
                <div
                  className="p-4 rounded-xl bg-slate-950/65 border border-slate-800"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Search size={14} className="text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-300">Quick Order Lookup (ඇණවුම් සෙවුම)</span>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!quickSearchTerm.trim()) return;
                      
                      const found = orders.find(
                        (o) =>
                          o.id.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
                          o.customer.phone1.includes(quickSearchTerm) ||
                          o.customer.name.toLowerCase().includes(quickSearchTerm.toLowerCase())
                      );

                      setIsQuickActionsOpen(false);
                      if (found) {
                        setSuccessToast(`Found Order: ${found.id} for ${found.customer.name} [${found.status}]`);
                        setActiveTab("ledger");
                      } else {
                        setSuccessToast(`No localized matching ledger order for "${quickSearchTerm}"`);
                      }
                      setTimeout(() => setSuccessToast(null), 3500);
                    }}
                    className="relative flex items-center"
                  >
                    <input
                      type="text"
                      value={quickSearchTerm}
                      onChange={(e) => setQuickSearchTerm(e.target.value)}
                      placeholder="Type Order ID, Name, or Phone..."
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs w-full text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/65 pr-8 font-mono"
                    />
                    {quickSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setQuickSearchTerm("")}
                        className="absolute right-3 text-xs text-slate-500 hover:text-white cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </form>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const pendingCount = orders.filter(
                      (o) => o.status === "Pending Check" || o.status === "Approved"
                    ).length;
                    
                    setIsQuickActionsOpen(false);
                    if (pendingCount > 0) {
                      setSuccessToast(`Generated Courier Manifest for ${pendingCount} pending shipments successfully!`);
                    } else {
                      setSuccessToast(`Generated general Courier shipping manifest sheets successfully!`);
                    }
                    setTimeout(() => setSuccessToast(null), 3000);
                  }}
                  className="flex items-center justify-between w-full h-14 p-4 rounded-xl bg-slate-950/40 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <Printer size={16} className="text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-200">Generate Courier Manifest</div>
                      <div className="text-[9px] text-slate-500">කුරියර් පත්‍රිකා මුද්‍රණය</div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-505" />
                </button>

                {/* Quick Switch Client shortcuts */}
                <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-800/60 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Client Portfolio (සේවාලාභියා)</div>
                  <div className="grid grid-cols-3 gap-2">
                    {tenantsList.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => {
                          setCurrentTenantId(t.id);
                          setIsQuickActionsOpen(false);
                          setSuccessToast(`Switched Client to: ${t.name}`);
                          setTimeout(() => setSuccessToast(null), 3000);
                        }}
                        className={`text-[9px] font-black uppercase rounded-lg py-1.5 px-1 truncate text-center border transition cursor-pointer ${
                          currentTenantId === t.id
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                            : "bg-slate-950/60 text-slate-400 border-slate-850 hover:text-white"
                        }`}
                      >
                        {t.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart AI & Financial Manual Calculator Modal */}
      <AnimatePresence>
        {isCalculatorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCalculatorOpen(false)}
              className="absolute inset-0 bg-slate-950 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full relative z-10 overflow-hidden flex flex-col h-[520px] md:h-[585px] text-white"
            >
              {/* Header Tab Switcher */}
              <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex bg-slate-900 p-1 rounded-xl select-none items-center gap-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCalcActiveTab("ai")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase ${
                      calcActiveTab === "ai"
                        ? "bg-slate-850 text-amber-400 border border-slate-800/85 shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>AI Parser Calc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcActiveTab("manual")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase ${
                      calcActiveTab === "manual"
                        ? "bg-slate-850 text-blue-400 border border-slate-800/85 shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Calculator size={13} />
                    <span>Manual Calc</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content Workspace */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {calcActiveTab === "manual" ? (
                  <div className="max-w-xs mx-auto space-y-4">
                    {/* Manual calculator screen */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-right space-y-1 font-mono">
                      <div className="text-slate-500 text-xs truncate min-h-[16px]">{calcInput || "0"}</div>
                      <div className="text-2xl font-extrabold text-white truncate min-h-[32px]">{calcResult || "0"}</div>
                    </div>

                    {/* Standard Keypad Grid */}
                    <div className="grid grid-cols-4 gap-2.5">
                      {["C", "(", ")", "/"].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (key === "C") {
                              setCalcInput("");
                              setCalcResult("");
                            } else {
                              setCalcInput((prev) => prev + key);
                            }
                          }}
                          className="h-12 rounded-xl font-extrabold text-sm border bg-slate-950 hover:bg-slate-900 transition-all cursor-pointer text-amber-500 border-slate-800"
                        >
                          {key}
                        </button>
                      ))}

                      {["7", "8", "9", "*"].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCalcInput((prev) => prev + key)}
                          className={`h-12 rounded-xl font-extrabold text-sm border transition-all cursor-pointer ${
                            key === "*"
                              ? "bg-slate-950 border-slate-800 text-amber-500 hover:bg-slate-900"
                              : "bg-slate-850 border-slate-800/65 text-slate-100 hover:bg-slate-850"
                          }`}
                        >
                          {key === "*" ? "×" : key}
                        </button>
                      ))}

                      {["4", "5", "6", "-"].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCalcInput((prev) => prev + key)}
                          className={`h-12 rounded-xl font-extrabold text-sm border transition-all cursor-pointer ${
                            key === "-"
                              ? "bg-slate-950 border-slate-800 text-amber-500 hover:bg-slate-900"
                              : "bg-slate-850 border-slate-800/65 text-slate-100 hover:bg-slate-850"
                          }`}
                        >
                          {key === "-" ? "−" : key}
                        </button>
                      ))}

                      {["1", "2", "3", "+"].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCalcInput((prev) => prev + key)}
                          className={`h-12 rounded-xl font-extrabold text-sm border transition-all cursor-pointer ${
                            key === "+"
                              ? "bg-slate-950 border-slate-800 text-amber-500 hover:bg-slate-900"
                              : "bg-slate-850 border-slate-800/65 text-slate-100 hover:bg-slate-850"
                          }`}
                        >
                          {key}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setCalcInput((prev) => prev + "0")}
                        className="h-12 rounded-xl font-extrabold text-sm border bg-slate-850 border-slate-800/65 text-slate-100 hover:bg-slate-850 cursor-pointer"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcInput((prev) => prev + ".")}
                        className="h-12 rounded-xl font-extrabold text-sm border bg-slate-850 border-slate-800/65 text-slate-100 hover:bg-slate-850 cursor-pointer"
                      >
                        .
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (calcInput.length > 0) {
                            setCalcInput((prev) => prev.slice(0, -1));
                          }
                        }}
                        className="h-12 rounded-xl font-bold text-xs border bg-slate-850 border-slate-800/65 text-slate-400 hover:bg-slate-850 cursor-pointer"
                      >
                        ⌫
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const rawResult = calcInput;
                          if (rawResult) {
                            try {
                              const sanitized = rawResult.replace(/[^0-9+\-*/().]/g, "");
                              if (sanitized) {
                                const evalRes = new Function(`return (${sanitized})`)();
                                if (evalRes !== undefined && evalRes !== null && !isNaN(evalRes)) {
                                  setCalcResult(Number(evalRes).toLocaleString(undefined, { maximumFractionDigits: 4 }));
                                } else {
                                  setCalcResult("Error");
                                }
                              }
                            } catch (err) {
                              setCalcResult("Error");
                            }
                          }
                        }}
                        className="h-12 rounded-xl font-extrabold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 cursor-pointer"
                      >
                        =
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Input Prompt Panel */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Describe your campaign scenario (English or Sinhala numbers)
                      </label>
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={aiCalcPrompt}
                          onChange={(e) => {
                            setAiCalcPrompt(e.target.value);
                            handleAiCalcParse(e.target.value);
                          }}
                          placeholder="e.g. 240 sales at 2500 LKR each, ad spend 20000 LKR, COGS cost 750, 10% RTO rate..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-medium resize-none placeholder:text-slate-650"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setAiCalcPrompt("");
                            setAiCalcResult(null);
                          }}
                          className="absolute bottom-3 right-3 text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Presets Row */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Try Campaign Presets:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            label: "🚀 Scale-Up (Healthy ROAS)",
                            prompt: "Scenario 1: 520 sales, LKR 3200 price each. RTO rate is 8%. Ad marketing spend LKR 35,000. Unit COGS 900."
                          },
                          {
                            label: "⚠️ Risk Alert (Low Margin)",
                            prompt: "Scenario 2: 120 sales, LKR 1400 price each. RTO rate is 24%. Ad marketing spend LKR 45,000. Sourcing unit cost LKR 600."
                          },
                          {
                            label: "🌟 High Ticket Winner",
                            prompt: "Scenario 3: 150 sales, LKR 5400 price each. RTO rate is 4.5%. Ad marketing spend LKR 30,000. Sourcing unit cost LKR 1400."
                          }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAiCalcPrompt(preset.prompt);
                              handleAiCalcParse(preset.prompt);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 text-[10px] font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all truncate max-w-[200px]"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* parsed dynamic output report */}
                    <AnimatePresence mode="wait">
                      {aiCalcResult ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="border border-slate-800 rounded-2xl p-4 bg-slate-950 space-y-4"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Parsed Audit Report</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold font-mono">Reactive Simulation</span>
                          </div>

                          {/* Top 3 metrics */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-2.5 bg-[#0d1220] border border-slate-800/80 rounded-xl">
                              <span className="text-[9px] text-slate-400 uppercase font-black font-mono">Sales Revenue</span>
                              <div className="text-xs font-mono font-bold mt-0.5 text-white">Rs. {aiCalcResult.revenue.toLocaleString()}</div>
                              <span className="text-[8px] text-slate-550 font-semibold block">{aiCalcResult.salesVolume} orders @ {aiCalcResult.price} LKR</span>
                            </div>

                            <div className="p-2.5 bg-[#0d1220] border border-slate-800/80 rounded-xl">
                              <span className="text-[9px] text-slate-400 uppercase font-black font-mono">Marketing ROAS</span>
                              <div className="text-xs font-mono font-bold mt-0.5 text-cyan-400">{aiCalcResult.roas.toFixed(2)}x</div>
                              <span className="text-[8px] text-slate-550 font-semibold block">LKR {aiCalcResult.adSpend.toLocaleString()} spend</span>
                            </div>

                            <div className="p-2.5 bg-[#0d1220] border border-slate-800/80 rounded-xl">
                              <span className="text-[9px] text-slate-400 uppercase font-black font-mono">RTO Loss</span>
                              <div className="text-xs font-mono font-bold mt-0.5 text-red-400">Rs. {aiCalcResult.rtoLoss.toLocaleString()}</div>
                              <span className="text-[8px] text-slate-550 font-semibold block">{aiCalcResult.rtoOrders} of {aiCalcResult.salesVolume} returned ({aiCalcResult.rtoRate}%)</span>
                            </div>
                          </div>

                          {/* Sourcing Cost & Margin */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2.5 bg-[#0d1220] border border-slate-800/80 rounded-xl">
                              <span className="text-[9px] text-slate-400 uppercase font-black font-mono">Product COGS Cost</span>
                              <div className="text-xs font-mono font-bold mt-0.5 text-slate-200">Rs. {aiCalcResult.productCost.toLocaleString()}</div>
                              <span className="text-[8px] text-slate-555 font-semibold block">{aiCalcResult.salesVolume} units @ {aiCalcResult.cogs} LKR</span>
                            </div>

                            <div className={`p-2.5 bg-[#0d1220] border rounded-xl ${
                              aiCalcResult.profit >= 0 ? "border-emerald-500/30" : "border-rose-500/30"
                            }`}>
                              <span className="text-[9px] text-slate-400 uppercase font-black font-mono">Projected Net margin</span>
                              <div className={`text-xs font-mono font-bold mt-0.5 ${
                                aiCalcResult.profit >= 0 ? "text-emerald-400" : "text-rose-400"
                              }`}>
                                Rs. {aiCalcResult.profit.toLocaleString()} ({aiCalcResult.margin.toFixed(1)}%)
                              </div>
                              <span className="text-[8px] text-slate-555 font-semibold block">Overall clean net campaign margin</span>
                            </div>
                          </div>

                          {/* Interactive text directive advices */}
                          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex gap-2.5 items-start">
                            <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-amber-400 block leading-none">LakNexus Simulation Advice Note:</span>
                              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                                {aiCalcResult.roas < 3.0 ? (
                                  `Your ROAS is low at ${aiCalcResult.roas.toFixed(2)}x. Marketing budget might drain capital. Optimize ad creatives or target Colombo, Kandy and Gampaha high-performing clusters.`
                                ) : aiCalcResult.margin < 10 ? (
                                  `Net margin is fragile (${aiCalcResult.margin.toFixed(1)}%). Consider bulk purchase optimization or reasonably raise unit price to safeguard cash flow.`
                                ) : aiCalcResult.rtoRate > 15 ? (
                                  `High RTO danger detected (${aiCalcResult.rtoRate}%). Prioritize phone confirmation verification before dispatch. This saves you Rs. ${aiCalcResult.rtoLoss.toLocaleString()} courier leakages.`
                                ) : (
                                  `Campaign parameters are highly optimal! Profit margin is ${aiCalcResult.margin.toFixed(1)}% yielding excellent workspace net of Rs. ${aiCalcResult.profit.toLocaleString()}. Consider scaling active spend.`
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="py-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
                          <span className="text-3xl text-slate-700 mb-2">📊</span>
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">No scenario evaluated yet</span>
                          <p className="text-[10px] text-slate-500 max-w-[320px] mt-1 font-semibold">Type context details above, or select any of our quick preset cases to see an immediate breakdown report!</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Close Button Footer */}
              <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Close Modal
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
