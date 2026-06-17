import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Calendar, ChevronDown, Trash2, Printer, MapPin, Phone, User, Check, Box, Download } from "lucide-react";
import { ScrapedOrder } from "../types";

// High-fidelity Sri Lankan Dual-language POS Thermal Bill Generator
const generateThermalReceipt = (order: ScrapedOrder, widthMm: 58 | 80) => {
  const w = widthMm === 58 ? 32 : 48;
  const divider = "-".repeat(w);
  const dblDivider = "=".repeat(w);

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

  // Safe Colombo timeZone string format
  const billDate = order.createdAt || new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });

  const merchantName = localStorage.getItem("laknexus_merchant_name") || "LAKNEXUS OMS DEMO STORE";
  const businessAddress = localStorage.getItem("laknexus_business_address") || "No. 100, High Level Rd, Colombo";
  const businessPhone = localStorage.getItem("laknexus_business_phone") || "011-2345678";
  const businessOwner = localStorage.getItem("laknexus_business_owner") || "";

  const lines = [
    center(merchantName.toUpperCase()),
    center(businessAddress),
    center(`Tel: ${businessPhone}`),
    businessOwner ? center(`Manager: ${businessOwner}`) : null,
    divider,
    center("** POS RECEIPT **"),
    divider,
    `ORDER ID : ${order.id}`,
    `DATE     : ${billDate}`,
    divider,
    "පාරිභෝගික විස්තර:",
    `නම       : ${order.customer.name}`,
    `දුරකථන   : ${order.customer.phone1}`,
    order.customer.phone2 ? `අතිරේක   : ${order.customer.phone2}` : "",
    `ලිපිනය   : ${order.customer.address.line1}`,
    order.customer.address.line2 ? `             ${order.customer.address.line2}` : "",
    `නගරය     : ${order.customer.address.city} (${order.customer.address.district} Dist)`,
    divider,
    "ITEMS:",
    divider,
    ...order.items.flatMap((it) => {
      const specs = [it.size, it.color].filter(Boolean).join("/");
      const specStr = specs ? ` (${specs})` : "";
      const itemHeader = `* ${it.name}${specStr}`;
      const itemCalculation = `  ${it.quantity} x Rs. ${Number(it.price).toLocaleString()}`;
      const itemCost = `Rs. ${(it.quantity * it.price).toLocaleString()}`;
      return [itemHeader, justify(itemCalculation, itemCost)];
    }),
    divider,
    justify("SUBTOTAL", `Rs. ${order.invoice.subtotal.toLocaleString()}`),
    justify("DELIVERY", `Rs. ${order.invoice.deliveryFee.toLocaleString()}`),
    center(`(${order.courier.recommended || "Koombiyo Delivery"})`),
    dblDivider,
    justify("GRAND TOTAL", `Rs. ${order.invoice.total.toLocaleString()}`),
    dblDivider,
    center("THANK YOU!"),
    center("Powered by LakNexus OMS AI"),
    divider
  ].filter((line) => line !== null && line !== undefined && line !== "");

  return lines.join("\n");
};

interface ActiveOrdersProps {
  orders: ScrapedOrder[];
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, status: ScrapedOrder["status"]) => void;
}

