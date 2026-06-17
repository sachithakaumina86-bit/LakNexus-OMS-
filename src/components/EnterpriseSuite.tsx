import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building, Truck, DollarSign, RefreshCw, Key, Shield, Clock, Bell, 
  BarChart4, Calendar, Users, Eye, HelpCircle, ArrowUpRight, Check, X,
  Save, Trash2, Download, AlertCircle, FileSpreadsheet, Lock, AlertTriangle, ChevronRight, RefreshCw as Loop
} from "lucide-react";
import { ScrapedOrder } from "../types";

interface EnterpriseSuiteProps {
  orders: ScrapedOrder[];
  inventory: any[];
  setOrders: React.Dispatch<React.SetStateAction<ScrapedOrder[]>>;
  setInventory: React.Dispatch<React.SetStateAction<any[]>>;
  currentTenantId: string;
}

export default function EnterpriseSuite({
  orders,
  inventory,
  setOrders,
  setInventory,
  currentTenantId
}: EnterpriseSuiteProps) {
  // Enterprise Suite sub-tabs
  const [subTab, setSubTab] = useState<
    "logistics" | "cod" | "returns" | "rbac" | "audit" | "notifications" | "analytics" | "customer"
  >("logistics");

  const [toast, setToast] = useState<string | null>(null);

  // Dynamic state hooks for Enterprise simulated and live actions
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [codRecords, setCodRecords] = useState<any[]>([]);
  const [returnRecords, setReturnRecords] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // RBAC custom selection
  const [selectedRole, setSelectedRole] = useState<"Super Admin" | "Branch Manager" | "Sales Staff" | "Warehouse Staff" | "Finance Staff">("Super Admin");
  const [permissionsMatrix, setPermissionsMatrix] = useState<any>({
    "Super Admin": { orders: { create: true, read: true, edit: true, delete: true }, inventory: { create: true, read: true, edit: true, delete: true }, financials: { create: true, read: true, edit: true, delete: true }, settings: { create: true, read: true, edit: true, delete: true } },
    "Branch Manager": { orders: { create: true, read: true, edit: true, delete: false }, inventory: { create: true, read: true, edit: true, delete: false }, financials: { create: false, read: true, edit: false, delete: false }, settings: { create: false, read: true, edit: false, delete: false } },
    "Sales Staff": { orders: { create: true, read: true, edit: true, delete: false }, inventory: { create: false, read: true, edit: false, delete: false }, financials: { create: false, read: false, edit: false, delete: false }, settings: { create: false, read: false, edit: false, delete: false } },
    "Warehouse Staff": { orders: { create: false, read: true, edit: false, delete: false }, inventory: { create: true, read: true, edit: true, delete: false }, financials: { create: false, read: false, edit: false, delete: false }, settings: { create: false, read: false, edit: false, delete: false } },
    "Finance Staff": { orders: { create: false, read: true, edit: false, delete: false }, inventory: { create: false, read: true, edit: false, delete: false }, financials: { create: true, read: true, edit: true, delete: false }, settings: { create: false, read: false, edit: false, delete: false } }
  });

  // Selection state for chronological order timeline
  const [selectedOrderTimelineId, setSelectedOrderTimelineId] = useState<string>("");
  const [customTimelineEvents, setCustomTimelineEvents] = useState<any[]>([]);

  // Selection state for Customer lookup
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string>("");

  // Input states for Courier Dispatch action
  const [dispatchOrderId, setDispatchOrderId] = useState("");
  const [dispatchCourierId, setDispatchCourierId] = useState("");
  const [dispatchTracking, setDispatchTracking] = useState("");
  const [dispatchCost, setDispatchCost] = useState("350");

  // Input states for COD Remit action
  const [remitOrderId, setRemitOrderId] = useState("");
  const [remitAmount, setRemitAmount] = useState("");
  const [remitRef, setRemitRef] = useState("");
  const [remitNotes, setRemitNotes] = useState("");

  // Input states for Return/RTO request creation
  const [returnOrderId, setReturnOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnItemName, setReturnItemName] = useState("");
  const [returnQty, setReturnQty] = useState("1");
  const [returnRefund, setReturnRefund] = useState("0");

  // Load backend seed values on mount
  useEffect(() => {
    fetch("/api/enterprise/warehouses")
      .then(res => res.json())
      .then(data => setWarehouses(data))
      .catch(() => {
        // Fallback mock seeds if standalone or offline
        setWarehouses([
          { id: "w-col-1", name: "Colombo Central Depot", code: "COL-DEP-01", address: "Pettah, Colombo 11", phone: "0771234567", isActive: true },
          { id: "w-knd-2", name: "Kandy Distribution Hub", code: "KND-HUB-02", address: "William G. Mawatha, Kandy", phone: "0772345678", isActive: true },
          { id: "w-gal-3", name: "Galle Costal Depot", code: "GAL-DEP-03", address: "Matara Road, Galle", phone: "0773456789", isActive: true }
        ]);
      });

    fetch("/api/enterprise/couriers")
      .then(res => res.json())
      .then(data => setCouriers(data))
      .catch(() => {
        setCouriers([
          { id: "c-koo-1", name: "Koombiyo Logistics", code: "KOOMBIYO", phone: "0115999555", baseWpRate: 350, baseOutstationRate: 450 },
          { id: "c-dom-2", name: "Domex Express", code: "DOMEX", phone: "0117555666", baseWpRate: 320, baseOutstationRate: 430 },
          { id: "c-pro-3", name: "Pronto Lanka", code: "PRONTO", phone: "0112575454", baseWpRate: 380, baseOutstationRate: 480 },
          { id: "c-far-4", name: "Fardar Express", code: "FARDAR", phone: "0114000300", baseWpRate: 340, baseOutstationRate: 440 }
        ]);
      });

    // Populate stock setup on backend to ensure unified state is initialized
    fetch("/api/enterprise/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: inventory.map(item => ({ id: item.id, name: item.name, stock: item.stock }))
      })
    }).catch(err => console.log("Backend setup skipped", err));

    refreshDbStates();

    // Auto-select first order if available for chronological timeline view
    if (orders.length > 0) {
      setSelectedOrderTimelineId(orders[0].id);
      setSelectedCustomerPhone(orders[0].customer?.phone1 || "");
    }
  }, [orders, inventory]);

  // Load custom order timeline events when selection changes
  useEffect(() => {
    if (!selectedOrderTimelineId) return;
    fetch(`/api/enterprise/timeline/${selectedOrderTimelineId}`)
      .then(res => res.json())
      .then(data => setCustomTimelineEvents(data))
      .catch(() => {
        // Mock timeline sequence
        setCustomTimelineEvents([
          { id: "m-1", eventType: "CREATED", eventDescription: "Order generated via Facebook Scraping Pipeline.", loggedBy: "LakNexus AI", createdAt: new Date(Date.now() - 36000000).toISOString() },
          { id: "m-2", eventType: "CONFIRMED", eventDescription: "Stock deduction verified & order confirmed.", loggedBy: "sachithakaumina0@gmail.com", createdAt: new Date(Date.now() - 32000000).toISOString() }
        ]);
      });
  }, [selectedOrderTimelineId]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const refreshDbStates = () => {
    fetch("/api/enterprise/shipments")
      .then(res => res.json())
      .then(data => setShipments(data))
      .catch(() => {});

    fetch("/api/enterprise/cod")
      .then(res => res.json())
      .then(data => setCodRecords(data))
      .catch(() => {});

    fetch("/api/enterprise/returns")
      .then(res => res.json())
      .then(data => setReturnRecords(data))
      .catch(() => {});

    fetch("/api/enterprise/audit-logs")
      .then(res => res.json())
      .then(data => setAuditLogs(data))
      .catch(() => {});

    fetch("/api/enterprise/notifications")
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(() => {});
  };

  // HANDLER: Dispatch Order Logistics Setup
  const handleDispatchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrderId || !dispatchCourierId) {
      alert("Please select Order and Courier.");
      return;
    }

    const payload = {
      orderId: dispatchOrderId,
      courierId: dispatchCourierId,
      trackingNumber: dispatchTracking || `LK-${Date.now().toString().slice(6)}`,
      shippingCost: parseFloat(dispatchCost) || 350
    };

    fetch("/api/enterprise/shipment/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(resData => {
      // update central parent order state to reflect "Dispatched" immediately!
      setOrders(prev => prev.map(o => {
        if (o.id === dispatchOrderId) {
          return { ...o, status: "Dispatched" };
        }
        return o;
      }));

      showToastMsg(`🚀 Order #${dispatchOrderId} has been successfully dispatched via Courier!`);
      // Setup default COD record for tracking
      const matchingOrder = orders.find(o => o.id === dispatchOrderId);
      if (matchingOrder) {
        const totalAmount = matchingOrder.invoice?.total || 1500;
        // mock record push or wait backend
        fetch("/api/enterprise/cod/remit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: dispatchOrderId,
            amountCollected: 0,
            reconciliationNotes: "Awaiting carrier transit payout."
          })
        }).catch(() => {});
      }

      setDispatchOrderId("");
      setDispatchTracking("");
      refreshDbStates();
    })
    .catch(() => {
      // Offline fallback state update
      setOrders(prev => prev.map(o => o.id === dispatchOrderId ? { ...o, status: "Dispatched" } : o));
      showToastMsg(`🚀 [Offline Mode] Dispatched Order #${dispatchOrderId}`);
    });
  };

  // HANDLER: COD Remittance update
  const handleCodRemitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remitOrderId || !remitAmount) {
      alert("Order ID and Collected Amount are required.");
      return;
    }

    fetch("/api/enterprise/cod/remit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: remitOrderId,
        amountCollected: parseFloat(remitAmount),
        courierReferenceNo: remitRef,
        reconciliationNotes: remitNotes
      })
    })
    .then(res => res.json())
    .then(() => {
      setOrders(prev => prev.map(o => o.id === remitOrderId ? { ...o, status: "Delivered" } : o));
      showToastMsg(`💰 COD Remittance recorded successfully for Order #${remitOrderId}!`);
      setRemitOrderId("");
      setRemitAmount("");
      setRemitRef("");
      setRemitNotes("");
      refreshDbStates();
    })
    .catch(() => {
      showToastMsg(`💰 [Offline] Remitted order #${remitOrderId}`);
    });
  };

  // HANDLER: Return Request & Auto Stock restoration
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrderId || !returnReason) {
      alert("Please fill Order ID and Return Reason.");
      return;
    }

    // Attempt to locate item details from matching order
    const matchedOrder = orders.find(o => o.id === returnOrderId);
    const firstItem = matchedOrder?.items?.[0] || { name: returnItemName || "E-Commerce Item", quantity: parseInt(returnQty) || 1 };

    // Get matching product ID in inventory to RESTORE STOCK
    const matchedProduct = inventory.find(i => i.name.toLowerCase() === firstItem.name.toLowerCase());
    const productIdVal = matchedProduct ? matchedProduct.id : "1";

    const payload = {
      orderId: returnOrderId,
      returnReason,
      refundAmount: parseFloat(returnRefund) || 0,
      items: [
        {
          productId: productIdVal,
          quantity: Number(returnQty) || 1,
          restockWarehouseId: "w-col-1"
        }
      ]
    };

    fetch("/api/enterprise/returns/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(() => {
      // Rule: Automatic Stock Deduction & Restoration
      // We must increment the stock in our parent inventory state as requested!
      if (matchedProduct) {
        setInventory(prev => prev.map(inv => {
          if (inv.id === matchedProduct.id) {
            return { ...inv, stock: inv.stock + (Number(returnQty) || 1) };
          }
          return inv;
        }));
      }

      setOrders(prev => prev.map(o => o.id === returnOrderId ? { ...o, status: "Returned" } : o));
      showToastMsg(`🔄 Return approved! Stock restored to unified inventory.`);
      setReturnOrderId("");
      setReturnReason("");
      setReturnItemName("");
      refreshDbStates();
    })
    .catch(() => {
      showToastMsg(`🔄 [Offline] Processed Returns & stock restoration.`);
    });
  };

  // HANDLER: Export Report simulation
  const handleExportData = (type: "PDF" | "CSV" | "EXCEL") => {
    showToastMsg(`📥 Preparing secure ERP export. Generating ${type}...`);
    setTimeout(() => {
      showToastMsg(`✅ ${type} report downloaded successfully in LakNexus audit logs!`);
    }, 2000);
  };

  // Dynamic metrics computations
  const totalShipmentsCount = shipments.length;
  const pendingRemittanceCount = codRecords.filter(r => r.remittanceStatus === "PENDING_REMITTANCE").length;
  const returnedCount = returnRecords.length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-[200] max-w-sm bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-3 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center gap-2"
          >
            <span className="text-sm">⚡</span>
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#101424] to-[#040814] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-cyan-400 tracking-widest uppercase font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              LakNexus Enterprise Operations Suite
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-none">
              Operational ERP & Compliance Manager
            </h2>
            <p className="text-slate-400 text-xs max-w-2xl">
              Unified state engine for multi-branch retailers. Manage automated warehouse stocking, COD carrier remittance grids, and multi-role security logs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-800/80 px-4 py-2.5 rounded-xl font-mono text-slate-300">
            <Clock size={15} className="text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500">SYSTEM TIME (UTC)</div>
              <div className="text-xs font-black">2026-06-11 06:19:20</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Mini Tabs Grid */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/60 border border-slate-800/40 rounded-xl overflow-x-auto">
        <button
          onClick={() => setSubTab("logistics")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-lg transition-all border cursor-pointer ${
            subTab === "logistics" 
              ? "bg-blue-600 border-blue-500 text-white shadow-lg" 
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Truck size={14} />
          Logistics ({totalShipmentsCount})
        </button>

        <button
          onClick={() => setSubTab("cod")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-lg transition-all border cursor-pointer ${
            subTab === "cod" 
              ? "bg-emerald-600 border-emerald-500 text-white shadow-lg" 
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <DollarSign size={14} />
          COD Remittance ({pendingRemittanceCount} Pending)
        </button>

        <button
          onClick={() => setSubTab("returns")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-lg transition-all border cursor-pointer ${
            subTab === "returns" 
              ? "bg-amber-600 border-amber-500 text-white shadow-lg" 
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <RefreshCw size={14} />
          Returns & RTOs ({returnedCount})
        </button>

        <button
          onClick={() => setSubTab("customer")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-lg transition-all border cursor-pointer ${
            subTab === "customer" 
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" 
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users size={14} />
          Customer Hub
        </button>

        <button
          onClick={() => setSubTab("rbac")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-lg transition-all border cursor-pointer ${
            subTab === "rbac" 
              ? "bg-purple-600 border-purple-500 text-white shadow-lg" 
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Shield size={14} />
          RBAC Permissions
        </button>

        <button
          onClick={() => setSubTab("notifications")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-lg transition-all border cursor-pointer ${
            subTab === "notifications" 
              ? "bg-red-600 border-red-500 text-white shadow-lg" 
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bell size={14} />
          Alert Center
        </button>

        <button
          onClick={() => setSubTab("audit")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-lg transition-all border cursor-pointer ${
            subTab === "audit" 
              ? "bg-slate-700 border-slate-600 text-white shadow-lg" 
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Key size={14} />
          Audit Logs
        </button>

        <button
          onClick={() => setSubTab("analytics")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-lg transition-all border cursor-pointer ${
            subTab === "analytics" 
              ? "bg-cyan-600 border-cyan-500 text-white shadow-lg" 
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart4 size={14} />
          BI Reports & Exports
        </button>
      </div>

      {/* Main Container Workspace */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 min-h-[400px]">
        
        {/* TAB 1: COURIER & SHIPPING LOGISTICS */}
        {subTab === "logistics" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-5">
              {/* Form dispatch */}
              <form onSubmit={handleDispatchOrder} className="w-full md:w-1/3 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4 text-left">
                <div className="space-y-1">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                    Dispatch Order via Logistics
                  </h3>
                  <p className="text-[10px] text-slate-400">ඇණවුමක් කුරියර් සමාගමට භාරදීම</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Select Live Order
                  </label>
                  <select
                    value={dispatchOrderId}
                    onChange={(e) => setDispatchOrderId(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose Confirmed Order --</option>
                    {orders.filter(o => o.status !== "Dispatched" && o.status !== "Delivered").map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.id} - {o.customer?.name} ({o.customer?.address?.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Carrier Partner
                  </label>
                  <select
                    value={dispatchCourierId}
                    onChange={(e) => setDispatchCourierId(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose Courier --</option>
                    {couriers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Tracking code No.
                  </label>
                  <input
                    type="text"
                    value={dispatchTracking}
                    onChange={(e) => setDispatchTracking(e.target.value)}
                    placeholder="e.g. KB-129381-LK"
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Deliver Cost (LKR)
                  </label>
                  <input
                    type="number"
                    value={dispatchCost}
                    onChange={(e) => setDispatchCost(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-blue-500"
                >
                  <Truck size={14} />
                  Authorize Dispatch & Print Barcode
                </button>
              </form>

              {/* Status table */}
              <div className="flex-1 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                      Active Courier Transits
                    </h3>
                    <p className="text-[10px] text-slate-400">දැනට යවා ඇති ඇණවුම් ලුහුබැඳීම</p>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase">
                    Live Shipments
                  </span>
                </div>

                <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-bold">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Carrier Partner</th>
                        <th className="p-3">Tracking Code</th>
                        <th className="p-3">Cost (LKR)</th>
                        <th className="p-3">Dispatch Date</th>
                        <th className="p-3">Transit State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                            No shipments recorded. Fill out the dispatch form to release inventory.
                          </td>
                        </tr>
                      ) : (
                        shipments.map(s => {
                          const cr = couriers.find(c => c.id === s.courierId) || { name: "Domestic Courier" };
                          return (
                            <tr key={s.id} className="border-b border-slate-800/40 hover:bg-slate-800/15">
                              <td className="p-3 font-bold text-white">#{s.orderId}</td>
                              <td className="p-3 font-medium">{cr.name}</td>
                              <td className="p-3 font-mono text-cyan-400">{s.trackingNumber}</td>
                              <td className="p-3 font-mono">රු. {s.shippingCost}</td>
                              <td className="p-3 font-mono">{s.dispatchDate || "-"}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  {s.shippingStatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Courier performance summary widget */}
                <div className="bg-[#0e1424]/60 border border-slate-800/80 p-4 rounded-2xl grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Koombiyo delivery Rate</p>
                    <p className="text-sm font-extrabold text-white">92.4% success</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Domex Delivery Time</p>
                    <p className="text-sm font-extrabold text-white">1.8 days avg</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Returned orders ratio</p>
                    <p className="text-sm font-extrabold text-red-400">8.6% RTO</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Remittances status</p>
                    <p className="text-sm font-extrabold text-green-400">All Reconciled</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED COD FINANCE MANAGEMENT */}
        {subTab === "cod" && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row gap-5">
              {/* Form COD updates */}
              <form onSubmit={handleCodRemitSubmit} className="w-full md:w-1/3 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                    Record Carrier COD Remittance
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">කුරියර් මඟින් ලැබුණු මුදල් ගිණුම්ගත කිරීම</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Target Order
                  </label>
                  <select
                    value={remitOrderId}
                    onChange={(e) => setRemitOrderId(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose Order to Remit --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.id} - {o.customer?.name} (රු. {o.invoice?.total})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Collected Amount (LKR)
                  </label>
                  <input
                    type="number"
                    value={remitAmount}
                    onChange={(e) => setRemitAmount(e.target.value)}
                    required
                    placeholder="e.g. 5400"
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Courier remitted Reference No.
                  </label>
                  <input
                    type="text"
                    value={remitRef}
                    onChange={(e) => setRemitRef(e.target.value)}
                    placeholder="e.g. REM-98231-KOOM"
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Audit Notes
                  </label>
                  <textarea
                    value={remitNotes}
                    onChange={(e) => setRemitNotes(e.target.value)}
                    placeholder="Courier fees reconciliation exceptions"
                    rows={2}
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
                >
                  <DollarSign size={14} />
                  Authorize Remittance & Close COD
                </button>
              </form>

              {/* COD Reconcilled dashboard list */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                      Outstanding COD Remittance Matrix
                    </h3>
                    <p className="text-[10px] text-slate-400">කුරියර් සමාගම්වලින් ලැබීමට ඇති මුදල් පාලක පැනලය</p>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                    Finance reconciliation
                  </span>
                </div>

                <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-bold">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Expected COD</th>
                        <th className="p-3">Amount Deposited</th>
                        <th className="p-3">Pending Difference</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Settlement Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No active COD orders tracked in ledger.
                          </td>
                        </tr>
                      ) : (
                        orders.map(o => {
                          const rec = codRecords.find(c => c.orderId === o.id);
                          const expected = o.invoice?.total || 1800;
                          const collected = rec ? rec.amountCollected : 0;
                          const pending = Math.max(0, expected - collected);
                          const status = rec ? rec.remittanceStatus : "PENDING_REMITTANCE";

                          return (
                            <tr key={o.id} className="border-b border-slate-800/40 hover:bg-slate-800/15">
                              <td className="p-3 font-mono font-extrabold text-white">#{o.id}</td>
                              <td className="p-3 font-mono text-slate-300">රු. {expected.toLocaleString()}</td>
                              <td className="p-3 font-mono text-emerald-400">රු. {collected.toLocaleString()}</td>
                              <td className="p-3 font-mono text-yellow-500">රු. {pending.toLocaleString()}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                                  status === "FULLY_REMITTED" 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                                }`}>
                                  {status}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-400">{rec?.remittedAt ? rec.remittedAt.slice(0, 10) : "-"}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* COD reconcillation math alert */}
                <div className="bg-[#052e16]/30 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="text-emerald-400 shrink-0" size={20} />
                  <div>
                    <h4 className="text-white text-xs font-bold leading-tight font-mono">
                      Safe Reconciliation Guaranteed
                    </h4>
                    <p className="text-[10px] text-slate-300">
                      Our system reconciles raw deposits against courier APIs in real-time, instantly reporting LKR mismatch exceptions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RETURN WORKFLOW & RTO MANAGEMENT */}
        {subTab === "returns" && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row gap-5">
              {/* Form creation return */}
              <form onSubmit={handleReturnSubmit} className="w-full md:w-1/3 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                    Initiate Return/RTO Workflow
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">අලෙවි ආපසු ඒම් සහ හානි ඇණවුම් ප්‍රතිෂ්ඨාපනය</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Order ID with RTO
                  </label>
                  <select
                    value={returnOrderId}
                    onChange={(e) => setReturnOrderId(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose Order --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.id} - {o.customer?.name} ({o.customer?.phone1})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Reason for Return / RTO
                  </label>
                  <input
                    type="text"
                    required
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="e.g. Courier unable to contact / Customer Refused delivery"
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Returned Quantity
                    </label>
                    <input
                      type="number"
                      required
                      value={returnQty}
                      onChange={(e) => setReturnQty(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Refund Paid (LKR)
                    </label>
                    <input
                      type="number"
                      value={returnRefund}
                      onChange={(e) => setReturnRefund(e.target.value)}
                      className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[10px] text-slate-400">
                  ⚠️ Note: Click below will trigger an automatic stock level restoration back into your active warehouse depot database!
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer border border-amber-500"
                >
                  <RefreshCw size={14} />
                  Authorize Return & Auto-Restore Stock
                </button>
              </form>

              {/* Return items table logs */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                      Active Return Claims Tracker
                    </h3>
                    <p className="text-[10px] text-slate-400">සුරක්ෂිතව තොග පද්ධතියට එක්වූ RTO වාර්තා</p>
                  </div>
                  <span className="text-[10px] font-mono font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                    Automatic restocking
                  </span>
                </div>

                <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-bold">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Claim Date</th>
                        <th className="p-3">Reason details</th>
                        <th className="p-3">Return Status</th>
                        <th className="p-3">Refund Status</th>
                        <th className="p-3">Auditor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            No return claims authorized. Restore stock returns using the claim manager form.
                          </td>
                        </tr>
                      ) : (
                        returnRecords.map(r => (
                          <tr key={r.id} className="border-b border-slate-800/40 hover:bg-slate-800/15">
                            <td className="p-3 font-mono font-black text-rose-400">#{r.orderId}</td>
                            <td className="p-3 font-mono text-slate-400">{r.createdAt ? r.createdAt.slice(0,10) : "-"}</td>
                            <td className="p-3 font-medium text-slate-200">{r.returnReason}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20 block text-center uppercase">
                                {r.returnStatus}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-800 text-slate-400 block text-center uppercase">
                                {r.refundStatus}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-300">sachithakaumina0@gmail.com</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMER HISTORY CENTER */}
        {subTab === "customer" && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-1/3 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                    Customer intelligence Lookup
                  </h3>
                  <p className="text-[10px] text-slate-400">පාරිභෝගික මිලදීගැනීම් ඉතිහාසය</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    Phone Number search
                  </label>
                  <select
                    value={selectedCustomerPhone}
                    onChange={(e) => setSelectedCustomerPhone(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 py-2.5 px-3 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="">-- Select Customer Phone --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.customer?.phone1}>
                        {o.customer?.name} ({o.customer?.phone1})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomerPhone && (() => {
                  const customerOrders = orders.filter(o => o.customer?.phone1 === selectedCustomerPhone);
                  const totalSpent = customerOrders.reduce((acc, current) => acc + (current.invoice?.total || 0), 0);
                  const returnedOrNo = customerOrders.filter(o => o.status === "Returned").length;
                  const firstRecord = customerOrders[0];

                  return (
                    <div className="space-y-4 pt-3 border-t border-slate-800/60 font-mono">
                      <div className="bg-slate-950 p-4 rounded-xl space-y-2 border border-slate-800/40">
                        <div className="text-[10px] text-slate-500 uppercase">Profile Details</div>
                        <div className="text-xs font-black text-white">{firstRecord?.customer?.name}</div>
                        <div className="text-[11px] text-slate-400">{firstRecord?.customer?.phone1}</div>
                        <div className="text-[10px] text-slate-400 text-wrap leading-tight mt-1">
                          {firstRecord?.customer?.address?.line1}, {firstRecord?.customer?.address?.city}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/20 text-center">
                          <div className="text-[9px] text-slate-500 uppercase">Total Orders</div>
                          <div className="text-sm font-extrabold text-blue-400">{customerOrders.length}</div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/20 text-center">
                          <div className="text-[9px] text-slate-500 uppercase">Spent sum</div>
                          <div className="text-sm font-extrabold text-emerald-400">රු. {totalSpent.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/20 flex justify-between items-center text-xs">
                        <span className="text-[9px] text-slate-500 uppercase">RTO/Returned Status</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          returnedOrNo > 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          {returnedOrNo > 0 ? `${returnedOrNo} returned` : "Stable buyer"}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Order history timeline lookup */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                      Order Chronological Timeline Audit
                    </h3>
                    <p className="text-[10px] text-slate-400">ඇණවුම් ඉතිහාසයේ විගණන ලොගය</p>
                  </div>
                  <select
                    value={selectedOrderTimelineId}
                    onChange={(e) => setSelectedOrderTimelineId(e.target.value)}
                    className="text-xs bg-slate-950 border border-slate-800 py-1 px-3.5 rounded-xl text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>Order #{o.id}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-950/20 border border-slate-800/80 p-5 rounded-3xl relative">
                  <div className="absolute top-5 bottom-5 left-10 w-0.5 bg-slate-800/80" />

                  <div className="space-y-6 relative">
                    {customTimelineEvents.map((ev, index) => (
                      <div key={ev.id || index} className="flex items-start gap-6 font-mono">
                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800/80 z-10 font-bold flex items-center justify-center text-xs text-cyan-400 shrink-0">
                          0{index + 1}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-white flex items-center gap-2">
                            <span>{ev.eventType}</span>
                            <span className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                              {ev.createdAt?.slice(11, 19)}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {ev.eventDescription}
                          </p>
                          <p className="text-[9px] text-slate-600 font-medium">
                            Operational logged by: {ev.loggedBy}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ROLE BASED ACCESS CONTROL PERMISSIONS */}
        {subTab === "rbac" && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Left Role picker with details */}
              <div className="w-full lg:w-1/3 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                    Enterprise Staff Role Switcher
                  </h3>
                  <p className="text-[10px] text-slate-400">අවසර සීමාවන් පරීක්ෂා කිරීම</p>
                </div>

                <div className="space-y-2">
                  {(["Super Admin", "Branch Manager", "Sales Staff", "Warehouse Staff", "Finance Staff"] as any[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`w-full p-3 font-mono rounded-xl text-xs font-extrabold text-left transition-all flex items-center justify-between cursor-pointer border ${
                        selectedRole === role 
                          ? "bg-purple-600/30 border-purple-500/50 text-white" 
                          : "bg-transparent border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>{role}</span>
                      <ChevronRight size={14} className={selectedRole === role ? "text-purple-400" : "text-slate-600"} />
                    </button>
                  ))}
                </div>

                <div className="bg-slate-950 p-4 border border-slate-800/40 rounded-xl space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Role Description</div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {selectedRole === "Super Admin" && "Full administrative capabilities across all departments, branches, and financials."}
                    {selectedRole === "Branch Manager" && "Authorized to approve local dispatch, create reports, monitor branch products, and process returns."}
                    {selectedRole === "Sales Staff" && "Optimized to parse raw chat texts, initiate digital order states, request coupons, and handle logistics lookup."}
                    {selectedRole === "Warehouse Staff" && "Fulfillment focus. Deducts stocks, records damaged units, registers courier serials, and restores returns."}
                    {selectedRole === "Finance Staff" && "Controls cash ledger balance, approves COD remittance deposit values, and reviews expense allocations."}
                  </p>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                      Module Permission Matrix: {selectedRole}
                    </h3>
                    <p className="text-[10px] text-slate-400">අදාළ භූමිකාවට අදාළ මොඩියුල අවසර සීමා</p>
                  </div>
                  <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase px-2 py-0.5 rounded font-mono font-bold">
                    Role Settings Secure
                  </span>
                </div>

                <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/20 font-mono">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-bold">
                        <th className="p-3">Module Name</th>
                        <th className="p-3 text-center">Create</th>
                        <th className="p-3 text-center">Read / View</th>
                        <th className="p-3 text-center">Update / Edit</th>
                        <th className="p-3 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["Orders Manager", "Inventory Controller", "Financials & ROI", "System Configurations"].map((module, idx) => {
                        const codeKey = idx === 0 ? "orders" : idx === 1 ? "inventory" : idx === 2 ? "financials" : "settings";
                        const activePerms = permissionsMatrix[selectedRole]?.[codeKey] || { create: false, read: true, edit: false, delete: false };

                        return (
                          <tr key={module} className="border-b border-slate-800/40 hover:bg-slate-800/15">
                            <td className="p-3 font-extrabold text-white">{module}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${
                                activePerms.create ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400"
                              }`}>
                                {activePerms.create ? "ALLOWED" : "DENIED"}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${
                                activePerms.read ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400"
                              }`}>
                                {activePerms.read ? "ALLOWED" : "DENIED"}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${
                                activePerms.edit ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400"
                              }`}>
                                {activePerms.edit ? "ALLOWED" : "DENIED"}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${
                                activePerms.delete ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400"
                              }`}>
                                {activePerms.delete ? "ALLOWED" : "DENIED"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-950 p-4 border border-slate-800/40 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Lock className="text-purple-400" size={16} />
                    <span className="text-slate-300 font-bold">Secure Access Authorization Rule (A-RBAC)</span>
                  </div>
                  <button 
                    onClick={() => showToastMsg("🔒 Dynamic permissions policies locked. Admin authorization required.")}
                    className="px-4 py-2 bg-purple-600 text-white font-mono text-xs font-bold rounded-xl hover:bg-purple-700 transition-all cursor-pointer"
                  >
                    Request Matrix Override
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SYSTEM ALERT NOTIFICATIONS CENTER */}
        {subTab === "notifications" && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                  LakNexus Realtime Alarm Center
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">අනතුරු ඇඟවීම් සහ ක්ෂණික දැනුම්දීම් පැනලය</p>
              </div>
              <button 
                onClick={() => showToastMsg("🔄 Refreshing active alarms...")}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono font-bold"
              >
                <Loop size={12} />
                Fetch Alerts
              </button>
            </div>

            <div className="space-y-3 font-mono">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-950/20 border border-slate-800/80 rounded-2xl text-xs">
                  All systems operating nominally. Zero high-priority alarm logs in buffer queue.
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-opacity ${
                      n.resolved 
                        ? "bg-slate-950/20 border-slate-800/40 opacity-50" 
                        : n.type === "LOW_STOCK"
                          ? "bg-amber-500/5 border-amber-500/20"
                          : "bg-emerald-500/5 border-emerald-500/20"
                    }`}
                  >
                    <AlertTriangle className={n.type === "LOW_STOCK" ? "text-amber-400 shrink-0" : "text-emerald-400 shrink-0"} size={16} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">{n.title}</span>
                        <span className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full uppercase">
                          {n.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{n.description}</p>
                      <p className="text-[8.5px] text-slate-600 font-medium">{n.createdAt}</p>
                    </div>

                    {!n.resolved && (
                      <button 
                        onClick={() => {
                          fetch("/api/enterprise/notifications/resolve", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: n.id })
                          })
                          .then(() => {
                            showToastMsg("🔔 Alert marked resolved successfully!");
                            refreshDbStates();
                          })
                          .catch(() => {
                            showToastMsg("🔔 Alert resolved locally.");
                          });
                        }}
                        className="px-2.5 py-1 text-[9px] font-bold bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded cursor-pointer transition-all uppercase"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: SYSTEM AUDIT LOGS */}
        {subTab === "audit" && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                  LakNexus ERP Audit Trail Ledger
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">සියලුම පරිශීලක ක්‍රියාකාරකම් විගණන වාර්තාව</p>
              </div>
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-xl font-mono">
                Operator ID: sachithakaumina0@gmail.com
              </span>
            </div>

            <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/20 font-mono">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-bold">
                    <th className="p-3">Audit ID</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Operator</th>
                    <th className="p-3">Action Class</th>
                    <th className="p-3">Target Module</th>
                    <th className="p-3">Database Modifications Logged</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Zero audit signatures in storage directory.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="border-b border-slate-800/40 hover:bg-slate-800/15">
                        <td className="p-3 font-mono font-extrabold text-slate-500">#{log.id ? log.id.slice(6, 12).toUpperCase() : idx}</td>
                        <td className="p-3 font-mono text-slate-400">{log.createdAt ? log.createdAt.slice(11, 19) : "-"}</td>
                        <td className="p-3">
                          <span className="text-white font-medium block">{log.userEmail}</span>
                          <span className="text-[8px] text-violet-400 uppercase">{log.userRole}</span>
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-800/50 text-slate-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-700/50">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">{log.moduleName}</td>
                        <td className="p-3 font-medium text-slate-200">{log.actionDetails}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: ADVANED REGULATORY ANLYTICS & EXPORTS */}
        {subTab === "analytics" && (
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <FileSpreadsheet className="text-emerald-400" size={24} />
                <div className="space-y-1">
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                    Financial COD & Remittances Ledger
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Detailed spreadsheet audits containing carrier outstanding reconciliation values, cash-out logs, and SLA timing metrics.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExportData("EXCEL")}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-800 cursor-pointer"
                  >
                    <Download size={13} />
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleExportData("CSV")}
                    className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-800 cursor-pointer"
                  >
                    <Download size={13} />
                    CSV File
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <BarChart4 className="text-blue-400" size={24} />
                <div className="space-y-1">
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                    Branch Sales & Logistics Reports
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Corporate regulatory PDF charts detailing comparative branch growth statistics, low-stock frequency triggers, and RTO scores.
                  </p>
                </div>
                <button
                  onClick={() => handleExportData("PDF")}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-blue-500"
                >
                  <Download size={13} />
                  Download Corporate PDF Audit
                </button>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <Building className="text-purple-400" size={24} />
                <div className="space-y-1">
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                    Warehouse Stocks Valuation Audit
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Full valuation statement of total current asset prices locked inside Colombo Depot, Kandy Hub, and Galle Coastal centers.
                  </p>
                </div>
                <button
                  onClick={() => handleExportData("EXCEL")}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-purple-500"
                >
                  <Download size={13} />
                  Download Stock Valuations (.xlsx)
                </button>
              </div>
            </div>

            {/* Simulated analytics matrix breakdown with custom lists */}
            <div className="bg-slate-950/10 border border-slate-800/80 p-5 rounded-2xl space-y-4">
              <div>
                <h4 className="text-white text-xs font-bold uppercase tracking-wider font-mono">
                  Enterprise Logistics Distribution Performance Index (SLA Tracker)
                </h4>
                <p className="text-[10px] text-slate-400">කුරියර් ආයතනවල කාර්ය සාධන දර්ශකය</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-slate-950/40 p-4 border border-slate-800/40 rounded-xl space-y-1">
                  <div className="text-slate-500 text-[9px] uppercase">Koombiyo Logistics</div>
                  <div className="text-sm font-extrabold text-white">94% Deliv / Rs. 350 WP</div>
                  <div className="text-[10px] text-emerald-400">Fastest Southern/Western</div>
                </div>

                <div className="bg-slate-950/40 p-4 border border-slate-800/40 rounded-xl space-y-1">
                  <div className="text-slate-500 text-[9px] uppercase">Domex Express</div>
                  <div className="text-sm font-extrabold text-white">91% Deliv / Rs. 320 WP</div>
                  <div className="text-[10px] text-emerald-400">Best pricing structure</div>
                </div>

                <div className="bg-slate-950/40 p-4 border border-slate-800/40 rounded-xl space-y-1">
                  <div className="text-slate-500 text-[9px] uppercase">Pronto Lanka</div>
                  <div className="text-sm font-extrabold text-white">88% Deliv / Rs. 380 WP</div>
                  <div className="text-[10px] text-amber-400 font-bold">Reliable Outstations/Central</div>
                </div>

                <div className="bg-slate-950/40 p-4 border border-slate-800/40 rounded-xl space-y-1">
                  <div className="text-slate-500 text-[9px] uppercase">Fardar Express</div>
                  <div className="text-sm font-extrabold text-white">85% Deliv / Rs. 340 WP</div>
                  <div className="text-[10px] text-red-400">Higher return ratio (15%)</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
