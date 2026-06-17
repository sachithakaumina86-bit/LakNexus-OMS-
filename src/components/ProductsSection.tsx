import { useState, useEffect } from "react";
import { 
  PlusCircle, LayoutGrid, Package, FolderKanban, Box, 
  AlertOctagon, Truck, Ruler, X, ChevronLeft, Save, 
  FileText, ArrowRight, Table, HelpCircle, Eye, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InventoryItem } from "../types";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  productType: "Simple" | "Variable";
  status: "Active" | "Draft";
  lowStockAlert: number;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  weight: number; // in kg
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface ProductsSectionProps {
  currentTenantId: string;
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
}

export default function ProductsSection({ 
  currentTenantId, 
  inventory, 
  setInventory 
}: ProductsSectionProps) {
  const [view, setView] = useState<"landing" | "add" | "catalog">("landing");
  
  // Derive products directly from parent inventory (Single Source of Truth)
  const products: Product[] = inventory.map((item) => {
    return {
      id: item.id,
      name: item.name,
      sku: item.sku || `SKU-${item.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toUpperCase()}-${item.id}`,
      category: item.category || "General Retail",
      description: item.description || `Premium quality ${item.name} with premium packing. Perfect for digital ads and rapid scale-up.`,
      productType: (item.productType as "Simple" | "Variable") || "Simple",
      status: (item.status as "Active" | "Draft") || "Active",
      lowStockAlert: item.lowStockAlert !== undefined ? item.lowStockAlert : 5,
      costPrice: item.cost,
      salePrice: item.price,
      stockQuantity: item.stock,
      weight: item.weight || 0.35,
      dimensions: item.dimensions || {
        length: 15,
        width: 10,
        height: 5
      }
    };
  });

  // Keep localStorage & other legacy keys in sync with standard inventory state
  useEffect(() => {
    localStorage.setItem(`laknexus_${currentTenantId}_products_rich`, JSON.stringify(products));
  }, [inventory, currentTenantId]);

  // State handles for the multi-faceted new product form
  const [productType, setProductType] = useState<"Simple" | "Variable">("Simple");
  const [status, setStatus] = useState<"Active" | "Draft">("Active");
  const [lowStockAlert, setLowStockAlert] = useState<number>(5);
  
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [description, setDescription] = useState("");
  
  const [costPrice, setCostPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  
  const [weight, setWeight] = useState<number>(0.2);
  const [length, setLength] = useState<number>(10);
  const [width, setWidth] = useState<number>(10);
  const [height, setHeight] = useState<number>(5);

  const [notification, setNotification] = useState<string | null>(null);

  // Trigger SKU auto-generation when name changes and SKU is clean
  useEffect(() => {
    if (name && !sku) {
      const generated = `SKU-${name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      setSku(generated);
    }
  }, [name]);

  const handleResetForm = () => {
    setProductType("Simple");
    setStatus("Active");
    setLowStockAlert(5);
    setName("");
    setSku("");
    setCategory("Electronics");
    setDescription("");
    setCostPrice(0);
    setSalePrice(0);
    setStockQuantity(10);
    setWeight(0.2);
    setLength(10);
    setWidth(10);
    setHeight(5);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Product Name is required");
      return;
    }

    const finalSku = sku || `SKU-${name.replace(/\s+/g, "-").toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newInventoryItem: any = {
      id: Date.now().toString(),
      name: name.trim(),
      cost: costPrice || 0,
      price: salePrice || 0,
      stock: stockQuantity || 0,
      sku: finalSku,
      category,
      description,
      productType,
      status,
      lowStockAlert,
      weight: weight || 0.35,
      dimensions: {
        length: length || 15,
        width: width || 10,
        height: height || 5
      }
    };

    setInventory([newInventoryItem, ...inventory]);
    
    setNotification(`Successfully created "${name}"!`);
    handleResetForm();
    setView("catalog");

    // Clear alert after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    // Remove from centralized inventory to keep sync
    const finalInventory = inventory.filter((i) => i.id !== id);
    setInventory(finalInventory);

    setNotification(`Deleted product "${name}"`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6" id="products-section-root">
      
      {/* Visual Workspace Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest leading-none">
              LakNexus Product Core
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
              📦 Product Management System <span className="text-xs font-normal text-slate-400">| භාණ්ඩ කළමනාකරණය</span>
            </h1>
            <p className="text-xs text-slate-450 mt-1 max-w-2xl leading-relaxed">
              Register high-converting simple or variable Sri Lankan dropshipping products. Control basic details, pricing bounds, low stock triggers, packaging metrics, and publish to the live checkout system.
            </p>
          </div>
          
          {view !== "landing" && (
            <button
              onClick={() => setView("landing")}
              className="text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1.5 self-start md:self-center cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Back Gateway</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* RENDER MOD VIEW PORTS */}
      
      {/* 1. INITIAL LANDING VIEW (MODULAR SELECTION) */}
      {view === "landing" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Tile A: Add New Product */}
          <button
            id="product-tile-add"
            onClick={() => {
              handleResetForm();
              setView("add");
            }}
            className="group relative bg-[#0b0f19] border border-[#d97706]/30 hover:border-[#d97706]/80 p-8 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_24px_rgba(217,119,6,0.15)] cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
            
            <div className="size-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg">
              <PlusCircle className="size-8" />
            </div>

            <div className="space-y-2 mt-8">
              <h3 className="text-lg font-extrabold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                Add New Product 
                <span className="text-[10px] font-medium text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/10">නව භාණ්ඩ ඇතුළත් කිරීම</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Configure details, pricing thresholds, stock counts, SKU, and dimensions for simple or variable SKUs. Fully responsive data entry.
              </p>
            </div>
            
            <div className="font-bold text-[10px] uppercase text-amber-500 tracking-wider flex items-center gap-1.5 mt-4 group-hover:translate-x-1.5 transition-transform">
              <span>Launch Creator Portal</span>
              <ArrowRight size={12} />
            </div>
          </button>

          {/* Tile B: View Product Catalog */}
          <button
            id="product-tile-view"
            onClick={() => setView("catalog")}
            className="group relative bg-[#0b0f19] border border-[#d97706]/30 hover:border-[#d97706]/80 p-8 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_24px_rgba(217,119,6,0.15)] cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
            
            <div className="size-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg">
              <FolderKanban className="size-8" />
            </div>

            <div className="space-y-2 mt-8">
              <h3 className="text-lg font-extrabold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                View Product Catalog
                <span className="text-[10px] font-medium text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/10">භාණ්ඩ නාමාවලිය</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Monitor and search existing collections, modify prices, delete entries, and inspect critical safety stock warnings with a powerful ledger table.
              </p>
            </div>

            <div className="font-bold text-[10px] uppercase text-amber-500 tracking-wider flex items-center gap-1.5 mt-4 group-hover:translate-x-1.5 transition-transform">
              <span>Open Catalog Ledger</span>
              <ArrowRight size={12} />
            </div>
          </button>
        </div>
      )}

      {/* 2. REALISTIC COMPREHENSIVE ADD PRODUCT FORM (NO IMAGES) */}
      {view === "add" && (
        <form onSubmit={handleCreateProduct} className="space-y-6 animate-fade-in" id="add-product-form">
          <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
            
            {/* Top Config Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-lg flex items-center justify-center">
                  <Box size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-wider">Configure Core Attributes</h2>
                  <p className="text-[10px] text-slate-400 leading-none mt-0.5">Define category classification and system status triggers</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {/* Product Type Switcher */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Product Type</label>
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850">
                    <button
                      type="button"
                      onClick={() => setProductType("Simple")}
                      className={`px-3 py-1 text-[9.5px] font-bold rounded-md transition-all cursor-pointer ${
                        productType === "Simple" 
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Simple Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductType("Variable")}
                      className={`px-3 py-1 text-[9.5px] font-bold rounded-md transition-all cursor-pointer ${
                        productType === "Variable" 
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Variable Product
                    </button>
                  </div>
                </div>

                {/* Status Switcher */}
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="bg-slate-950 text-xs font-bold text-white border border-slate-850 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Block 1: Basic Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-amber-500/10 pb-1">
                <FileText size={14} />
                <span>1. General Identification | සාමාන්‍ය තොරතුරු</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Product Name */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-350 uppercase tracking-wider block">
                    Product Title * <span className="text-slate-500 text-[9px] font-medium">(භාණ්ඩයේ නම)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Unbreakable Stainless Steel Thermos Flask"
                    className="w-full bg-slate-950 text-xs text-white border border-slate-850 focus:border-amber-500 rounded-lg px-3 py-2.5 outline-none transition-all"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-350 uppercase tracking-wider block">
                    SKU Identifier <span className="text-slate-500 text-[9px] font-medium">(අද්විතීය කේතය)</span>
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g., SKU-THERMOS-842"
                    className="w-full bg-slate-950 text-xs font-mono text-white border border-slate-850 focus:border-amber-500 rounded-lg px-3 py-2.5 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-350 uppercase tracking-wider block">
                    Product Category <span className="text-slate-500 text-[9px] font-medium">(වර්ගීකරණය)</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-white border border-slate-850 focus:border-amber-500 rounded-lg px-3 py-2.5 outline-none transition-all cursor-pointer"
                  >
                    <option value="Electronics">Electronics (විද්‍යුත් උපකරණ)</option>
                    <option value="Kitchen & Home">Kitchen & Home (මුළුතැන්ගෙයි උපකරණ)</option>
                    <option value="Apparel & Fashion">Apparel & Fashion (ඇඟලුම් සහ විලාසිතා)</option>
                    <option value="Health & Beauty">Health & Beauty (සෞඛ්‍ය හා රූපලාවන්‍ය)</option>
                    <option value="Kids & Toys">Kids & Toys (ළමා සෙල්ලම් බඩු)</option>
                    <option value="General Retail">General Retail (වෙනත් භාණ්ඩ)</option>
                  </select>
                </div>

                {/* Low Stock Threshold Alert */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-extrabold text-slate-350 uppercase tracking-wider block flex items-center gap-1">
                    <AlertOctagon size={11} className="text-amber-500" />
                    <span>Low Stock Alert Trigger <span className="text-slate-500 text-[9px] font-medium">(අඩු තොග අනතුරු ඇඟවීමේ සීමාව)</span></span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={lowStockAlert}
                      onChange={(e) => setLowStockAlert(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 text-xs text-white border border-slate-850 focus:border-amber-500 rounded-lg px-3 py-2.5 outline-none transition-all"
                    />
                    <span className="absolute right-3.5 top-2.5 text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                      Units
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-350 uppercase tracking-wider block">
                  Full Description <span className="text-slate-500 text-[9px] font-medium">(භාණ්ඩයේ සම්පූර්ණ විස්තරය)</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the key sale propositions, material specs, dropshipping supplier note, packaging bounds..."
                  className="w-full bg-slate-950 text-xs text-white border border-slate-850 focus:border-amber-500 rounded-lg px-3 py-2.5 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Block 2: Pricing, Inventory & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Box 1: Pricing */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
                <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest border-b border-slate-850 pb-1.5">
                  💵 Pricing Bounds
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">Cost Price (COGS)*</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400">රු.</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={costPrice || ""}
                        onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                        placeholder="1200"
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">Sale Price*</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400">රු.</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={salePrice || ""}
                        onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                        placeholder="2800"
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {salePrice > 0 && costPrice > 0 && (
                  <div className="bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/10 text-[10.5px] text-slate-300 flex items-center justify-between">
                    <div>
                      <p className="font-bold">Estimated Markup & profit margin:</p>
                      <p className="text-[9.5px] text-slate-450 mt-0.5">Calculated based on standard product costing.</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-amber-400">රු. {(salePrice - costPrice).toLocaleString()}</p>
                      <p className="text-[9.5px] font-bold text-emerald-400 font-mono">
                        {(((salePrice - costPrice) / salePrice) * 100).toFixed(1)}% Margin
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Box 2: Inventory */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
                <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest border-b border-slate-850 pb-1.5">
                  📦 Inventory Ledger Stock
                </h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 block">Initial Stock Quantity*</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        required
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                        placeholder="50"
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-3 py-2.5 outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-3.5 top-2.5 text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                        Units
                      </span>
                    </div>
                  </div>

                  <p className="text-[9.5px] text-slate-450 leading-relaxed italic">
                    Note: Adding this product automatically creates a mirror stock card in the &ldquo;Live Inventory Controller&rdquo; module. Any sales will deduct stock numbers synchronously.
                  </p>
                </div>
              </div>
            </div>

            {/* Block 3: Shipping & Packaging Logistics Info */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-amber-500/10 pb-1">
                <Truck size={14} />
                <span>3. Delivery & Logistic Bounds | ප්‍රවාහන හා ඇසුරුම් ප්‍රමාණ</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-350 block">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={weight || ""}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 0.45"
                    className="w-full bg-slate-950 text-xs text-white border border-slate-850 focus:border-amber-500 rounded-lg px-3 py-2.5 outline-none transition-all"
                  />
                  <p className="text-[8.5px] text-slate-500">Crucial for Fardar / Koombiyo pricing</p>
                </div>

                {/* Length */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-350 block flex items-center gap-1">
                    <Ruler size={10} />
                    <span>Box Length (cm)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={length || ""}
                    onChange={(e) => setLength(parseInt(e.target.value) || 0)}
                    placeholder="20"
                    className="w-full bg-slate-950 text-xs text-white border border-slate-850 focus:border-amber-500 rounded-lg px-3 py-2.5 outline-none transition-all"
                  />
                </div>

                {/* Width */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-350 block flex items-center gap-1">
                    <Ruler size={10} />
                    <span>Box Width (cm)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={width || ""}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                    placeholder="15"
                    className="w-full bg-slate-950 text-xs text-white border border-slate-850 focus:border-amber-500 rounded-lg px-3 py-2.5 outline-none transition-all"
                  />
                </div>

                {/* Height */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-350 block flex items-center gap-1">
                    <Ruler size={10} />
                    <span>Box Height (cm)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={height || ""}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                    placeholder="10"
                    className="w-full bg-slate-950 text-xs text-white border border-slate-850 focus:border-amber-500 rounded-lg px-3 py-2.5 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Actions Form Footer */}
            <div className="flex justify-end items-center gap-3 border-t border-slate-800 pt-6">
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setView("landing");
                }}
                className="bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs py-2.5 px-5 rounded-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                Cancel / අවලංගු කරන්න
              </button>
              
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-950/20 active:scale-95 cursor-pointer"
              >
                <Save size={14} />
                <span>Create Product / භාණ්ඩය සුරකින්න</span>
              </button>
            </div>

          </div>
        </form>
      )}

      {/* 3. PRODUCT CATALOG LIST */}
      {view === "catalog" && (
        <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in text-white" id="product-catalog-box">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">Published Product Catalog</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time dropshipping master ledger sheet</p>
            </div>
            
            <button
              onClick={() => {
                handleResetForm();
                setView("add");
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <PlusCircle size={14} />
              <span>Quick Create SKU</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9.5px]">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4">Cost Price</th>
                  <th className="py-3 px-4">Sale Price</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 font-medium">
                {products.length > 0 ? (
                  products.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition">
                      {/* Name & Type */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <p className="font-extrabold text-white">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            item.productType === "Variable" 
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/10" 
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                          }`}>
                            {item.productType}
                          </span>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            item.status === "Active" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" 
                              : "bg-slate-800 text-slate-400 border border-slate-700/50"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono text-slate-350 text-[11px] font-semibold">{item.sku}</td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-xs text-slate-400">{item.category}</td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`size-1.5 rounded-full ${
                            item.stockQuantity <= item.lowStockAlert 
                              ? "bg-red-500 animate-pulse" 
                              : "bg-emerald-500"
                          }`} />
                          <span className={`font-mono text-[11.5px] font-bold ${
                            item.stockQuantity <= item.lowStockAlert ? "text-red-400" : "text-white"
                          }`}>
                            {item.stockQuantity} Units
                          </span>
                        </div>
                        {item.stockQuantity <= item.lowStockAlert && (
                          <p className="text-[8.5px] text-red-500 font-extrabold uppercase tracking-wide mt-0.5">Low Stock Alert</p>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">රු. {item.costPrice.toLocaleString()}</td>

                      {/* Sale Price */}
                      <td className="py-3.5 px-4 font-mono text-xs text-amber-400 font-bold">රු. {item.salePrice.toLocaleString()}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            title="Delete SKU"
                            onClick={() => handleDeleteProduct(item.id, item.name)}
                            className="p-1.5 hover:text-red-400 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 hover:border-red-550/30 transition cursor-pointer text-slate-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      No products found. Use &ldquo;Quick Create SKU&rdquo; at the top.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 font-bold select-none uppercase tracking-wide">
            <span>Total Logged SKUs: {products.length} Items</span>
            <span>All SKU pricing synchronizes with physical order calculations</span>
          </div>
        </div>
      )}

    </div>
  );
}