export default function ActiveOrders({
  orders,
  onDeleteOrder,
  onUpdateStatus,
}: ActiveOrdersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Print state controls
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<ScrapedOrder | null>(null);
  const [selectedReceiptWidth, setSelectedReceiptWidth] = useState<58 | 80>(58);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone1.includes(searchQuery) ||
      order.customer.address.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "ALL") return matchesSearch;
    return order.status === filterStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    // Columns list for courier booking & accounting
    const headers = [
      "Order ID",
      "Customer Name",
      "Phone 1",
      "Phone 2",
      "Address Line 1",
      "Address Line 2",
      "City",
      "District",
      "Province",
      "Items Summary",
      "Subtotal (LKR)",
      "Delivery Fee (LKR)",
      "Total COD Amount (LKR)",
      "Order Status",
      "RTO Risk Score (%)",
      "Recommended Courier",
      "Created At"
    ];

    const escapeCSV = (val: string | number) => {
      const strVal = val === null || val === undefined ? "" : String(val);
      if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n") || strVal.includes("\r")) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    };

    const rows = filteredOrders.map((order) => {
      const itemsText = order.items
        .map((it) => `${it.name} (Qty:${it.quantity})`)
        .join("; ");
      
      return [
        order.id,
        order.customer.name,
        order.customer.phone1,
        order.customer.phone2 || "",
        order.customer.address.line1,
        order.customer.address.line2 || "",
        order.customer.address.city,
        order.customer.address.district,
        order.customer.address.province,
        itemsText,
        order.invoice.subtotal,
        order.invoice.deliveryFee,
        order.invoice.total,
        order.status,
        order.rtoRisk.score,
        order.courier.recommended,
        order.createdAt
      ].map(escapeCSV);
    });

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    // Add UTF-8 BOM to survive local Excel parsing perfectly
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `LakNexus_Dispatches_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            LakNexus Active Orders
          </h3>
          <p className="text-xs text-slate-400">
            Review scraped items, manage COD distribution status, and print thermal slips
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Export to CSV trigger */}
          <button
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100 disabled:opacity-50 disabled:hover:bg-blue-50/50 disabled:cursor-not-allowed font-bold text-xs text-blue-700 transition-all flex items-center justify-center gap-1.5"
            title="Export filtered dispatches as CSV file"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, phone or city..."
              className="w-full sm:w-60 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2.5 top-2.5 text-slate-400 size-3.5" />
          </div>

          {/* Status filter dropdown */}
          <select
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 text-slate-600 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Check">Pending Check</option>
            <option value="Approved">Approved</option>
            <option value="High Risk Hold">High Risk Hold</option>
            <option value="Dispatched">Dispatched</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
          <Box className="mx-auto text-slate-300 size-10 mb-2" />
          <p className="text-sm font-semibold text-slate-600">No active orders match your selection</p>
          <p className="text-xs text-slate-400 mt-1">
            Feed noisy raw conversational chats into the LakNexus parser to generate active dispatches!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                id={`active-order-item-${order.id}`}
                key={order.id}
                className="p-4 bg-white hover:bg-slate-50/50 rounded-xl border border-slate-200/80 shadow-sm transition-all"
              >
                {/* Header Summary Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs mt-0.5 select-none shrink-0 border border-blue-100/50">
                      {order.id}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">
                          {order.customer.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded select-none ${
                          order.status === "Approved" 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                            : order.status === "High Risk Hold" 
                            ? "bg-amber-50 text-amber-600 border border-amber-200" 
                            : order.status === "Dispatched"
                            ? "bg-slate-900 text-white"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {order.customer.address.city}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={12} className="text-slate-400" />
                          {order.customer.phone1}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar size={12} />
                          {order.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total bill</span>
                      <span className="font-extrabold text-slate-800 text-sm">
                        Rs. {order.invoice.total.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        id={`update-status-select-${order.id}`}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 focus:outline-none"
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value as any)}
                      >
                        <option value="Pending Check">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="High Risk Hold">Hold (RTO)</option>
                        <option value="Dispatched">Dispatched</option>
                      </select>

                      <button
                        id={`print-thermal-btn-${order.id}`}
                        onClick={() => {
                          setActiveReceiptOrder(order);
                          setSelectedReceiptWidth(58);
                        }}
                        className="p-1 px-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-200"
                        title="Print POS Thermal Bill / Generate Invoice"
                      >
                        <Printer size={13} />
                      </button>

                      <button
                        id={`delete-order-btn-${order.id}`}
                        onClick={() => onDeleteOrder(order.id)}
                        className="p-1 px-1.5 text-slate-400 hover:text-rose-600 transition-all rounded hover:bg-rose-50"
                      >
                        <Trash2 size={13} />
                      </button>

                      <button
                        id={`toggle-expand-btn-${order.id}`}
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all border border-slate-200"
                      >
                        <ChevronDown className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details Panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-4 pt-4 border-t border-slate-100"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
                        {/* Address Details */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider text-[10px] border-b pb-1">
                            <User size={12} className="text-blue-500" /> Dispatch Details
                          </h4>
                          <div>
                            <p className="font-semibold text-slate-800">{order.customer.name}</p>
                            <p className="text-slate-500 font-mono">{order.customer.phone1} {order.customer.phone2 ? `/ ${order.customer.phone2}` : ""}</p>
                            <p className="text-slate-500 mt-1">{order.customer.address.line1}</p>
                            {order.customer.address.line2 && <p className="text-slate-500">{order.customer.address.line2}</p>}
                            <p className="font-bold text-slate-700 mt-0.5">{order.customer.address.city}, {order.customer.address.district} District ({order.customer.address.province} Province)</p>
                          </div>
                        </div>

                        {/* Order Items Table */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider text-[10px] border-b pb-1">
                            <Box size={12} className="text-blue-500" /> Cart Contents
                          </h4>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                            {order.items.map((item, id) => (
                              <div key={id} className="flex justify-between items-center text-slate-600">
                                <span className="font-medium">
                                  {item.name} {(item.size || item.color) ? `(${[item.size, item.color].filter(Boolean).join("/")})` : ""}
                                </span>
                                <span className="font-bold">
                                  {item.quantity} x Rs. {Number(item.price).toLocaleString()}
                                </span>
                              </div>
                            ))}
                            <div className="border-t border-slate-200/50 pt-1.5 mt-1 text-[10px] space-y-0.5">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Subtotal:</span>
                                <span>Rs. {order.invoice.subtotal.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Delivery ({order.courier.recommended}):</span>
                                <span>Rs. {order.invoice.deliveryFee.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between font-bold text-slate-850">
                                <span>Final Total:</span>
                                <span>Rs. {order.invoice.total.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RTO Risk Analyzer Status */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] border-b pb-1">
                            AI RTO Scorecard & Logistics
                          </h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-500">Predictive Score:</span>
                              <span className={`px-2 py-0.5 rounded font-bold font-mono text-xs ${order.rtoRisk.score > 65 ? "bg-amber-50 border border-amber-200 text-amber-700 status-glow-amber" : "bg-emerald-50 text-emerald-700 border border-emerald-200 status-glow-green"}`}>
                                {order.rtoRisk.score}%
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1 font-semibold">{order.rtoRisk.warningSinhala}</p>
                            
                            {/* Courier booking instructions */}
                            <div className="mt-2 p-2 bg-blue-50/40 border border-blue-100 rounded text-[10px] text-slate-600">
                              <span className="font-bold text-slate-800">Suggested Courier payload:</span>
                              <pre className="font-mono mt-1 text-[9px] text-slate-500 bg-white p-1 rounded overflow-x-auto border border-slate-100">
{`{
  "courier": "${order.courier.recommended}",
  "cod_amount": ${order.invoice.total},
  "destination": "${order.customer.address.city}",
  "recipient": "${order.customer.name}"
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* POS 58mm / 80mm Thermal Paper Receipt Modal Previewer */}
      <AnimatePresence>
        {activeReceiptOrder && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="text-blue-600 size-5" />
                  <span className="font-bold text-sm text-slate-800">POS Print Dispatch Receipt</span>
                </div>
                <button
                  onClick={() => {
                    setActiveReceiptOrder(null);
                    setCopiedReceipt(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 text-xs font-bold transition-all px-2.5"
                >
                  Close
                </button>
              </div>

              {/* Controls (Toggle width) */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                  <button
                    onClick={() => setSelectedReceiptWidth(58)}
                    className={`px-3 py-1 text-xs font-bold rounded ${selectedReceiptWidth === 58 ? "bg-slate-900 text-white" : "text-slate-650 hover:bg-slate-100"}`}
                  >
                    58mm
                  </button>
                  <button
                    onClick={() => setSelectedReceiptWidth(80)}
                    className={`px-3 py-1 text-xs font-bold rounded ${selectedReceiptWidth === 80 ? "bg-slate-900 text-white" : "text-slate-650 hover:bg-slate-100"}`}
                  >
                    80mm
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateThermalReceipt(activeReceiptOrder, selectedReceiptWidth));
                      setCopiedReceipt(true);
                      setTimeout(() => setCopiedReceipt(false), 1800);
                    }}
                    className="p-1 px-2.5 bg-white border border-slate-300 hover:border-slate-400 font-bold text-[11px] rounded flex items-center gap-1.5 transition-all text-slate-700 shadow-sm"
                  >
                    {copiedReceipt ? <Check size={11} className="text-emerald-600" /> : <Box size={11} />}
                    {copiedReceipt ? "Copied!" : "Copy Text"}
                  </button>

                  <button
                    onClick={() => {
                      // Custom print window
                      const printArea = document.getElementById("thermal-print-area");
                      if (!printArea) return;
                      const printWindow = window.open("", "_blank", "width=400,height=600");
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>PRINT POS RECEIPT - ${activeReceiptOrder.id}</title>
                              <style>
                                @page { size: auto; margin: 0; }
                                body {
                                  font-family: monospace;
                                  font-size: 11.5px;
                                  line-height: 1.3;
                                  margin: 12px;
                                  white-space: pre-wrap;
                                  background: white;
                                  color: black;
                                }
                              </style>
                            </head>
                            <body onload="window.print(); window.close();">${printArea.innerText.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;")}</body>
                          </html>
                        `);
                        printWindow.document.close();
                      }
                    }}
                    className="p-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Printer size={11} />
                    <span>Print Bill</span>
                  </button>
                </div>
              </div>

              {/* Realistic POS Thermal paper preview area */}
              <div className="p-6 bg-slate-800 flex items-center justify-center max-h-[460px] overflow-y-auto">
                <div 
                  className="thermal-preview-container bg-white p-6 shadow-xl border-t-8 border-slate-350 relative select-all filter drop-shadow-md mx-auto"
                  style={{ width: selectedReceiptWidth === 58 ? "240px" : "330px" }}
                >
                  {/* Decorative serrated paper edges bottom layout */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-[radial-gradient(circle,transparent_20%,#0000000a_20%,#0000000a_40%,transparent_40%)] bg-[length:8px_8px] -translate-y-2 select-none" />
                  
                  {/* Actual POS Terminal Printed Text Output */}
                  <pre 
                    id="thermal-print-area"
                    className="text-[10px] font-mono whitespace-pre text-slate-800 leading-normal"
                    style={{ 
                      fontSize: selectedReceiptWidth === 58 ? "9px" : "11px",
                      wordBreak: "break-all"
                    }}
                  >
                    {generateThermalReceipt(activeReceiptOrder, selectedReceiptWidth)}
                  </pre>

                  {/* Decorative serrated paper edges bottom layout */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-[radial-gradient(circle,transparent_20%,#ffffff_20%,#ffffff_40%,transparent_40%)] bg-[length:6px_4px] translate-y-1 select-none" />
                </div>
              </div>

              {/* Informative footer info banner */}
              <div className="p-3 bg-white border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium select-none flex justify-center items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span>Compatible with standard Sri Lankan 58mm & 80mm thermal printers</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
