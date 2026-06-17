import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DollarSign, Percent, TrendingUp, BarChart2, Plus, Trash2, HelpCircle, Calculator, Lightbulb, CheckCircle2, AlertTriangle, Coins } from "lucide-react";
import { AdCampaignData, FinancialSummary } from "../types";

export default function FinancialPlanner() {
  // Sub-tabs for the Financial Planner
  const [subTab, setSubTab] = useState<"calculator" | "ledger">("calculator");

  // Advanced CFO Calculator inputs (preset with default healthy Sri Lankan metrics)
  const [cfoRevenue, setCfoRevenue] = useState<number>(35000);
  const [cfoProductCost, setCfoProductCost] = useState<number>(11000);
  const [cfoAdSpend, setCfoAdSpend] = useState<number>(4200);
  const [cfoCourierCost, setCfoCourierCost] = useState<number>(2450);
  const [cfoRtoOrders, setCfoRtoOrders] = useState<number>(12);
  const [cfoRtoLossPerOrder, setCfoRtoLossPerOrder] = useState<number>(380); // LKR 350-400 shipping loss per return

  // Multi-month marketing combo chart hovered state
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // Preset real-world Sri Lankan data so the merchant can test financial analysis tools from second one!
  const defaultCampaigns: AdCampaignData[] = [
    {
      date: "2026-06-01",
      salesCount: 45,
      revenue: 162000, // 45 * 3600
      adSpend: 23000,  // Facebook Ads
      productCost: 54000, // 45 * 1200
      otherExpenses: 18000 // Delivery fee + packaging
    },
    {
      date: "2026-06-02",
      salesCount: 38,
      revenue: 136800,
      adSpend: 22000,
      productCost: 45600,
      otherExpenses: 15200
    },
    {
      date: "2026-06-03",
      salesCount: 62,
      revenue: 223200,
      adSpend: 31000, // TikTok Ads Scaled
      productCost: 74400,
      otherExpenses: 24800
    },
    {
      date: "2026-06-04",
      salesCount: 29,
      revenue: 104400,
      adSpend: 19500,
      productCost: 34800,
      otherExpenses: 11600
    }
  ];

  const [campaigns, setCampaigns] = useState<AdCampaignData[]>(() => {
    const saved = localStorage.getItem("laknexus_campaigns");
    return saved ? JSON.parse(saved) : defaultCampaigns;
  });

  const [newCampaign, setNewCampaign] = useState({
    date: new Date().toISOString().split("T")[0],
    salesCount: 10,
    revenue: 35000,
    adSpend: 5000,
    productCost: 12000,
    otherExpenses: 4000,
  });

  useEffect(() => {
    localStorage.setItem("laknexus_campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalSpend: 0,
    totalProductCost: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    roas: 0,
    cac: 0,
  });

  // Calculate high precision statistics whenever rows modify
  useEffect(() => {
    let rev = 0;
    let spend = 0;
    let prod = 0;
    let other = 0;
    let count = 0;

    campaigns.forEach((c) => {
      rev += Number(c.revenue);
      spend += Number(c.adSpend);
      prod += Number(c.productCost);
      other += Number(c.otherExpenses);
      count += Number(c.salesCount);
    });

    const net = rev - spend - prod - other;
    const margin = rev > 0 ? (net / rev) * 100 : 0;
    const roas = spend > 0 ? rev / spend : 0;
    const cac = count > 0 ? spend / count : 0;

    setSummary({
      totalRevenue: rev,
      totalSpend: spend,
      totalProductCost: prod,
      totalExpenses: other,
      netProfit: net,
      profitMargin: margin,
      roas,
      cac,
    });
  }, [campaigns]);

  const handleAddCampaign = (e: FormEvent) => {
    e.preventDefault();
    const row: AdCampaignData = {
      date: newCampaign.date,
      salesCount: Number(newCampaign.salesCount),
      revenue: Number(newCampaign.revenue),
      adSpend: Number(newCampaign.adSpend),
      productCost: Number(newCampaign.productCost),
      otherExpenses: Number(newCampaign.otherExpenses),
    };
    setCampaigns([row, ...campaigns]);
    // reset partially
    setNewCampaign({
      ...newCampaign,
      date: new Date().toISOString().split("T")[0],
      salesCount: 10,
      revenue: 35000,
      adSpend: 5000,
      productCost: 12000,
      otherExpenses: 4000,
    });
  };

  const handleDelete = (index: number) => {
    const updated = campaigns.filter((_, i) => i !== index);
    setCampaigns(updated);
  };

  const handleClearAll = () => {
    setCampaigns([]);
    setCfoRevenue(0);
    setCfoProductCost(0);
    setCfoAdSpend(0);
    setCfoCourierCost(0);
    setCfoRtoOrders(0);
  };

  const handleLoadDefaults = () => {
    setCampaigns(defaultCampaigns);
  };

  // Preset CFO loader helper
  const loadCfoPreset = (type: "healthy" | "danger" | "excellent") => {
    if (type === "healthy") {
      setCfoRevenue(350000);
      setCfoProductCost(110000);
      setCfoAdSpend(42000);
      setCfoCourierCost(24500);
      setCfoRtoOrders(12);
      setCfoRtoLossPerOrder(380);
    } else if (type === "danger") {
      setCfoRevenue(150000);
      setCfoProductCost(65000);
      setCfoAdSpend(75000);
      setCfoCourierCost(14000);
      setCfoRtoOrders(35);
      setCfoRtoLossPerOrder(400);
    } else {
      setCfoRevenue(680000);
      setCfoProductCost(190000);
      setCfoAdSpend(55000);
      setCfoCourierCost(48000);
      setCfoRtoOrders(6);
      setCfoRtoLossPerOrder(360);
    }
  };

  // Computed CFO Metrics
  const rtoCourierLoss = cfoRtoOrders * cfoRtoLossPerOrder;
  const cfoNetProfit = cfoRevenue - cfoProductCost - cfoAdSpend - cfoCourierCost - rtoCourierLoss;
  const cfoRoas = cfoAdSpend > 0 ? cfoRevenue / cfoAdSpend : 0;
  const cfoNetProfitMargin = cfoRevenue > 0 ? (cfoNetProfit / cfoRevenue) * 100 : 0;

  // CFO Health Check Status Designation
  let healthStatus: "EXCELLENT" | "HEALTHY" | "DANGER" = "HEALTHY";
  if (cfoRevenue === 0 && cfoAdSpend === 0 && cfoProductCost === 0) {
    healthStatus = "HEALTHY";
  } else if (cfoRoas >= 5.0 || cfoNetProfitMargin >= 30) {
    if (cfoNetProfit > 0) {
      healthStatus = "EXCELLENT";
    } else {
      healthStatus = "DANGER";
    }
  } else if (cfoRoas < 3.0 || cfoNetProfit < 0 || cfoNetProfitMargin < 10) {
    healthStatus = "DANGER";
  } else {
    healthStatus = "HEALTHY";
  }

  // CFO Strategic Advice Generator in Sinhala & English
  interface AdviceItem {
    title: string;
    text: React.ReactNode;
    badge: string;
    color: string;
  }

  const getCfoAdvices = (): AdviceItem[] => {
    const arr: AdviceItem[] = [];

    // Note 1 (Scale-Up Ad Budget): The ROAS pill (e.g., 14.41x) must calculate and dynamically render as: Sales Revenue / Ad Spend
    const liveRoas = cfoAdSpend > 0 ? cfoRevenue / cfoAdSpend : 0;
    const roasPillText = liveRoas.toFixed(2) + "x";

    if (liveRoas < 3.0) {
      arr.push({
        title: "ROAS පිරිපහදු කිරීම (Refine Ad ROAS - Note 1)",
        text: (
          <>
            පිටු මිලදී ගැනීම් සඳහා වන ඔබගේ ROAS අගය <span className="text-blue-350 font-extrabold font-mono bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/20">{roasPillText}</span> කි (මුළු ආදායම රු. {cfoRevenue.toLocaleString()} / ad spend රු. {cfoAdSpend.toLocaleString()}). එය ශ්‍රී ලංකාවේ අවම ROAS සීමාව වන (3x) ට වඩා අඩු බැවින්, ad targeting පිරිපහදු කර, ad-cost (CAC) අඩු කරගැනීමට උත්සාහ කරන්න.
          </>
        ),
        badge: "AD OPTIMIZATION • " + roasPillText,
        color: "blue"
      });
    } else if (cfoAdSpend > 0 && (cfoAdSpend / cfoRevenue) > 0.25) {
      arr.push({
        title: "දැන්වීම් වියදම පාලනය (Control Ad Spend - Note 1)",
        text: (
          <>
            දැනට ඔබගේ ROAS අගය <span className="text-blue-350 font-extrabold font-mono bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/20">{roasPillText}</span> වන අතර මුළු ආදායමෙන් <span className="text-blue-350 font-extrabold font-mono bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/20">{Math.round((cfoAdSpend / cfoRevenue) * 100)}%</span>ක්ම Ad spend සඳහා වැයවේ. ad performance පරිමාණය (Scale-Up) කිරීම හෝ වෙනත් creative formats අත්හදා බලන්න.
          </>
        ),
        badge: "BUDGET CONTROL • " + roasPillText,
        color: "blue"
      });
    } else {
      arr.push({
        title: "ප්‍රචාරණ පරිමාණය වැඩි කිරීම (Scale-Up Ad Budget - Note 1)",
        text: (
          <>
            ඔබගේ ප්‍රචාරණ ආපසු ලැබීම (ROAS) <span className="text-blue-350 font-extrabold font-mono bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-500/20">{roasPillText}</span> මට්ටමක පවතී. සාර්ථක ad creatives වල ਬਜට් එක පරිමාණය (Scale up) කිරීමට පියවර ගන්න.
          </>
        ),
        badge: "SCALE UP • " + roasPillText,
        color: "blue"
      });
    }

    // Note 2 (Minimize RTO Loss): The Returned Orders pill (e.g., 150) must sync directly with the "Returned / RTO Orders" input field value.
    // The total currency loss pill (e.g., රු. 67,500) must calculate and display dynamically as: Returned / RTO Orders * Shipping Loss per Return Slider Value.
    const liveRtoLoss = cfoRtoOrders * cfoRtoLossPerOrder;
    const rtoLossPillText = "රු. " + liveRtoLoss.toLocaleString();
    
    arr.push({
      title: "RTO කුරියර් අලාභය අවම කිරීම (Minimize RTO Loss - Note 2)",
      text: (
        <>
          Returned (RTO) ඇණවුම් ප්‍රමාණය <span className="text-emerald-300 font-extrabold font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">{cfoRtoOrders}</span> නිසා සිදු වූ කුරියර් අලාභය <span className="text-emerald-300 font-extrabold font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">{rtoLossPillText}</span> කි (Slider Loss value: රු. {cfoRtoLossPerOrder}). ඇණවුම යැවීමට පෙර පාරිභෝගිකයාගේ සම්බන්ධතා අංකය නිවැරදි දැයි පරීක්ෂා කර, දුරකථනයෙන් ඩබල්-කන්ෆර්ම් ලබාගන්න.
        </>
      ),
      badge: "RTO LOSS • " + rtoLossPillText,
      color: "emerald"
    });

    // Note 3 (Boost Gross Margin): The Net Profit Margin pill (e.g., -123.5%) must compute and display dynamically using the live formula: (Net Profit / Sales Revenue) * 100
    const liveNetProfit = cfoRevenue - cfoProductCost - cfoAdSpend - cfoCourierCost - liveRtoLoss;
    const liveNetProfitMargin = cfoRevenue > 0 ? (liveNetProfit / cfoRevenue) * 100 : 0;
    const marginPillText = liveNetProfitMargin.toFixed(1) + "%";

    if (liveNetProfitMargin < 12) {
      arr.push({
        title: "භාණ්ඩ ලාභාංශය ඉහළ නැංවීම (Boost Gross Margin - Note 3)",
        text: (
          <>
            ශුද්ධ ලාභය <span className="text-fuchsia-300 font-extrabold font-mono bg-fuchsia-950/40 px-1.5 py-0.5 rounded border border-fuchsia-500/20">රු. {liveNetProfit.toLocaleString()}</span> සහ ශුද්ධ ලාභාංශය (<span className="text-fuchsia-300 font-extrabold font-mono bg-fuchsia-950/40 px-1.5 py-0.5 rounded border border-fuchsia-500/20">{marginPillText}</span>) අඩු මට්ටමක පවතී. Unit Cost එක අඩු කරගැනීමට උත්සාහ කරන්න, නැතහොත් භාණ්ඩයේ විකුණුම් මිල සාධාරණ ලෙස ඉහළ දමන්න.
          </>
        ),
        badge: "PRICING POWER • " + marginPillText,
        color: "fuchsia"
      });
    } else {
      arr.push({
        title: "භාණ්ඩ ලාභාංශය ඉහළ නැංවීම (Boost Gross Margin - Note 3)",
        text: (
          <>
            ශුද්ධ ලාභය <span className="text-fuchsia-300 font-extrabold font-mono bg-fuchsia-950/40 px-1.5 py-0.5 rounded border border-fuchsia-500/20">රු. {liveNetProfit.toLocaleString()}</span> සහ ශුද්ධ ලාභාංශය (<span className="text-fuchsia-300 font-extrabold font-mono bg-fuchsia-950/40 px-1.5 py-0.5 rounded border border-fuchsia-500/20">{marginPillText}</span>) ඉතා සාර්ථකයි. මෙම ලාභයෙන් කොටසක් නැවත වැඩියෙන්ම විකිණෙන භාණ්ඩවල තොග රැස් කිරීමට සහ Cash-flow ස්ථායීව තබාගැනීමට ලංකාවේ බැංකු ගිණුමක වෙන් කර තබන්න.
          </>
        ),
        badge: "CAPITAL ALLOCATION • " + marginPillText,
        color: "fuchsia"
      });
    }

    return arr;
  };

  const advices = getCfoAdvices();

  return (
    <div id="financial-insights-section" className="space-y-6">
      
      {/* Interactive Subtab Switcher */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full sm:w-fit border border-slate-200 select-none items-center gap-1">
        <button
          type="button"
          onClick={() => setSubTab("calculator")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all uppercase ${
            subTab === "calculator"
              ? "bg-white text-blue-600 shadow-sm border border-slate-200/40"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
          }`}
        >
          <Calculator size={14} />
          <span>CFO Financial Calculator (මූල්‍ය විශ්ලේෂක)</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("ledger")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-tight transition-all uppercase ${
            subTab === "ledger"
              ? "bg-white text-blue-600 shadow-sm border border-slate-200/40"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
          }`}
        >
          <BarChart2 size={14} />
          <span>Daily Campaign Logs (ප්‍රචාරණ ලේඛනය)</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === "calculator" ? (
          <motion.div
            key="cfo_calculator_active"

            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start"
          >
            {/* Left Column Stack (Inputs + Chart) */}
            <div className="flex flex-col space-y-6 w-full">
              {/* CFO Financial Inputs Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 h-fit w-full">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Coins className="text-blue-600" size={18} />
                    CFO Financial Inputs (මූල්‍ය දත්ත ඇතුලත් කරන්න)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Provide overall performance statistics to generate CFO strategic business health check.
                  </p>
                </div>

                {/* Preset Shortcuts */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Benchmarks & Presets / ඉක්මන් ආකෘති:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => loadCfoPreset("excellent")}
                      className="p-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 rounded border border-emerald-200 transition-all text-center"
                    >
                      High Profit Scale 🚀
                    </button>
                    <button
                      type="button"
                      onClick={() => loadCfoPreset("healthy")}
                      className="p-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100/80 rounded border border-blue-200 transition-all text-center"
                    >
                      Stable Business 👍
                    </button>
                    <button
                      type="button"
                      onClick={() => loadCfoPreset("danger")}
                      className="p-1.5 text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100/80 rounded border border-rose-200 transition-all text-center"
                    >
                      High Ad Spend Warning ⚠️
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Sales Revenue */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 flex justify-between">
                      <span>Sales Revenue (මුළු ආදායම)</span>
                      <span className="text-blue-600 font-extrabold font-mono">LKR</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cfoRevenue || ""}
                      onChange={(e) => setCfoRevenue(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* COGS */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        Product Cost / COGS (භාණ්ඩවල පිරිවැය)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cfoProductCost || ""}
                        onChange={(e) => setCfoProductCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono font-bold"
                      />
                    </div>

                    {/* Ad Spend */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        Ad Spend (දැන්වීම් වියදම)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cfoAdSpend || ""}
                        onChange={(e) => setCfoAdSpend(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono font-bold text-pink-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Courier Cost */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        Courier Cost (කුරියර් ගාස්තු)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cfoCourierCost || ""}
                        onChange={(e) => setCfoCourierCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono font-bold"
                      />
                    </div>

                    {/* Returned RTO Orders */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block text-amber-600">
                        Returned / RTO Orders
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={cfoRtoOrders || ""}
                        onChange={(e) => setCfoRtoOrders(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono font-bold text-amber-600"
                      />
                    </div>
                  </div>

                  {/* Shipping Loss per RTO Slider */}
                  <div className="space-y-1.5 p-3.5 bg-[#000103] border border-slate-100 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Shipping Loss per Return</span>
                      <span className="font-extrabold text-blue-600 font-mono text-[11px]">LKR {cfoRtoLossPerOrder}</span>
                    </div>
                    <input
                      type="range"
                      min="350"
                      max="450"
                      step="5"
                      value={cfoRtoLossPerOrder}
                      onChange={(e) => setCfoRtoLossPerOrder(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Industry benchmark: Sri Lankan shipping logistics companies charge an outbound return processing fee of LKR 350-400 for failed cash-on-delivery.
                    </span>
                  </div>
                </div>
              </div>

              {/* Ad-Spend vs ROI Combo Analytics Chart Card */}
              <div className="w-full" id="ad-spend-roi-chart">
                <div className="bg-[#0b0f19]/80 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between h-full bg-gradient-to-b from-[#0e1424]/90 to-[#070a13]/90 backdrop-blur-md shadow-xl w-full">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide">Ad-Spend vs ROI Combo Analytics</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Monthly marketing expense vs generated return on investment (LKR)</p>
                      </div>
                      {/* Legend */}
                      <div className="flex items-center gap-3 text-[10px] text-slate-300 font-bold font-mono">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 bg-slate-700 rounded-sm"></div>
                          <span>Ad Spend</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                          <span>ROI Return</span>
                        </div>
                      </div>
                    </div>

                    {/* Graphical Plotting Board with subtle grid lines using clean responsive SVG elements */}
                    <div className="w-full mt-4 flex items-center justify-center relative">
                      <svg viewBox="0 0 500 250" width="100%" height="auto" className="overflow-visible select-none max-h-60 w-full">
                        {/* Horizontal Background Grids */}
                        <line x1="45" y1="40" x2="480" y2="40" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="45" y1="80" x2="480" y2="80" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="45" y1="120" x2="480" y2="120" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="45" y1="160" x2="480" y2="160" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="45" y1="200" x2="480" y2="200" stroke="#334155" strokeWidth="1" />

                        {/* Y-axis labels with LKR format */}
                        <text x="35" y="44" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="end">LKR 300K</text>
                        <text x="35" y="84" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="end">LKR 225K</text>
                        <text x="35" y="124" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="end">LKR 150K</text>
                        <text x="35" y="164" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="end">LKR 75K</text>
                        <text x="35" y="204" fill="#94a3b8" fontSize="9" fontFamily="monospace" textAnchor="end">0</text>

                        {/* SVG Bars loop */}
                        {[
                          { month: "JAN", spend: 35000, roi: 120000, x: 80 },
                          { month: "FEB", spend: 45000, roi: 180000, x: 165 },
                          { month: "MAR", spend: 55000, roi: 240000, x: 250 },
                          { month: "APR", spend: 40000, roi: 160000, x: 335 },
                          { month: "MAY", spend: 60000, roi: 280000, x: 420 }
                        ].map((d, idx) => {
                          const maxVal = 300000;
                          const hRange = 160; // y-axis height range (from y=200 down to y=40)
                          const spendHeight = (d.spend / maxVal) * hRange;
                          const roiHeight = (d.roi / maxVal) * hRange;

                          const spendY = 200 - spendHeight;
                          const roiY = 200 - roiHeight;

                          const isHovered = hoveredMonthIdx === idx;

                          return (
                            <g 
                              key={d.month} 
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredMonthIdx(idx)}
                              onMouseLeave={() => setHoveredMonthIdx(null)}
                            >
                              {/* Invisible wide background interact rect for ease of hovering */}
                              <rect 
                                x={d.x - 30} 
                                y="20" 
                                width="60" 
                                height="200" 
                                fill="transparent" 
                              />

                              {/* Bar 1: Ad Spend (Gray/Slate) */}
                              <circle cx={d.x - 8} cy={spendY} r="4" fill={isHovered ? "#64748b" : "#475569"} className="hidden" />
                              <rect 
                                x={d.x - 14} 
                                y={spendY} 
                                width="12" 
                                height={spendHeight} 
                                rx="2"
                                fill={isHovered ? "#64748b" : "#334155"} 
                                className="transition-all duration-300"
                              />

                              {/* Bar 2: ROI Return (Amber/Gold) */}
                              <rect 
                                x={d.x + 2} 
                                y={roiY} 
                                width="12" 
                                height={roiHeight} 
                                rx="2"
                                fill={isHovered ? "#fbbf24" : "#f59e0b"} 
                                className="transition-all duration-300"
                              />

                              {/* X text label */}
                              <text 
                                x={d.x} 
                                y="220" 
                                fill={isHovered ? "#f59e0b" : "#64748b"} 
                                fontSize="10" 
                                fontWeight="bold" 
                                fontFamily="monospace" 
                                textAnchor="middle" 
                                className="transition-all duration-300"
                              >
                                {d.month}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Interactive Tooltip Hover Overlay */}
                      <AnimatePresence>
                        {hoveredMonthIdx !== null && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 5 }}
                            className="absolute left-1/2 -top-12 -translate-x-1/2 bg-[#0d1220]/95 border border-slate-700 px-3.5 py-1.5 rounded-xl shadow-2xl z-20 flex flex-col gap-0.5 text-center pointer-events-none min-w-[200px] backdrop-blur-md"
                          >
                            <span className="text-[10px] uppercase font-extrabold text-amber-500 font-mono tracking-wider">
                              {[
                                { month: "JAN" },
                                { month: "FEB" },
                                { month: "MAR" },
                                { month: "APR" },
                                { month: "MAY" }
                              ][hoveredMonthIdx].month} Analytics
                            </span>
                            <div className="flex justify-between text-[11px] font-mono mt-1 text-slate-300 gap-4">
                              <span className="text-slate-400 font-sans">Spend:</span>
                              <span className="font-bold text-slate-200">LKR {[35000, 45000, 55000, 40000, 60000][hoveredMonthIdx].toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-mono text-slate-300 gap-4">
                              <span className="text-slate-400 font-sans">ROI Return:</span>
                              <span className="font-bold text-amber-400">LKR {[120000, 180000, 240000, 160000, 280000][hoveredMonthIdx].toLocaleString()}</span>
                            </div>
                            <div className="border-t border-slate-800/80 my-1"></div>
                            <div className="flex justify-between text-[10px] font-mono text-slate-400 gap-4">
                              <span className="text-slate-450 font-sans">ROAS:</span>
                              <span className="font-extrabold text-blue-400">
                                {([120000, 180000, 240000, 160000, 280000][hoveredMonthIdx] / [35000, 45000, 55000, 40000, 60000][hoveredMonthIdx]).toFixed(2)}x
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-slate-500 border-t border-slate-800/25 pt-2 flex justify-between items-center mt-4">
                    <span>Interactive Live Data Vector</span>
                    <span className="text-amber-500/80 font-bold uppercase tracking-wider">LakNexus Grounding</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column Stack (Statement Cards + Audit Notes) */}
            <div className="flex flex-col space-y-6 w-full">
              {/* Health Check Status Banner */}
              <div 
                className={`p-5 rounded-2xl border flex items-start gap-4 transition-all duration-300 bg-[#0d1220]/70 backdrop-blur-sm w-full ${
                  healthStatus === "EXCELLENT" 
                    ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                    : healthStatus === "HEALTHY"
                    ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                    : "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                }`}
              >
                <div className={`p-3.5 rounded-xl shrink-0 border bg-slate-950/60 ${
                  healthStatus === "EXCELLENT" 
                    ? "border-emerald-500/30" 
                    : healthStatus === "HEALTHY"
                    ? "border-blue-500/30"
                    : "border-red-500/30"
                }`}>
                  {healthStatus === "EXCELLENT" && <CheckCircle2 className="text-emerald-400" size={24} />}
                  {healthStatus === "HEALTHY" && <TrendingUp className="text-blue-400" size={24} />}
                  {healthStatus === "DANGER" && <AlertTriangle className="text-red-400" size={24} />}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-300 block uppercase tracking-wide">
                    CFO Health Check Status / ව්‍යාපාරයේ සෞඛ්‍ය තත්ත්වය
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-extrabold tracking-tight ${
                      healthStatus === "EXCELLENT" 
                        ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                        : healthStatus === "HEALTHY"
                        ? "text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        : "text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                    }`}>
                      {healthStatus === "EXCELLENT" && "EXCELLENT (සුපිරි)"}
                      {healthStatus === "HEALTHY" && "HEALTHY (හොඳයි)"}
                      {healthStatus === "DANGER" && "DANGER (අවදානම්)"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {healthStatus === "EXCELLENT" && "Your business indicators show brilliant ad performance and stellar unit economics. Ideal state to pump ad-budget aggressively to gain market share."}
                    {healthStatus === "HEALTHY" && "Your store is sustainably making profits. Maintain consistency but optimize product shipping confirmations to enhance capital safety."}
                    {healthStatus === "DANGER" && "Action needed: ROAS is critically low (< 3.0x) or high RTO losses have completely wiped out net gains. Redefine advertising keywords or call customers before shipping!"}
                  </p>
                </div>
              </div>

              {/* CFO Audit Statement / මූල්‍ය අවසාන විග්‍රහය */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-5 w-full">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  CFO Audit Statement / මූල්‍ය අවසාන විග්‍රහය
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Total Revenue */}
                  <div className="p-4 rounded-xl border border-blue-500/80 bg-[#080d1a] shadow-md flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300 cursor-pointer">
                    <span className="text-[10px] font-semibold font-mono tracking-wider text-slate-400 uppercase block">Total Revenue / මුළු ආදායම</span>
                    <span className="text-lg md:text-xl font-mono font-extrabold text-blue-400 mt-1 whitespace-nowrap truncate">LKR {cfoRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-normal block border-t border-slate-800/60 pt-1 mt-2">Gross earnings generated before any cost subtractions</span>
                  </div>

                  {/* COGS */}
                  <div className="p-4 rounded-xl border border-amber-500/80 bg-[#080d1a] shadow-md flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all duration-300 cursor-pointer">
                    <span className="text-[10px] font-semibold font-mono tracking-wider text-slate-400 uppercase block">Cost of Goods / COGS</span>
                    <span className="text-lg md:text-xl font-mono font-extrabold text-amber-400 mt-1 whitespace-nowrap truncate">LKR {cfoProductCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-normal block border-t border-slate-800/60 pt-1 mt-2">Sourcing expenditure on physical product stocks</span>
                  </div>

                  {/* Total Marketing */}
                  <div className="p-4 rounded-xl border border-pink-500/80 bg-[#080d1a] shadow-md flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(236,72,153,0.15)] transition-all duration-300 cursor-pointer">
                    <span className="text-[10px] font-semibold font-mono tracking-wider text-slate-400 uppercase block">Marketing Spend / දැන්වීම්</span>
                    <span className="text-lg md:text-xl font-mono font-extrabold text-pink-400 mt-1 whitespace-nowrap truncate">LKR {cfoAdSpend.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-normal block border-t border-slate-800/60 pt-1 mt-2">Paid Facebook/TikTok ads campaign cost allocation</span>
                  </div>

                  {/* Return Loss */}
                  <div className="p-4 rounded-xl border border-red-500/80 bg-[#080d1a] shadow-md flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-300 cursor-pointer">
                    <span className="text-[10px] font-semibold font-mono tracking-wider text-slate-400 uppercase block">RTO Loss / කුරියර් පාඩුව</span>
                    <span className="text-lg md:text-xl font-mono font-extrabold text-red-400 mt-1 whitespace-nowrap truncate">LKR {rtoCourierLoss.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-normal block border-t border-slate-800/60 pt-1 mt-2">
                      {cfoRtoOrders} returns @ LKR {(cfoCourierCost > 0 && cfoCourierCost < 1500 ? cfoCourierCost : (cfoRtoLossPerOrder || 380)).toLocaleString()} average
                    </span>
                  </div>

                  {/* Net Profit */}
                  <div className={`p-4 rounded-xl border shadow-md flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] cursor-pointer ${
                    cfoNetProfit >= 0 
                      ? "border-emerald-500/80 bg-[#080d1a] hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                      : "border-red-500/80 bg-[#080d1a] hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                  }`}>
                    <span className="text-[10px] font-semibold font-mono tracking-wider text-slate-400 uppercase block">Net Profit / ශුද්ධ ලාභය</span>
                    <span className={`text-lg md:text-xl font-mono font-extrabold mt-1 whitespace-nowrap truncate ${cfoNetProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      LKR {cfoNetProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium leading-normal block border-t border-slate-800/60 pt-1 mt-2">{cfoNetProfitMargin.toFixed(2)}% Net Margin efficiency rating</span>
                  </div>

                  {/* ROAS GAUGE */}
                  <div className="p-4 rounded-xl border border-cyan-500/80 bg-[#080d1a] shadow-md flex flex-col justify-between hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 cursor-pointer">
                    <span className="text-[10px] font-semibold font-mono tracking-wider text-slate-400 uppercase block">Returns On Ad Spend / ROAS</span>
                    <span className="text-lg md:text-xl font-mono font-extrabold text-cyan-400 mt-1 whitespace-nowrap truncate">{cfoRoas.toFixed(2)}x</span>
                    <span className="text-[9px] text-slate-400 font-medium leading-normal block border-t border-slate-800/60 pt-1 mt-2">Target threshold is above 3.00x critical bar</span>
                  </div>
                </div>
              </div>

              {/* CFO Strategic Business Audit Notes / උපදේශන සටහන */}
              <div className="w-full" id="cfo-audit-notes">
                <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] space-y-4 flex flex-col justify-between h-full w-full">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 pb-1.5 border-b border-blue-500/10">
                      <div className="p-1 rounded-md bg-blue-950/40 border border-blue-500/30">
                        <Lightbulb className="text-blue-400" size={16} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          CFO Strategic Business Audit Notes / උපදේශන සටහන
                        </h4>
                        <span className="text-[10px] text-slate-300 block font-semibold leading-relaxed mt-0.5 animate-pulse">
                          Custom, reactive insights derived by LakNexus financial audit logic (CFO උපදෙස් කාඩ්පත)
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3.5 mt-3.5 w-full">
                      {advices.map((adv, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`p-3.5 rounded-xl bg-[#0d1220]/75 backdrop-blur-sm flex items-start gap-3 w-full ${
                            idx === 0 
                              ? "border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-white" 
                              : idx === 1
                              ? "border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white"
                              : "border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)] text-white"
                          }`}
                        >
                          <div className={`size-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 font-mono ${
                            idx === 0 
                              ? "bg-blue-950/50 text-blue-300 border border-blue-500/40" 
                              : idx === 1
                              ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/40"
                              : "bg-fuchsia-950/50 text-fuchsia-300 border border-fuchsia-500/40"
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 justify-between">
                              <span className={`text-xs font-bold leading-none ${
                                idx === 0 
                                  ? "text-blue-400" 
                                  : idx === 1
                                  ? "text-emerald-400"
                                  : "text-fuchsia-400"
                              }`}>{adv.title}</span>
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 uppercase tracking-wider rounded border ${
                                idx === 0 
                                  ? "bg-blue-950/50 text-blue-300 border border-blue-500/45" 
                                  : idx === 1
                                  ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/45"
                                  : "bg-fuchsia-950/50 text-fuchsia-300 border border-fuchsia-500/45"
                              }`}>
                                {adv.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-semibold mt-1">
                              {adv.text}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cfo_ledger_active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Financial KPIs Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Dynamic Profit Margin Gauge */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white shadow-md relative overflow-hidden animate-fade-in">
                <p className="text-xs text-blue-200 font-semibold tracking-wider uppercase">
                  Net Profit Margin
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h4 className="text-3xl font-extrabold tracking-tight">
                    {summary.profitMargin.toFixed(1)}%
                  </h4>
                  <span className="text-xs text-blue-100 font-medium">
                    LKR {summary.netProfit.toLocaleString("en-US")} profit
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-500/30 flex justify-between text-xs text-blue-200">
                  <span>ROI Health:</span>
                  <span className="font-bold">
                    {summary.profitMargin > 30 ? "🔥 Excellent" : summary.profitMargin > 15 ? "👍 Balanced" : "⚠️ High CAC Risk"}
                  </span>
                </div>
                <div className="absolute top-4 right-4 text-blue-300 opacity-20">
                  <Percent size={40} />
                </div>
              </div>

              {/* Dynamic total ad spend */}
              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative">
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                  Total Marketing Ad Spend
                </p>
                <h4 className="text-2xl font-bold text-slate-800 mt-2">
                  Rs. {summary.totalSpend.toLocaleString("en-US")}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Facebook & TikTok campaigns budget
                </p>
                <div className="absolute top-4 right-4 text-pink-500 opacity-10">
                  <TrendingUp size={40} />
                </div>
              </div>

              {/* Dynamic ROAS */}
              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative">
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                  Return on Ad Spend (ROAS)
                </p>
                <h4 className="text-2xl font-bold text-blue-600 mt-2">
                  {summary.roas.toFixed(2)}x
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Every 1 LKR spent yields {summary.roas.toFixed(1)} LKR
                </p>
                <div className="absolute top-4 right-4 text-blue-500 opacity-10">
                  <DollarSign size={40} />
                </div>
              </div>

              {/* Dynamic CAC */}
              <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative">
                <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                  Customer Acquisition Cost (CAC)
                </p>
                <h4 className="text-2xl font-bold text-amber-600 mt-2">
                  Rs. {summary.cac.toFixed(0)}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Average ad-spend per active order
                </p>
                <div className="absolute top-4 right-4 text-amber-500 opacity-10">
                  <BarChart2 size={40} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Ad Campaign Input Portal */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Add Daily Marketing & COGS Logs
                </h4>

                <form onSubmit={handleAddCampaign} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Campaign / Recording Date
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                      value={newCampaign.date}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Sales Count (Orders)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        value={newCampaign.salesCount}
                        onChange={(e) =>
                          setNewCampaign({
                            ...newCampaign,
                            salesCount: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Total Revenue (LKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        value={newCampaign.revenue}
                        onChange={(e) =>
                          setNewCampaign({
                            ...newCampaign,
                            revenue: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Ad Spend (LKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="w-full text-xs px-2 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        value={newCampaign.adSpend}
                        onChange={(e) =>
                          setNewCampaign({
                            ...newCampaign,
                            adSpend: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Product Cost (COGS)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="w-full text-xs px-2 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        value={newCampaign.productCost}
                        onChange={(e) =>
                          setNewCampaign({
                            ...newCampaign,
                            productCost: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Overheads (LKR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        className="w-full text-xs px-2 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                        value={newCampaign.otherExpenses}
                        onChange={(e) =>
                          setNewCampaign({
                            ...newCampaign,
                            otherExpenses: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-500 flex items-start gap-2">
                    <HelpCircle className="text-blue-500 shrink-0 mt-0.5" size={14} />
                    <div>
                      <span className="font-semibold text-slate-700">Net Profit formula:</span>
                      <br />
                      Revenue (LKR) - [Ad Spend + COGS + Overheads]
                    </div>
                  </div>

                  <button
                    id="insert-financial-row-btn"
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-sm shadow-sm transition-all"
                  >
                    <Plus size={16} /> Save Daily Record
                  </button>
                </form>
              </div>

              {/* Campaign Lists and Dynamic breakdown */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-800">
                        Ad Campaign & Sales Performance Ledger
                      </h4>
                      <p className="text-xs text-slate-400">
                        Track dynamic net profit margin based on advertising acquisition costs
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id="load-defaults-financial-btn"
                        onClick={handleLoadDefaults}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-all"
                      >
                        Load Real Presets
                      </button>
                      <button
                        id="clear-financials-btn"
                        onClick={handleClearAll}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 rounded-lg transition-all"
                      >
                        Clear Logs
                      </button>
                    </div>
                  </div>

                  {campaigns.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                      <Trash2 size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No campaigns or sales logs entered</p>
                      <p className="text-xs text-slate-400 mt-1">Please insert daily records using the panel on the left.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold select-none bg-slate-50/50">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Orders</th>
                            <th className="py-2.5 px-3">Revenue (LKR)</th>
                            <th className="py-2.5 px-3">Ad Spend</th>
                            <th className="py-2.5 px-3">COGS</th>
                            <th className="py-2.5 px-3">Net Profit</th>
                            <th className="py-2.5 px-3 text-right">Margin %</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence>
                            {campaigns.map((c, idx) => {
                              const totalCost = Number(c.adSpend) + Number(c.productCost) + Number(c.otherExpenses);
                              const profit = Number(c.revenue) - totalCost;
                              const margin = c.revenue > 0 ? (profit / c.revenue) * 100 : 0;

                              return (
                                <motion.tr
                                  id={`campaign-row-${idx}`}
                                  key={idx + c.date}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-b last:border-0 border-slate-100 hover:bg-slate-50/50"
                                >
                                  <td className="py-3 px-3 font-medium text-slate-700">{c.date}</td>
                                  <td className="py-3 px-3 text-slate-600 font-semibold">{c.salesCount}</td>
                                  <td className="py-3 px-3 text-slate-800">Rs. {Number(c.revenue).toLocaleString()}</td>
                                  <td className="py-3 px-3 text-pink-500 font-medium">Rs. {Number(c.adSpend).toLocaleString()}</td>
                                  <td className="py-3 px-3 text-amber-700">Rs. {Number(c.productCost).toLocaleString()}</td>
                                  <td className={`py-3 px-3 font-bold ${profit >=0 ? "text-emerald-600" : "text-rose-600"}`}>
                                    Rs. {profit.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        margin >= 30
                                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                          : margin >= 15
                                          ? "bg-blue-50 text-blue-650 border border-blue-100"
                                          : "bg-rose-50 text-rose-600 border border-rose-100"
                                      }`}
                                    >
                                      {margin.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <button
                                      onClick={() => handleDelete(idx)}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-all rounded"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Graphical Margin Visualizer Widget */}
                {campaigns.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">
                      Profit Margin Pulse Chart
                    </span>
                    <div className="flex items-end gap-1.5 h-16 w-full pt-2 bg-slate-50 rounded-xl px-4 relative">
                      {campaigns.slice(0, 10).reverse().map((c, i) => {
                        const totalCost = Number(c.adSpend) + Number(c.productCost) + Number(c.otherExpenses);
                        const profit = Number(c.revenue) - totalCost;
                        const margin = c.revenue > 0 ? (profit / c.revenue) * 100 : 0;
                        const fillHeight = Math.max(10, Math.min(100, Math.round(margin)));
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                            <div className="w-full bg-slate-200 h-10 rounded-t-sm flex items-end overflow-hidden">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${fillHeight}%` }}
                                className={`w-full ${margin >= 30 ? "bg-blue-600" : "bg-blue-400"}`}
                              />
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 select-none">{c.date.substring(5)}</span>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-12 bg-slate-800 text-white text-[10px] p-2 rounded shadow-md hidden group-hover:block z-10 w-28 text-center bg-opacity-95 pointer-events-none line-clamp-3">
                              <p className="font-bold">{c.date}</p>
                              <p className="text-amber-350">Margin: {margin.toFixed(1)}%</p>
                              <p>LKR {profit.toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div className="absolute top-2 right-4 text-[9px] text-slate-400 font-mono">
                        Showing last {Math.min(campaigns.length, 10)} records
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
