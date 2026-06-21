import React, { useState, useEffect } from "react";
import { 
  Truck, 
  Package, 
  MapPin, 
  CreditCard, 
  DollarSign, 
  Check, 
  Plus, 
  Trash, 
  User, 
  Calendar, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertTriangle,
  Navigation,
  Activity,
  ArrowRight
} from "lucide-react";
import { ScrapedOrder } from "../types";

interface DeliveryTrip {
  id: string;
  courierName: string;
  riderName: string;
  assignedOrderIds: string[];
  status: "Staging" | "In Transit" | "Completed";
  date: string;
  tripCode: string;
}

interface DeliveryManagerProps {
  orders: ScrapedOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ScrapedOrder[]>>;
  onUpdateStatus: (id: string, status: ScrapedOrder["status"]) => void;
  currentTenantId: string;
}

export const DeliveryManager: React.FC<DeliveryManagerProps> = ({
  orders,
  setOrders,
  onUpdateStatus,
  currentTenantId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending Check" | "Approved" | "High Risk Hold">("All");
  const [paymentFilter, setPaymentFilter] = useState<"All" | "COD" | "Prepaid">("All");
  
  // Selection state for assigning orders to a new dispatch trip
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // Controls for creating a new delivery trip
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [newTripCourier, setNewTripCourier] = useState("Koombiyo Courier");
  const [newTripRider, setNewTripRider] = useState("");
  
  // Trips state persisted locally
  const [trips, setTrips] = useState<DeliveryTrip[]>([]);

  // Load and seed delivery trips
  useEffect(() => {
    const rawSaved = localStorage.getItem(`laknexus_${currentTenantId}_delivery_trips`);
    if (rawSaved) {
      try {
        setTrips(JSON.parse(rawSaved));
      } catch (e) {
        seedInitialTrips();
      }
    } else {
      seedInitialTrips();
    }
  }, [currentTenantId]);

  const saveTrips = (updatedTrips: DeliveryTrip[]) => {
    setTrips(updatedTrips);
    localStorage.setItem(`laknexus_${currentTenantId}_delivery_trips`, JSON.stringify(updatedTrips));
  };

  const seedInitialTrips = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const initial: DeliveryTrip[] = [
      {
        id: "trip-1",
        courierName: "Koombiyo Courier",
        riderName: "Sahan Gunawardena",
        assignedOrderIds: [], // We can dynamically relate some existing orders if available
        status: "In Transit",
        date: todayStr,
        tripCode: "TRIP-KOOM-981"
      },
      {
        id: "trip-2",
        courierName: "Domex Courier",
        riderName: "Janaka Perera",
         assignedOrderIds: [],
        status: "Staging",
        date: todayStr,
        tripCode: "TRIP-DMX-442"
      }
    ];
    saveTrips(initial);
  };

  // Helper to ensure order has a paymentType, defaulting to COD if not specified
  const getOrderPaymentType = (order: ScrapedOrder): "COD" | "Prepaid" => {
    if (order.paymentType) return order.paymentType;
    
    // Auto-detect based on rawInput context if possible
    const inp = order.rawInput.toLowerCase();
    if (inp.includes("prepaid") || inp.includes("paid") || inp.includes("bank transfer") || inp.includes("deposit")) {
      return "Prepaid";
    }
    return "COD";
  };

  // Toggle payment method for an order and sync back to parent
  const handleTogglePaymentMethod = (orderId: string) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const currentType = getOrderPaymentType(o);
        const nextType: "COD" | "Prepaid" = currentType === "COD" ? "Prepaid" : "COD";
        return { ...o, paymentType: nextType };
      }
      return o;
    });
    setOrders(updatedOrders);
  };

  // Get orders that are pending dispatch (either "Pending Check" or "Approved" or "High Risk Hold")
  const pendingDispatchOrders = orders.filter(
    (o) => o.status === "Pending Check" || o.status === "Approved" || o.status === "High Risk Hold"
  );

  // Filter pending orders based on search, status filter, and payment type filter
  const filteredPendingOrders = pendingDispatchOrders.filter((order) => {
    const matchesSearch = 
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.address.city.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    
    const paymentType = getOrderPaymentType(order);
    const matchesPayment = paymentFilter === "All" || paymentType === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate high-level KPIs
  const numPendingDispatches = pendingDispatchOrders.length;
  const activeTripsCount = trips.filter(t => t.status === "In Transit" || t.status === "Staging").length;
  
  // Calculate potential COD expected from pending dispatches marked as COD
  const expectedCODCash = pendingDispatchOrders
    .filter(o => getOrderPaymentType(o) === "COD")
    .reduce((sum, o) => sum + o.invoice.total, 0);

  // Calculate total prepaid value currently staged in the queue
  const expectedPrepaidTotal = pendingDispatchOrders
    .filter(o => getOrderPaymentType(o) === "Prepaid")
    .reduce((sum, o) => sum + o.invoice.total, 0);

  // CREATE TRIP HANDLER
  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripRider.trim()) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const tripCode = `TRIP-${newTripCourier.substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    
    const newTrip: DeliveryTrip = {
      id: `trip-${Date.now()}`,
      courierName: newTripCourier,
      riderName: newTripRider,
      assignedOrderIds: [...selectedOrderIds],
      status: "Staging",
      date: todayStr,
      tripCode: tripCode
    };

    // Transition all assigned orders to "Dispatched" immediately
    selectedOrderIds.forEach(orderId => {
      onUpdateStatus(orderId, "Dispatched");
    });

    const updatedTrips = [newTrip, ...trips];
    saveTrips(updatedTrips);
    
    // Reset selections
    setSelectedOrderIds([]);
    setNewTripRider("");
    setShowCreateTripModal(false);
  };

  // DELETE TRIP
  const handleDeleteTrip = (tripId: string) => {
    // Return any assigned orders back to "Approved" so they can be dispatched on a different trip
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      trip.assignedOrderIds.forEach(orderId => {
        onUpdateStatus(orderId, "Approved");
      });
    }

    const updated = trips.filter(t => t.id !== tripId);
    saveTrips(updated);
  };

  // TRIP STATUS PROGRESSION
  const handleUpdateTripStatus = (tripId: string, nextStatus: "In Transit" | "Completed") => {
    const updatedTrips = trips.map(t => {
      if (t.id === tripId) {
        // If completed, update all assigned orders to "Delivered" state
        if (nextStatus === "Completed") {
          t.assignedOrderIds.forEach(orderId => {
            onUpdateStatus(orderId, "Delivered");
          });
        }
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTrips(updatedTrips);
  };

  // Toggle checkout order selection for a new trip
  const handleToggleSelectOrder = (orderId: string) => {
    if (selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    } else {
      setSelectedOrderIds(prev => [...prev, orderId]);
    }
  };

  // Helper to resolve colors based on status
  const getTripStatusStyles = (status: string) => {
    switch (status) {
      case "Staging":
        return "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30";
      case "In Transit":
        return "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30";
      case "Completed":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden shrink-0">
        <div className="z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-600/30 rounded-lg text-blue-400">
              <Truck size={20} className="animate-pulse" />
            </span>
            <h1 className="text-xl font-black uppercase tracking-tight">
              Delivery Management Control <span className="text-xs font-normal text-slate-400">| බෙදාහැරීම් පාලන පද්ධතිය</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            ප්‍රවාහන ක්‍රියාවලිය, සක්‍රීය චාරිකා (Active Trips) පාලනය සහ COD එකතු කිරීම්/Prepaid ලේබල් එකම පැනලයකින් මෙහෙයවන්න.
          </p>
        </div>
        <div className="flex items-center gap-2 z-10">
          <button
            onClick={() => setShowCreateTripModal(true)}
            disabled={selectedOrderIds.length === 0}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              selectedOrderIds.length > 0 
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95" 
                : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
            }`}
          >
            <Plus size={16} />
            Create Dispatch Trip ({selectedOrderIds.length})
          </button>
        </div>
      </div>

      {/* Reactive High-End KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-850 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Dispatches</span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-lg text-xs font-bold">
              {numPendingDispatches} orders
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-mono font-black text-slate-800 dark:text-white">{numPendingDispatches}</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">නිකුත් කිරීමට ඇති ඇණවුම්</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-850 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Trips</span>
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-lg text-xs font-bold">
              {activeTripsCount} Active
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-mono font-black text-slate-800 dark:text-white">{activeTripsCount}</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">එදිනට අදාළ චාරිකා</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/100 dark:border-slate-850 shadow-sm flex flex-col justify-between" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(5, 150, 105, 0.04) 100%)" }}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expected COD Cash</span>
            <span className="p-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded">
              <DollarSign size={14} />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-mono font-black text-emerald-600">Rs. {expectedCODCash.toLocaleString()}</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">COD එකතු කිරීම් මුදල්</p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/100 dark:border-slate-850 shadow-sm flex flex-col justify-between" style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(79, 70, 229, 0.04) 100%)" }}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prepaid Value</span>
            <span className="p-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded">
              <CreditCard size={14} />
            </span>
          </div>
          <div className="mt-4">
            <h4 className="text-2xl font-mono font-black text-indigo-600">Rs. {expectedPrepaidTotal.toLocaleString()}</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">පූර්ව ගෙවුම් ඇණවුම් වටිනාකම</p>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left column: Pending Dispatch Queue */}
        <div className="xl:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-850 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                1. Dispatch Control Center ({filteredPendingOrders.length})
              </h2>
              <p className="text-[11px] text-slate-400">ඇණවුම් තෝරා, COD/Prepaid ටැග් එක වෙනස් කර, ප්‍රවාහනයට සූදානම් කරන්න.</p>
            </div>
            
            {/* Quick Status indicators / Multi-selection counter */}
            {selectedOrderIds.length > 0 && (
              <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-blue-100/50">
                ⚡ {selectedOrderIds.length} Selected
              </span>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative col-span-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <Search size={13} />
              </span>
              <input
                type="text"
                placeholder="Search name, order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <Filter size={13} />
              </span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="All">All Audit Statuses</option>
                <option value="Pending Check">Pending Check</option>
                <option value="Approved">Approved</option>
                <option value="High Risk Hold">High Risk Hold</option>
              </select>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <CreditCard size={13} />
              </span>
              <select
                value={paymentFilter}
                onChange={(e: any) => setPaymentFilter(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="All">All Payments (සියලුම)</option>
                <option value="COD">COD Collection</option>
                <option value="Prepaid">Prepaid Orders</option>
              </select>
            </div>
          </div>

          {/* Pending list container */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredPendingOrders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl space-y-1">
                <Package className="mx-auto text-slate-300 dark:text-slate-700 h-8 w-8" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No pending dispatches found</p>
                <p className="text-[10px] text-slate-400">එකතු කිරීමට හෝ නිකුත් කිරීමට ඇණවුම් නොමැත.</p>
              </div>
            ) : (
              filteredPendingOrders.map((order) => {
                const isSelected = selectedOrderIds.includes(order.id);
                const paymentType = getOrderPaymentType(order);
                
                return (
                  <div
                    key={order.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected 
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-400" 
                        : "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 border-slate-200 dark:border-slate-850"
                    }`}
                  >
                    {/* Checkbox selector */}
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOrder(order.id)}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Order Meta details */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                            {order.id}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                            {order.customer.name}
                          </span>
                        </div>

                        {/* Interactive dynamic tags for COD vs Prepaid */}
                        <button
                          type="button"
                          onClick={() => handleTogglePaymentMethod(order.id)}
                          title="Click to toggle payment type"
                          className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full select-none cursor-pointer border flex items-center gap-1.5 transition-all ${
                            paymentType === "COD"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                          }`}
                        >
                          {paymentType === "COD" ? (
                            <>
                              <DollarSign size={10} />
                              Rs. {order.invoice.total.toLocaleString()} COD
                            </>
                          ) : (
                            <>
                              <CreditCard size={10} />
                              PREPAID (LKR {order.invoice.total.toLocaleString()})
                            </>
                          )}
                        </button>
                      </div>

                      {/* City and Courier details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-semibold">
                          <MapPin size={12} className="text-slate-400" />
                          {order.customer.address.city}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Truck size={12} className="text-slate-400" />
                          {order.courier.recommended || "Domex"} (Rs. {order.courier.fee})
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 rounded uppercase ${
                          order.status === "Approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "High Risk Hold"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Active Trips Board */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-850 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                2. Active Courier Trips Board ({trips.length})
              </h2>
              <p className="text-[11px] text-slate-400">එදිනට අදාළ සක්‍රීය චාරිකා සහ ප්‍රවාහන ප්‍රගතිය මෙතනින් අධීක්ෂණය කරන්න.</p>
            </div>
            
            <Activity className="text-blue-500 shrink-0 h-4 w-4 animate-spin" />
          </div>

          {/* Trips list container */}
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            {trips.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl space-y-1">
                <Navigation className="mx-auto text-slate-300 dark:text-slate-700 h-8 w-8" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No active delivery trips</p>
                <p className="text-[10px] text-slate-400">සක්‍රීය ප්‍රවාහන චාරිකා කිසිවක් නැත.</p>
              </div>
            ) : (
              trips.map((trip) => {
                // Calculate trip financial totals
                const tripOrders = orders.filter(o => trip.assignedOrderIds.includes(o.id));
                const tripCODTotal = tripOrders
                  .filter(o => getOrderPaymentType(o) === "COD")
                  .reduce((sum, o) => sum + o.invoice.total, 0);
                  
                const tripPrepaidTotal = tripOrders
                  .filter(o => getOrderPaymentType(o) === "Prepaid")
                  .reduce((sum, o) => sum + o.invoice.total, 0);

                return (
                  <div
                    key={trip.id}
                    className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-3 relative group"
                  >
                    {/* Header: Courier, Code & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                          {trip.tripCode}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-white mt-1">
                          {trip.courierName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <User size={12} />
                          <span>Rider: {trip.riderName}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full select-none ${getTripStatusStyles(trip.status)}`}>
                          {trip.status === "Staging" ? "📦 Staging" : trip.status === "In Transit" ? "🚚 In Transit" : "✅ Completed"}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="h-6 w-6 text-slate-400 hover:text-rose-600 rounded bg-transparent hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove Trip and reset orders"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Meta stats: count, cod collection, prepay */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/60 dark:border-slate-800/60 text-center">
                      <div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Orders</div>
                        <div className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                          {trip.assignedOrderIds.length || tripOrders.length} PKGs
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Trip COD</div>
                        <div className="text-xs font-bold font-mono text-emerald-600">
                          Rs. {tripCODTotal.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-bold text-indigo-650 dark:text-indigo-400 uppercase tracking-widest">Prepaid</div>
                        <div className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          Rs. {tripPrepaidTotal.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Trip progression button toggles */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {trip.status === "Staging" && (
                        <button
                          onClick={() => handleUpdateTripStatus(trip.id, "In Transit")}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          Dispatch Trip ➔
                        </button>
                      )}
                      
                      {trip.status === "In Transit" && (
                        <button
                          onClick={() => handleUpdateTripStatus(trip.id, "Completed")}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <Check size={12} />
                          Arrive & Remit COD Ledger (බෙදාහැරීම අවසන් කරන්න)
                        </button>
                      )}

                      {trip.status === "Completed" && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded">
                          ✓ Remittances Synchronized
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* CREATE DISPATCH TRIP CONFIG MODAL */}
      {showCreateTripModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-blue-400" />
                <h3 className="text-xs uppercase font-extrabold tracking-wider">Configure Active Trip</h3>
              </div>
              <button 
                onClick={() => setShowCreateTripModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTrip} className="p-5 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                  ✓ Dispatching {selectedOrderIds.length} Packages
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">
                  මෙම ඇණවුම් සියල්ල ස්වයංක්‍රීයව 'Dispatched' තත්ත්වයට පරිවර්තනය වන අතර, තෝරාගත් Courier සහ Rider යටතේ සක්‍රීය කෙරේ.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Logistics Courier</label>
                <select
                  value={newTripCourier}
                  onChange={(e) => setNewTripCourier(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="Koombiyo Courier">Koombiyo Courier (කූම්බියෝ)</option>
                  <option value="Domex Courier">Domex Courier (ඩොමෙක්ස්)</option>
                  <option value="Pronto Lanka">Pronto Lanka (ප්‍රොන්ටෝ)</option>
                  <option value="Fardar Express">Fardar Express (ෆාර්ඩර්)</option>
                  <option value="LakNexus Cargo Riders">LakNexus Cargo (අභ්‍යන්තර යතුරුපැදි කරුවන්)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assign Delivery Rider / Driver Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ruwan Kumara / Sahan Perera"
                  required
                  value={newTripRider}
                  onChange={(e) => setNewTripRider(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTripModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Generate Trip 🚚
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
