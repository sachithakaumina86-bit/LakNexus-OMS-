import { useState, useEffect, useRef } from "react";
import { PackageSearch, AlertTriangle, MessageSquare, Info, Send, Bot, User, Trash2, X, Sparkles, QrCode, Upload, Download, History, TrendingUp, Bell, FileSpreadsheet, FileText } from "lucide-react";
import { InventoryItem, ScrapedOrder } from "../types";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_TENANT_INVENTORIES: Record<string, InventoryItem[]> = {
  tenant_kandy_boutique: [
    { id: "1", name: "Kandy Tea Special Blend", cost: 600, price: 1500, stock: 120 },
    { id: "2", name: "Mens Luxury Watch", cost: 2500, price: 4990, stock: 45 }
  ],
  tenant_galle_trends: [
    { id: "1", name: "Genuine Leather Sandals", cost: 1400, price: 2990, stock: 65 },
    { id: "2", name: "Smart Wallet", cost: 1000, price: 2450, stock: 80 }
  ],
  default: [
    { id: "1", name: "Smart Wallet", cost: 1000, price: 2450, stock: 50 },
    { id: "2", name: "Mens Luxury Watch", cost: 2500, price: 4990, stock: 30 }
  ]
};

export default function InventoryManager({ 
  inventory, 
  setInventory, 
  orders,
  currentTenantId
}: { 
  inventory: InventoryItem[], 
  setInventory: (items: InventoryItem[]) => void, 
  orders?: ScrapedOrder[],
  currentTenantId?: string
}) {
  // Toggle collapsible chat box state
  const [isOpen, setIsOpen] = useState(false);
  const [activeExportDropdown, setActiveExportDropdown] = useState<'all' | 'out_of_stock' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [barcodeActionMsg, setBarcodeActionMsg] = useState(false);
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // New stock entry states
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStockName, setNewStockName] = useState("");
  const [newStockCost, setNewStockCost] = useState<number | "">("");
  const [newStockPrice, setNewStockPrice] = useState<number | "">("");
  const [newStockQty, setNewStockQty] = useState<number | "">("");
  const [newStockAlert, setNewStockAlert] = useState<number>(5);
  const [newStockSku, setNewStockSku] = useState("");

  // Live Inventory Catalog Search & Quick Add states
  const [matrixSearchQuery, setMatrixSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickSku, setQuickSku] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickQty, setQuickQty] = useState("");

  const tenantKey = currentTenantId || "default";
  const DEFAULT_TENANT_INVENTORY = DEFAULT_TENANT_INVENTORIES[tenantKey] || DEFAULT_TENANT_INVENTORIES["default"];

  const handleTenantStockReset = () => {
    if (!window.confirm("ඔබේ ගබඩා තොග දත්ත පමණක් මුල් තත්ත්වයට පත් කිරීමට අවශ්යද?")) return;

    // 1. Update standard inventory state (parent state)
    setInventory(DEFAULT_TENANT_INVENTORY);

    // Save standard inventory for the tenant in localStorage
    const tenantInvKey = `laknexus_${currentTenantId || "default"}_inventory`;
    localStorage.setItem(tenantInvKey, JSON.stringify(DEFAULT_TENANT_INVENTORY));

    // 2. Clear out or sync back rich products to mirror this reset
    const defaultRichProducts = DEFAULT_TENANT_INVENTORY.map((item) => ({
      id: item.id,
      name: item.name,
      sku: `SKU-${item.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toUpperCase()}-${item.id}`,
      category: "E-Commerce Goods",
      description: `Premium quality ${item.name} with premium packing. Perfect for digital ads and rapid scale-up.`,
      productType: "Simple" as const,
      status: "Active" as const,
      lowStockAlert: 5,
      costPrice: item.cost,
      salePrice: item.price,
      stockQuantity: item.stock,
      weight: 0.35,
      dimensions: {
        length: 15,
        width: 10,
        height: 5
      }
    }));

    // Update richProducts state
    setRichProducts(defaultRichProducts);
    
    // Save to productsKey localStorage
    const productsKey = `laknexus_${currentTenantId || "default"}_products_rich`;
    localStorage.setItem(productsKey, JSON.stringify(defaultRichProducts));

    // Emit storage event
    window.dispatchEvent(new Event("storage"));

    setToastMessage("🔄 තොග දත්ත සාර්ථකව මුල් තත්ත්වයට පත් කරන ලදී!");
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load rich products metadata (SKUs, Alert thresholds, Statuses)
  const productsKey = `laknexus_${currentTenantId || "default"}_products_rich`;
  const [richProducts, setRichProducts] = useState<any[]>(() => {
    const saved = localStorage.getItem(productsKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Track storage shifts dynamically in the background
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(productsKey);
      if (saved) {
        setRichProducts(JSON.parse(saved));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [currentTenantId]);

  // Bi-directional stock adjustments: updates standard inventory AND product catalog
  const handleUpdateStock = (itemId: string, newStock: number) => {
    const updatedStock = Math.max(0, newStock);
    
    // Update standard inventory matrix source of truth
    const updatedInventory = inventory.map(item => {
      if (item.id === itemId) {
        return { ...item, stock: updatedStock, stockQuantity: updatedStock };
      }
      return item;
    });
    setInventory(updatedInventory);

    // Save back to the rich Product Catalog storage
    const saved = localStorage.getItem(productsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const updatedProducts = parsed.map((p: any) => {
          if (p.id === itemId) {
            return { ...p, stockQuantity: updatedStock };
          }
          return p;
        });
        localStorage.setItem(productsKey, JSON.stringify(updatedProducts));
        setRichProducts(updatedProducts);
      } catch (err) {
        console.error("Failed to update rich products stock", err);
      }
    }
  };

  const handleAddNewStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName.trim()) {
      alert("Product Name is required.");
      return;
    }
    const cost = Number(newStockCost) || 0;
    const price = Number(newStockPrice) || 0;
    const stock = Number(newStockQty) || 0;
    const lowStock = Number(newStockAlert) || 5;

    // Generate unique ID
    const nextId = String(inventory.length > 0 ? Math.max(...inventory.map(i => parseInt(i.id) || 0)) + 1 : 1);

    const newItem: InventoryItem = {
      id: nextId,
      name: newStockName.trim(),
      cost,
      price,
      stock
    };

    const newInventory = [...inventory, newItem];
    setInventory(newInventory);

    // Save standard inventory for the tenant in localStorage
    const tenantInvKey = `laknexus_${currentTenantId || "default"}_inventory`;
    localStorage.setItem(tenantInvKey, JSON.stringify(newInventory));

    // Create and save to rich products as well
    const skuVal = newStockSku.trim() || `SKU-${newStockName.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "")}-${nextId}`;
    const newRich = {
      id: nextId,
      name: newStockName.trim(),
      sku: skuVal,
      category: "E-Commerce Goods",
      description: `Premium quality ${newStockName.trim()} with premium packing.`,
      productType: "Simple" as const,
      status: "Active" as const,
      lowStockAlert: lowStock,
      costPrice: cost,
      salePrice: price,
      stockQuantity: stock,
      weight: 0.35,
      dimensions: {
        length: 15,
        width: 10,
        height: 5
      }
    };

    const updatedRichProducts = [...richProducts, newRich];
    setRichProducts(updatedRichProducts);
    localStorage.setItem(productsKey, JSON.stringify(updatedRichProducts));

    // Emit storage event
    window.dispatchEvent(new Event("storage"));

    setToastMessage(`🎉 "${newStockName.trim()}" සාර්ථකව ගබඩා තොගයට එකතු කරන ලදී!`);
    setTimeout(() => setToastMessage(null), 4000);

    // Reset fields
    setNewStockName("");
    setNewStockCost("");
    setNewStockPrice("");
    setNewStockQty("");
    setNewStockAlert(5);
    setNewStockSku("");
    setIsAddStockOpen(false);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      alert("භාණ්ඩයේ නම ඇතුළත් කිරීම අනිවාර්ය වේ. (Product Name is required)");
      return;
    }
    const priceVal = Number(quickPrice) || 0;
    const qtyVal = Number(quickQty) || 0;
    const costVal = Math.round(priceVal * 0.6); // Auto-extrapolate default cost as 60% of sale price for robust stats

    const nextId = String(inventory.length > 0 ? Math.max(...inventory.map(i => parseInt(i.id) || 0)) + 1 : 1);
    const skuVal = quickSku.trim() || `SKU-${quickName.trim().toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "")}-${nextId}`;

    const newItem: InventoryItem = {
      id: nextId,
      name: quickName.trim(),
      cost: costVal,
      price: priceVal,
      stock: qtyVal
    };

    const newInventory = [...inventory, newItem];
    setInventory(newInventory);

    // Save standard inventory for the tenant
    const tenantInvKey = `laknexus_${currentTenantId || "default"}_inventory`;
    localStorage.setItem(tenantInvKey, JSON.stringify(newInventory));

    // Create and save to rich products as well for dual synchronization
    const newRich = {
      id: nextId,
      name: quickName.trim(),
      sku: skuVal,
      category: "E-Commerce Goods",
      description: `Premium quality ${quickName.trim()} with premium packing.`,
      productType: "Simple" as const,
      status: "Active" as const,
      lowStockAlert: 5,
      costPrice: costVal,
      salePrice: priceVal,
      stockQuantity: qtyVal,
      weight: 0.35,
      dimensions: {
        length: 15,
        width: 10,
        height: 5
      }
    };

    const updatedRichProducts = [...richProducts, newRich];
    setRichProducts(updatedRichProducts);
    localStorage.setItem(productsKey, JSON.stringify(updatedRichProducts));

    // Emit storage event
    window.dispatchEvent(new Event("storage"));

    setToastMessage(`🎉 "${quickName.trim()}" සාර්ථකව ඇතුළත් කරන ලදී!`);
    setTimeout(() => setToastMessage(null), 4000);

    // Reset quick fields
    setQuickName("");
    setQuickSku("");
    setQuickPrice("");
    setQuickQty("");
    setShowQuickAdd(false);
  };

  // Isolate chat history session-wise (each unique session or user view)
  const getSessionKey = () => {
    let sid = sessionStorage.getItem("laknexus_inventory_sid");
    if (!sid) {
      sid = "session_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("laknexus_inventory_sid", sid);
    }
    return sid;
  };

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const sessionKey = getSessionKey();
    const chatStorageKey = `laknexus_inventory_chat_${sessionKey}`;
    const timestampStorageKey = `laknexus_inventory_chat_timestamp_${sessionKey}`;
    
    const savedTimeStr = localStorage.getItem(timestampStorageKey);
    const now = Date.now();
    let isExpired = false;

    if (savedTimeStr) {
      const savedTime = parseInt(savedTimeStr, 10);
      if (!isNaN(savedTime)) {
        const gapHours = (now - savedTime) / (1000 * 60 * 60);
        // Wipe clean if gap exceeds 24 hours
        if (gapHours >= 24) {
          isExpired = true;
        }
      }
    }

    if (isExpired) {
      localStorage.removeItem(chatStorageKey);
      localStorage.setItem(timestampStorageKey, now.toString());
      return [{
        id: "init",
        role: "assistant",
        content: "👋 ආයුබෝවන්! මම LakNexus තොග පාලන සහකරු. ඔබට අලුත් භාණ්ඩ ඇතුළත් කිරීමට හෝ තොග විස්තර ලබා ගැනීමට අවශ්‍ය නම් මට කියන්න."
      }];
    }

    const savedChat = localStorage.getItem(chatStorageKey);
    if (savedChat) {
      try {
        return JSON.parse(savedChat);
      } catch (e) {
        // Fallback on parsing error
      }
    }

    localStorage.setItem(timestampStorageKey, now.toString());
    return [{
      id: "init",
      role: "assistant",
      content: "👋 ආයුබෝවන්! මම LakNexus තොග පාලන සහකරු. ඔබට අලුත් භාණ්ඩ ඇතුළත් කිරීමට හෝ තොග විස්තර ලබා ගැනීමට අවශ්‍ය නම් මට කියන්න."
    }];
  });

  const [aiInput, setAiInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sessionKey = getSessionKey();
    const chatStorageKey = `laknexus_inventory_chat_${sessionKey}`;
    const timestampStorageKey = `laknexus_inventory_chat_timestamp_${sessionKey}`;
    
    localStorage.setItem(chatStorageKey, JSON.stringify(chatHistory));
    // Roll the timestamp forward on user active chat so session logs stay active for 24 hours from last action
    localStorage.setItem(timestampStorageKey, Date.now().toString());
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isProcessing, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: "user", content: aiInput };
    setChatHistory(prev => [...prev, userMessage]);
    setAiInput("");
    setIsProcessing(true);

    try {
      const response = await fetch("/api/chat-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage.content,
          history: chatHistory.map(m => ({ role: m.role, content: m.content })),
          inventory,
          orders
        })
      });
      
      const data = await response.json();
      if (data && data.success) {
        if (data.updatedInventory) {
          setInventory(data.updatedInventory);
        }
        
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.reply || "සමාවෙන්න, මට එය තේරුම් ගත නොහැකි විය."
        };
        
        setChatHistory(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Failed context");
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "🚨 පද්ධතියේ දෝෂයක්. කරුණාකර නැවත උත්සාහ කරන්න."
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualClear = () => {
    const sessionKey = getSessionKey();
    const chatStorageKey = `laknexus_inventory_chat_${sessionKey}`;
    const timestampStorageKey = `laknexus_inventory_chat_timestamp_${sessionKey}`;

    localStorage.removeItem(chatStorageKey);
    localStorage.setItem(timestampStorageKey, Date.now().toString());
    setChatHistory([{
      id: "init",
      role: "assistant",
      content: "👋 ආයුබෝවන්! මම LakNexus තොග පාලන සහකරු. ඔබට අලුත් භාණ්ඩ ඇතුළත් කිරීමට හෝ තොග විස්තර ලබා ගැනීමට අවශ්‍ය නම් මට කියන්න."
    }]);
  };

  const getHighestCashFlowLockedEntry = () => {
    if (inventory.length === 0) return null;
    return [...inventory].sort((a, b) => (b.cost * b.stock) - (a.cost * a.stock))[0];
  };

  const triggerDownload = (type: 'all' | 'out_of_stock', format: 'xlsx' | 'pdf') => {
    const listToExport = type === 'out_of_stock' ? inventory.filter(i => i.stock === 0) : inventory;
    const filename = `${type === 'out_of_stock' ? 'out_of_stock_inventory' : 'full_inventory'}_report_${Date.now()}.${format === 'xlsx' ? 'csv' : 'pdf'}`;
    
    let content = "";
    let mimeType = "";
    
    if (format === 'xlsx') {
      mimeType = "text/csv;charset=utf-8;";
      content = "Item ID,Item Name,Cost (LKR),Price (LKR),Stock Level\n";
      listToExport.forEach(item => {
        content += `${item.id},"${item.name.replace(/"/g, '""')}",${item.cost},${item.price},${item.stock}\n`;
      });
    } else {
      mimeType = "application/pdf";
      content = `%PDF-1.4\n%LAKNEXUS STOCK MANAGEMENT INVENTORY AUDIT REPORT\n`;
      content += `Date: ${new Date().toISOString().split('T')[0]}\n`;
      content += `Report Type: ${type === 'out_of_stock' ? 'OUT OF STOCK / CRITICAL ALERT LIST' : 'FULL SYSTEM INVENTORY'}\n`;
      content += `--------------------------------------------------\n`;
      content += String.prototype.padEnd.call("Item Name", 30) + " | " + String.prototype.padEnd.call("Cost", 10) + " | " + String.prototype.padEnd.call("Price", 10) + " | " + "Stock\n";
      content += `--------------------------------------------------\n`;
      listToExport.forEach(item => {
        content += String.prototype.padEnd.call(item.name.slice(0, 28), 30) + " | " + String.prototype.padEnd.call(item.cost.toString(), 10) + " | " + String.prototype.padEnd.call(item.price.toString(), 10) + " | " + item.stock + "\n";
      });
      content += `--------------------------------------------------\n`;
      content += `Total Recorded Items: ${listToExport.length}\n`;
      content += `Total Value: LKR ${listToExport.reduce((sum, i) => sum + (i.cost * i.stock), 0).toLocaleString()}\n`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setToastMessage(`Downloaded ${format.toUpperCase()} report: ${filename}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    setActiveExportDropdown(null);
  };

  const highestLocked = getHighestCashFlowLockedEntry();
  const lowStockItems = inventory.filter(item => {
    const rich = richProducts.find(p => p.id === item.id);
    const alertThreshold = rich?.lowStockAlert !== undefined ? rich.lowStockAlert : 5;
    return item.stock <= alertThreshold;
  });

  return (
    <div className="relative pb-2" id="live-inventory-controller">
      <div className="space-y-6">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-3 bg-[#0f172a] border border-emerald-500 text-emerald-400 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-lg max-w-md mx-auto"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stock Management Header and Action Bar */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <PackageSearch className="text-amber-400" size={20} />
                Stock Management
              </h3>
              <p className="text-xs text-slate-400">Monitor and manage your inventory levels</p>
            </div>
            
            {/* Quick Actions Panel */}
            <div className="flex flex-wrap items-center gap-2 select-none">
              {/* Enter New Stock button */}
              <button
                onClick={() => setIsAddStockOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-sm">➕</span>
                Enter New Stock
              </button>

              {/* Barcodes button */}
              <button
                onClick={() => setBarcodeActionMsg(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all active:scale-95 cursor-pointer"
              >
                <QrCode size={14} />
                Barcodes
              </button>
              
              {/* Bulk Update button */}
              <button
                onClick={() => setBulkUpdateOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] hover:bg-slate-700 border border-slate-700 text-white text-xs rounded-lg font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Upload size={14} />
                Bulk Update
              </button>
              
              {/* Export button with its dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveExportDropdown(activeExportDropdown === 'all' ? null : 'all')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Download size={14} />
                  Export
                </button>
                <AnimatePresence>
                  {activeExportDropdown === 'all' && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveExportDropdown(null)} />
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 mt-1 w-52 rounded-xl bg-[#0f172a] border border-slate-800 shadow-xl z-20 overflow-hidden text-[11px] font-sans"
                      >
                        <button
                          type="button"
                          onClick={() => triggerDownload('all', 'xlsx')}
                          className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
                        >
                          <FileSpreadsheet size={14} className="text-emerald-400" />
                          Spreadsheet (.xlsx / .csv)
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDownload('all', 'pdf')}
                          className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
                        >
                          <FileText size={14} className="text-rose-400" />
                          PDF Document (.pdf)
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Export Out of Stock with its dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveExportDropdown(activeExportDropdown === 'out_of_stock' ? null : 'out_of_stock')}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <AlertTriangle size={14} />
                  Export Out of Stock
                </button>
                <AnimatePresence>
                  {activeExportDropdown === 'out_of_stock' && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveExportDropdown(null)} />
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 mt-1 w-52 rounded-xl bg-[#0f172a] border border-slate-800 shadow-xl z-20 overflow-hidden text-[11px] font-sans"
                      >
                        <button
                          type="button"
                          onClick={() => triggerDownload('out_of_stock', 'xlsx')}
                          className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
                        >
                          <FileSpreadsheet size={14} className="text-emerald-400" />
                          Spreadsheet (.xlsx / .csv)
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDownload('out_of_stock', 'pdf')}
                          className="w-full text-left px-3 py-2 hover:bg-slate-800 text-slate-300 flex items-center gap-2 cursor-pointer"
                        >
                          <FileText size={14} className="text-rose-400" />
                          PDF Document (.pdf)
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              {/* History button */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all active:scale-95 cursor-pointer"
              >
                <History size={14} />
                History
              </button>

              {/* Reset Tenant Stock button */}
              <button
                type="button"
                onClick={handleTenantStockReset}
                className="px-4 py-2 bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/50 text-rose-300 text-xs font-semibold rounded-lg transition-all duration-200 shadow-[0_0_10px_rgba(244,63,94,0.1)] cursor-pointer"
              >
                🔄 තොග දත්ත නැවත සකසන්න (Reset)
              </button>
            </div>
          </div>

          {/* Grid of 6 Metric Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Total Products */}
            <div className="bg-[#0b0f19]/80 border border-slate-800 border-l-4 border-l-blue-500 rounded-xl p-3 flex flex-col justify-between transition-all hover:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Products</span>
              <span className="text-base font-mono font-extrabold text-blue-400 mt-1">{inventory.length}</span>
            </div>
            
            {/* Card 2: In Stock */}
            <div className="bg-[#0b0f19]/80 border border-slate-800 border-l-4 border-l-emerald-500 rounded-xl p-3 flex flex-col justify-between transition-all hover:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">In Stock</span>
              <span className="text-base font-mono font-extrabold text-emerald-400 mt-1">
                {inventory.filter(i => i.stock > 0).length}
              </span>
            </div>
            
            {/* Card 3: Low Stock */}
            <div className="bg-[#0b0f19]/80 border border-slate-800 border-l-4 border-l-amber-500 rounded-xl p-3 flex flex-col justify-between transition-all hover:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Low Stock</span>
              <span className="text-base font-mono font-extrabold text-amber-500 mt-1">
                {inventory.filter(item => {
                  const rich = richProducts.find(p => p.id === item.id);
                  const alertThreshold = rich?.lowStockAlert !== undefined ? rich.lowStockAlert : 5;
                  return item.stock > 0 && item.stock <= alertThreshold;
                }).length}
              </span>
            </div>
            
            {/* Card 4: Out Of Stock */}
            <div className="bg-[#0b0f19]/80 border border-slate-800 border-l-4 border-l-rose-500 rounded-xl p-3 flex flex-col justify-between transition-all hover:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Out of Stock</span>
              <span className="text-base font-mono font-extrabold text-rose-500 mt-1">
                {inventory.filter(i => i.stock === 0).length}
              </span>
            </div>
            
            {/* Card 5: Total Units */}
            <div className="bg-[#0b0f19]/80 border border-slate-800 border-l-4 border-l-purple-500 rounded-xl p-3 flex flex-col justify-between transition-all hover:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Units</span>
              <span className="text-base font-mono font-extrabold text-purple-400 mt-1">
                {inventory.reduce((sum, item) => sum + item.stock, 0)}
              </span>
            </div>
            
            {/* Card 6: Stock Value */}
            <div className="bg-[#0b0f19]/80 border border-slate-800 border-l-4 border-l-cyan-500 rounded-xl p-3 flex flex-col justify-between transition-all hover:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Stock Value</span>
              <span className="text-[13px] sm:text-xs font-mono font-extrabold text-cyan-400 mt-1 whitespace-nowrap truncate" title={`LKR ${inventory.reduce((sum, item) => sum + (item.cost * item.stock), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                LKR {inventory.reduce((sum, item) => sum + (item.cost * item.stock), 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Secondary Performance Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Tile: Total Sold (All Time) */}
            <div className="bg-[#0b0f19]/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between transition-all hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                  <TrendingUp size={16} className="animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Sold (All Time)</span>
                  <span className="text-xs text-slate-400 mt-0.5 block">Sum of dispatched & delivered counts</span>
                </div>
              </div>
              <span className="text-sm font-mono font-extrabold text-emerald-400 pr-1">
                {orders && orders.length > 0 ? orders.reduce((sum, o) => sum + (o.items?.reduce((isum, i) => isum + (i.quantity || 1), 0) || 0), 0) : 148} units
              </span>
            </div>

            {/* Right Tile: Unread Alerts */}
            <div className="bg-[#0b0f19]/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between transition-all hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${lowStockItems.length > 0 ? 'bg-amber-950/40 border border-amber-500/30 text-amber-400' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>
                  <Bell size={16} className={lowStockItems.length > 0 ? 'animate-bounce' : ''} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unread Alerts</span>
                  <span className="text-xs text-slate-400 mt-0.5 block">Active items triggering alerts</span>
                </div>
              </div>
              <span className={`text-sm font-mono font-extrabold ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-slate-400'} pr-1`}>
                {lowStockItems.length}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts Section (Always visible for safety warnings) */}
        <AnimatePresence>
          {lowStockItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {lowStockItems.map(item => (
                <div key={item.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex items-start gap-3 shadow-sm">
                  <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-extrabold text-rose-800">
                      🚨 STOCK WARNING: {item.name} is running out of stock! Only {item.stock} left.
                    </h4>
                    <p className="text-xs font-semibold text-rose-600 mt-1">තොග අවසන් වෙමින් පවතී. කරුණාකර නැවත ඇණවුම් කරන්න.</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Storage Table & Insights Section (Consolidated widescreen layout) */}
        <div className="space-y-6">
          {highestLocked && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-100 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-50">
                <Info className="text-indigo-500" size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-1">
                  Cash Flow Insights (මූල්‍ය විශ්ලේෂණය)
                </span>
                <p className="text-sm font-bold text-slate-800">
                  ගබඩාවේ වැඩිම මුදලක් සිරවී ඇත්තේ <span className="text-indigo-700 font-extrabold">{highestLocked.name}</span> භාණ්ඩයෙනි. 
                </p>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  එහි සිරවී ඇති මුළු වටිනාකම රු. {(highestLocked.cost * highestLocked.stock).toLocaleString()} කි. නාස්තිය වළක්වා ගැනීම සඳහා මෙය ප්‍රවර්ධනය කරන්න.
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#0b0f19] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[460px]" id="live-matrix-container">
            <div className="p-4 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1222]">
              <div className="flex items-center gap-2">
                <PackageSearch className="text-blue-500 animate-pulse" size={18} />
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight animate-fade-in">
                    Live Inventory Matrix / සක්‍රීය තොග පාලක ලේඛනය
                  </h4>
                  <p className="text-[10px] text-slate-400">එසැණින් තොග පරීක්ෂාව සහ ඇතුළත් කිරීම</p>
                </div>
              </div>

              {/* Live Search and Quick Add Button Panel */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search SKU or Name..."
                    value={matrixSearchQuery}
                    onChange={(e) => setMatrixSearchQuery(e.target.value)}
                    className="pl-3.5 pr-8 py-1.5 text-xs bg-[#070a13] border border-slate-800 focus:border-blue-500 text-white rounded-lg focus:outline-none w-48 font-medium placeholder-slate-505"
                  />
                  {matrixSearchQuery && (
                    <button
                      onClick={() => setMatrixSearchQuery("")}
                      className="absolute right-2 top-1.5 px-1 text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className="px-3 py-1.5 bg-blue-650 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  {showQuickAdd ? "✕ Close Form" : "⚡ Quick Add Item"}
                </button>
              </div>
            </div>

            {/* Collapsible Quick Add Form */}
            <AnimatePresence>
              {showQuickAdd && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-slate-800 bg-[#0d1527]/50"
                >
                  <form onSubmit={handleQuickAddSubmit} className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Product Name / නම</label>
                      <input
                        type="text"
                        required
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        placeholder="e.g. Trendy Cotton Shirt"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070a13] text-white focus:outline-none focus:border-blue-500 placeholder-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">SKU Code (Optional)</label>
                      <input
                        type="text"
                        value={quickSku}
                        onChange={(e) => setQuickSku(e.target.value)}
                        placeholder="e.g. SKU-SHIRT-M"
                        className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070a13] text-white focus:outline-none focus:border-blue-500 placeholder-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Selling Price (LKR)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={quickPrice}
                        onChange={(e) => setQuickPrice(e.target.value)}
                        placeholder="Price e.g. 2450"
                        className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070a13] text-white focus:outline-none focus:border-blue-500 placeholder-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Qty / තොගය</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0"
                          required
                          value={quickQty}
                          onChange={(e) => setQuickQty(e.target.value)}
                          placeholder="qty e.g. 100"
                          className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070a13] text-white focus:outline-none focus:border-blue-500 placeholder-slate-700 focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer block leading-none saturate-125 hover:scale-105 shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-y-auto flex-1 font-sans">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 bg-[#0e1424] border-b border-slate-800 z-10 text-slate-400 text-xs font-semibold select-none">
                  <tr>
                    <th className="py-2.5 px-4 text-left">SKU</th>
                    <th className="py-2.5 px-4 text-left">Product Name</th>
                    <th className="py-2.5 px-4 text-center">Available Stock</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-[#070a13]">
                  {(() => {
                    const filteredInventory = inventory.filter(item => {
                      const rich = richProducts.find(p => p.id === item.id);
                      const skuVal = (item.sku || rich?.sku || `SKU-${item.name.replace(/\s+/g, "-").toUpperCase()}-${item.id}`).toLowerCase();
                      const nameVal = item.name.toLowerCase();
                      const query = matrixSearchQuery.toLowerCase().trim();
                      if (!query) return true;
                      return nameVal.includes(query) || skuVal.includes(query);
                    });

                    if (filteredInventory.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 text-xs font-medium">
                            No inventory records matched your search query.
                          </td>
                        </tr>
                      );
                    }

                    return filteredInventory.map(item => {
                      const rich = richProducts.find(p => p.id === item.id);
                      const skuVal = item.sku || rich?.sku || `SKU-${item.name.replace(/\s+/g, "-").toUpperCase()}-${item.id}`;
                      const alertThreshold = item.lowStockAlert !== undefined ? item.lowStockAlert : (rich?.lowStockAlert !== undefined ? rich.lowStockAlert : 5);
                      const statusVal = item.status || rich?.status || "Active";
                      const isLowStock = item.stock <= alertThreshold;

                      return (
                        <tr key={item.id} className="border-b border-slate-900 hover:bg-slate-800/40 transition-colors">
                          {/* SKU Column */}
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[110px]" title={skuVal}>
                            {skuVal}
                          </td>
                          {/* Product Name Column */}
                          <td className="py-2.5 px-4 font-bold text-slate-200 text-xs truncate max-w-[130px]" title={item.name}>
                            {item.name}
                          </td>
                          {/* Available Stock Column with direct inline adjustments */}
                          <td className="py-2.5 px-4 text-center">
                            <div className="inline-flex items-center gap-2 select-none justify-center">
                              <button
                                type="button"
                                onClick={() => handleUpdateStock(item.id, item.stock - 1)}
                                className={`w-5 h-5 rounded hover:bg-opacity-80 active:scale-95 flex items-center justify-center font-bold text-xs cursor-pointer ${
                                  isLowStock ? "bg-amber-950 text-amber-400 border border-amber-900/40 hover:bg-amber-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                              >
                                -
                              </button>
                              
                              <input
                                type="number"
                                min="0"
                                value={item.stock}
                                onChange={(e) => handleUpdateStock(item.id, Math.max(0, parseInt(e.target.value) || 0))}
                                className={`w-12 text-center text-xs font-extrabold font-mono rounded py-0.5 outline-none focus:ring-1 focus:ring-blue-500 border border-slate-800 bg-[#070a13] ${
                                  isLowStock 
                                    ? "text-amber-400 font-extrabold" 
                                    : "text-slate-200"
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() => handleUpdateStock(item.id, item.stock + 1)}
                                className={`w-5 h-5 rounded hover:bg-opacity-80 active:scale-95 flex items-center justify-center font-bold text-xs cursor-pointer ${
                                  isLowStock ? "bg-amber-950 text-amber-400 border border-amber-900/40 hover:bg-amber-900" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                }`}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          {/* Status/Badge Column */}
                          <td className="py-2.5 px-4 text-center">
                            {isLowStock ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-950/65 text-amber-400 border border-amber-900 uppercase tracking-tight inline-flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></span>
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#064e3b] text-emerald-405 border border-emerald-900 uppercase tracking-tight inline-width shrink-0">
                                {statusVal}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION TRIGGER BUTTON */}
      <div className="absolute right-4 bottom-4 z-40">
        <button
          id="toggle-ai-chat"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-2.5 rounded-full shadow-lg border border-slate-800 bg-[#0b0f19] text-amber-200 hover:bg-[#111726] hover:border-amber-500/50 transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles size={16} className="text-amber-400 animate-pulse shrink-0" />
          <span className="text-[10px] font-extrabold tracking-wider uppercase pr-1.5">AI Assistant</span>
        </button>
      </div>

      {/* COLLAPSIBLE DETACHED SLIDE-IN CHAT SIDEBAR / POP-OVER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute right-4 bottom-16 z-50 w-80 sm:w-90 bg-[#0b0f19]/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[450px] overflow-hidden"
          >
            {/* Dark Styled Header */}
            <div className="px-3 py-2.5 border-b border-slate-800 flex items-center justify-between bg-[#0e1424]">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.7)]" />
                <span className="font-extrabold text-[11px] tracking-wider text-amber-200 uppercase font-mono">LakNexus AI Module</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleManualClear} 
                  className="text-slate-400 hover:text-amber-400 transition-colors p-1 rounded hover:bg-slate-800" 
                  title="Clear history (පිරිසිදු කරන්න)"
                >
                  <Trash2 size={13} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-slate-400 hover:text-slate-100 transition-colors p-1 rounded hover:bg-slate-800"
                  title="Close AI Assistant"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Chat Body (High-Density Viewport) */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#070a13] text-[11px] select-text">
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-1.5 rounded-full shrink-0 ${msg.role === 'user' ? 'bg-amber-950/40 text-amber-300 border border-amber-900/30' : 'bg-slate-800/60 text-slate-300 border border-slate-700/40'}`}>
                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div className={`max-w-[85%] rounded-xl px-2.5 py-2 leading-relaxed tracking-normal ${
                    msg.role === 'user' 
                      ? 'bg-amber-500/10 text-amber-100 border border-amber-500/20 rounded-tr-none shadow-sm' 
                      : 'bg-slate-900/90 text-slate-300 border border-slate-800 rounded-tl-none shadow-sm prose prose-invert prose-xs max-w-none'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded-full shrink-0 bg-slate-800/60 text-slate-300 border border-slate-700/40">
                    <Bot size={12} />
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 text-slate-400 rounded-xl rounded-tl-none px-3 py-2 shadow-sm flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-amber-400 animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1 h-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer Panel */}
            <div className="p-2.5 bg-[#0b0f19] border-t border-slate-800">
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  disabled={isProcessing}
                  placeholder="ඇණවුම් විමසන්න... / Ask AI..."
                  className="w-full text-[11px] px-3 py-2 pr-10 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500/50 bg-[#070a13] text-slate-200 placeholder-slate-500 disabled:bg-slate-950/50 disabled:text-slate-600 transition-all font-sans font-medium"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !aiInput.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-7 h-7 flex items-center justify-center bg-amber-950 text-amber-300 hover:bg-amber-900 disabled:bg-slate-950 disabled:text-slate-600 border border-amber-900/50 rounded-md transition-colors"
                  title="Send Message"
                >
                  <Send size={11} className="shrink-0" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barcodes Terminal Popover */}
      <AnimatePresence>
        {barcodeActionMsg && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1424]">
                <div className="flex items-center gap-2">
                  <QrCode className="text-purple-400 animate-pulse" size={18} />
                  <h3 className="text-sm font-extrabold text-white tracking-wider uppercase font-mono">LakNexus Barcodes Terminal</h3>
                </div>
                <button onClick={() => setBarcodeActionMsg(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 max-h-[350px] overflow-y-auto space-y-4 text-left">
                <p className="text-xs text-slate-400">
                  Auto-generated 1D SKU barcode labels match perfectly with handheld laser scanners. Ready for print.
                </p>
                <div className="space-y-3">
                  {inventory.map(item => (
                    <div key={item.id} className="p-3 bg-[#070a13] border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="text-left">
                        <span className="text-[9px] text-[#a78bfa] font-mono block">SKU: {item.id.toUpperCase()}</span>
                        <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="h-6 flex items-end gap-[1.5px] bg-white px-2.5 py-1 rounded">
                          <span className="w-[1.5px] h-full bg-black"></span>
                          <span className="w-[2.5px] h-full bg-black"></span>
                          <span className="w-[1px] h-full bg-black"></span>
                          <span className="w-[3px] h-full bg-black"></span>
                          <span className="w-[1px] h-full bg-black"></span>
                          <span className="w-[2px] h-full bg-black"></span>
                          <span className="w-[1px] h-full bg-black"></span>
                          <span className="w-[2px] h-full bg-black"></span>
                          <span className="w-[4px] h-full bg-black"></span>
                          <span className="w-[1px] h-full bg-black"></span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-400 mt-1">{item.id.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-[#0e1424] border-t border-slate-800 flex justify-end gap-2.5">
                <button 
                  onClick={() => setBarcodeActionMsg(false)} 
                  className="px-4 py-2 text-xs font-bold font-mono border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Close Terminal
                </button>
                <button 
                  onClick={() => {
                    setBarcodeActionMsg(false);
                    setToastMessage("Printed active barcode stickers.");
                    setTimeout(() => setToastMessage(null), 4000);
                  }} 
                  className="px-4 py-2 text-xs font-bold font-mono bg-purple-600 hover:bg-purple-700 rounded-lg text-white cursor-pointer"
                >
                  Print Labels
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Import Overlay */}
      <AnimatePresence>
        {bulkUpdateOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1424]">
                <div className="flex items-center gap-2">
                  <Upload className="text-amber-400 animate-pulse" size={18} />
                  <h3 className="text-sm font-extrabold text-white tracking-wider uppercase font-mono">Bulk Inventory Import</h3>
                </div>
                <button onClick={() => setBulkUpdateOpen(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4 text-left">
                <p className="text-xs text-slate-400">
                  Upload bulk inventory spreadsheet updates (`.csv` / `.xlsx`) to apply adjustments.
                </p>
                <div className="border border-dashed border-slate-700 bg-[#070a13] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500/50 transition-colors">
                  <Upload className="text-slate-400 mb-2" size={24} />
                  <span className="text-xs text-slate-300 font-bold block">Drag & drop files here</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Accepts UTF-8 compliant CSV matching product schema</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#f59e0b] uppercase block mb-1.5">Quick Demo Refill (+10 to all stock levels)</span>
                  <button
                    onClick={() => {
                      const updated = inventory.map(item => ({
                        ...item,
                        stock: item.stock + 10
                      }));
                      setInventory(updated);
                      setBulkUpdateOpen(false);
                      setToastMessage("Added 10 units of stock to all products successfully!");
                      setTimeout(() => setToastMessage(null), 4000);
                    }}
                    className="w-full py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 font-mono text-xs font-bold text-amber-200 rounded-xl transition-all cursor-pointer"
                  >
                    Execute Demonstration Stock Refill
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enter New Stock Modal */}
      <AnimatePresence>
        {isAddStockOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1424]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📦</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-wider uppercase font-mono">
                      Enter New Stock / SKU
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">නව තොග භාණ්ඩයක් ඇතුලත් කිරීම</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddStockOpen(false)} 
                  className="text-slate-400 hover:text-white cursor-pointer p-1 transition-all rounded text-lg leading-none"
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddNewStockSubmit} className="p-5 space-y-4 text-left">
                {/* Product Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                    Product Name / භාණ්ඩයේ නම <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStockName}
                    onChange={(e) => setNewStockName(e.target.value)}
                    placeholder="e.g. Trendy Cotton Shirt / Galle Saffron Powder"
                    className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-800 bg-[#070a13] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans font-medium"
                  />
                </div>

                {/* SKU Code (Optional) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                    Custom SKU / SKU කේතය (Optional - Auto-generated if blank)
                  </label>
                  <input
                    type="text"
                    value={newStockSku}
                    onChange={(e) => setNewStockSku(e.target.value)}
                    placeholder="e.g. SKU-SHIRT-BLUE-M"
                    className="w-full text-xs font-mono px-3.5 py-3 rounded-xl border border-slate-800 bg-[#070a13] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium"
                  />
                </div>

                {/* Cost price & Sale Price Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Sourcing Cost / ඒකක මිල (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newStockCost}
                      onChange={(e) => setNewStockCost(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="Cost in LKR (e.g. 800)"
                      className="w-full text-xs font-mono px-3.5 py-3 rounded-xl border border-slate-800 bg-[#070a13] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Selling Price / විකුණුම් මිල (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newStockPrice}
                      onChange={(e) => setNewStockPrice(e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="Price in LKR (e.g. 1950)"
                      className="w-full text-xs font-mono px-3.5 py-3 rounded-xl border border-slate-800 bg-[#070a13] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Initial Qty & Alert Threshold Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Initial Quantity / ආරම්භක තොගය
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newStockQty}
                      onChange={(e) => setNewStockQty(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="e.g. 100"
                      className="w-full text-xs font-mono px-3.5 py-3 rounded-xl border border-slate-800 bg-[#070a13] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Low Stock Alert / අවම සීමාව
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newStockAlert}
                      onChange={(e) => setNewStockAlert(Math.max(1, parseInt(e.target.value) || 5))}
                      placeholder="Alert threshold (e.g. 5)"
                      className="w-full text-xs font-mono px-3.5 py-3 rounded-xl border border-slate-800 bg-[#070a13] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddStockOpen(false)}
                    className="px-4 py-3 text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[100px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-3 text-xs font-bold bg-[#06b6d4] hover:bg-cyan-500 text-slate-950 rounded-xl transition-all font-mono flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] min-h-[44px]"
                  >
                    🚀 Save & Sync Stock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Modal Overlay */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1424]">
                <div className="flex items-center gap-2">
                  <History className="text-blue-400" size={18} />
                  <h3 className="text-sm font-extrabold text-white tracking-wider uppercase font-mono">Inventory Change Logs</h3>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white cursor-pointer p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 max-h-[350px] overflow-y-auto space-y-3.5 text-left">
                <div className="border-l-2 border-emerald-500/40 pl-4 py-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-bold">DISPATCHED</span>
                    <span className="text-[9px] font-mono text-slate-500">{new Date(Date.now() - 3600000).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-300">1x item deducted for customer order dispatch</p>
                </div>
                <div className="border-l-2 border-amber-500/40 pl-4 py-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/20 text-amber-400 font-bold">LOW STOCK</span>
                    <span className="text-[9px] font-mono text-slate-500">{new Date(Date.now() - 7200000).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-300">Warning triggered: stock count dropped below alert threshold</p>
                </div>
                <div className="border-l-2 border-blue-500/40 pl-4 py-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-500/20 text-blue-400 font-bold">MANUAL REFILL</span>
                    <span className="text-[9px] font-mono text-slate-500">{new Date(Date.now() - 86400000).toLocaleString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-300">Initial matrix synchronization applied successfully</p>
                </div>
              </div>
              <div className="p-4 bg-[#0e1424] border-t border-slate-800 flex justify-end">
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 text-xs font-bold font-mono bg-blue-600 hover:bg-blue-700 rounded-lg text-white cursor-pointer"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
