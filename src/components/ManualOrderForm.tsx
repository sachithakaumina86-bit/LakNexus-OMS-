import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Send, ShoppingCart, User, Phone, MapPin, Truck, AlertTriangle, Printer, Copy, Check, Info, RefreshCw 
} from "lucide-react";
import { ScrapedOrder, OrderItem, CustomerDetails, InventoryItem } from "../types";
import { lookupCity, getStandardizedCourierAddress } from "../cities";

interface ManualOrderFormProps {
  onSaveOrder: (order: ScrapedOrder) => void;
  inventory?: InventoryItem[];
  currentTenantId?: string;
}

export default function ManualOrderForm({ onSaveOrder, inventory = [], currentTenantId = "tenant_colombo_retail" }: ManualOrderFormProps) {
  // Form states
  const [customerName, setCustomerName] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");
  const [courierRecommend, setCourierRecommend] = useState("Koombiyo Logistics");
  const [courierReason, setCourierReason] = useState("Optimized outstation cash collect service matching this district");
  
  // Array of items in the order
  const [orderItems, setOrderItems] = useState<Omit<OrderItem, "id">[]>([
    { name: "", quantity: 1, price: 0, size: "", color: "" }
  ]);

  // Selected product from inventory reference
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");

  // Print & Receipt Layout
  const [copiedFlag, setCopiedFlag] = useState<"58" | "80" | null>(null);
  
  // Custom RTO overrides/auto calculations
  const [rtoRiskScore, setRtoRiskScore] = useState(25);

  const rtoThreshold = Number(localStorage.getItem("laknexus_rto_threshold") || "65");
  const storeName = localStorage.getItem("laknexus_merchant_name") || "LakNexus OMS Demo Store";
  const businessAddress = localStorage.getItem("laknexus_business_address") || "No. 100, High Level Rd, Colombo";
  const businessPhone = localStorage.getItem("laknexus_business_phone") || "011-2345678";
  const businessOwner = localStorage.getItem("laknexus_business_owner") || "";

  // 1. Calculate Province Delivery Fee based on custom merchant configs
  const getSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  };

  const getProvinceFee = () => {
    const wpFee = Number(localStorage.getItem(`laknexus_${currentTenantId}_wp_fee`) || localStorage.getItem("laknexus_wp_fee") || "350");
    const outstationFee = Number(localStorage.getItem(`laknexus_${currentTenantId}_outstation_fee`) || localStorage.getItem("laknexus_outstation_fee") || "450");
    const otherFee = Number(localStorage.getItem(`laknexus_${currentTenantId}_other_fee`) || localStorage.getItem("laknexus_other_fee") || "550");

    const prov = province || "Western";
    if (prov.toLowerCase().includes("western")) return wpFee;
    if (["southern", "central", "sabaragamuwa"].includes(prov.toLowerCase())) return outstationFee;
    return otherFee;
  };

  // 2. City Lookup & Sync
  const handleCityChange = (val: string) => {
    setCity(val);
    const found = lookupCity(val);
    if (found) {
      setDistrict(found.district);
      setProvince(found.province);
      
      // Auto recommend courier based on district
      if (found.province.toLowerCase().includes("western")) {
        setCourierRecommend("Koombiyo Logistics");
        setCourierReason("Fastest Western Province localized network with 24h delivery guarantee");
      } else if (["southern", "central"].includes(found.province.toLowerCase())) {
        setCourierRecommend("Domex Courier");
        setCourierReason("Highest delivery success rate for outstation main cities");
      } else {
        setCourierRecommend("Fardar Express");
        setCourierReason("Reliable service for northern, eastern, and remote region cash collections");
      }

      // Auto-standardize address line if we have an address
      if (addressLine) {
        const std = getStandardizedCourierAddress(addressLine, "", found.city, found.district);
        setAddressLine(std);
      }
    }
  };

  // Trigger address standardization manually
  const triggerStandardizeAddress = () => {
    if (!addressLine) return;
    const std = getStandardizedCourierAddress(addressLine, "", city || "Colombo", district || "Colombo");
    setAddressLine(std);
  };

  // Auto calculate RTO score based on fields
  useEffect(() => {
    let score = 20; // default base
    
    // Low risk cities
    if (city.toLowerCase() === "colombo" || city.toLowerCase() === "kandy" || city.toLowerCase() === "galle") {
      score -= 10;
    }

    // Phone checks
    if (phone1.length < 10) {
      score += 35; // invalid number
    }
    if (!phone2) {
      score += 10; // no fallback number
    }

    // Short address
    if (addressLine.length < 15) {
      score += 25;
    }

    // High risk province
    if (province && !["western", "southern", "central"].includes(province.toLowerCase())) {
      score += 15;
    }

    setRtoRiskScore(Math.min(100, Math.max(10, score)));
  }, [phone1, phone2, addressLine, city, province]);

  // Insert product from inventory
  const handleInventorySelect = (id: string) => {
    setSelectedInventoryId(id);
    if (!id) return;
    const item = inventory.find(i => i.id === id);
    if (item) {
      // Add or fill into the first empty product line
      const emptyIdx = orderItems.findIndex(oi => !oi.name);
      if (emptyIdx !== -1) {
        const updated = [...orderItems];
        updated[emptyIdx] = {
          name: item.name,
          price: item.price,
          quantity: 1,
          size: "",
          color: ""
        };
        setOrderItems(updated);
      } else {
        setOrderItems([...orderItems, {
          name: item.name,
          price: item.price,
          quantity: 1,
          size: "",
          color: ""
        }]);
      }
    }
  };

  const addItemRow = () => {
    setOrderItems([...orderItems, { name: "", quantity: 1, price: 0, size: "", color: "" }]);
  };

  const removeItemRow = (idx: number) => {
    if (orderItems.length === 1) {
      setOrderItems([{ name: "", quantity: 1, price: 0, size: "", color: "" }]);
    } else {
      setOrderItems(orderItems.filter((_, i) => i !== idx));
    }
  };

  const updateItemRow = (idx: number, field: keyof Omit<OrderItem, "id">, value: any) => {
    const updated = [...orderItems];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    };
    setOrderItems(updated);
  };

  // 3. Print receipt format generator
  const generateThermalBill = (widthMm: 58 | 80) => {
    const w = widthMm === 58 ? 32 : 48;
    const divider = "-".repeat(w);
    const dblDivider = "=".repeat(w);
    const sub = getSubtotal();
    const fee = getProvinceFee();
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

    const wrapAndIndent = (label: string, value: string, specWidth: number, indentLen: number): string[] => {
      const indent = " ".repeat(indentLen);
      const valLimit = specWidth - indentLen;
      if (valLimit <= 0) {
        return [`${label}${value}`];
      }
      
      const words = value.split(" ");
      const valLines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        if (!word) continue;
        if (currentLine.length === 0) {
          if (word.length > valLimit) {
            let tempWord = word;
            while (tempWord.length > valLimit) {
              valLines.push(tempWord.substring(0, valLimit));
              tempWord = tempWord.substring(valLimit);
            }
            currentLine = tempWord;
          } else {
            currentLine = word;
          }
        } else {
          if (currentLine.length + 1 + word.length <= valLimit) {
            currentLine += " " + word;
          } else {
            valLines.push(currentLine);
            if (word.length > valLimit) {
              let tempWord = word;
              while (tempWord.length > valLimit) {
                valLines.push(tempWord.substring(0, valLimit));
                tempWord = tempWord.substring(valLimit);
              }
              currentLine = tempWord;
            } else {
              currentLine = word;
            }
          }
        }
      }
      if (currentLine) {
        valLines.push(currentLine);
      }

      if (valLines.length === 0) {
        return [`${label}`];
      }

      const result: string[] = [];
      result.push(`${label}${valLines[0]}`);
      for (let i = 1; i < valLines.length; i++) {
        result.push(`${indent}${valLines[i]}`);
      }
      return result;
    };

    const centerWrapped = (text: string): string[] => {
      if (text.length <= w) return [center(text)];
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";
      for (const word of words) {
        if (!word) continue;
        if (currentLine.length === 0) {
          if (word.length > w) {
            let temp = word;
            while (temp.length > w) {
              lines.push(temp.substring(0, w));
              temp = temp.substring(w);
            }
            currentLine = temp;
          } else {
            currentLine = word;
          }
        } else {
          if (currentLine.length + 1 + word.length <= w) {
            currentLine += " " + word;
          } else {
            lines.push(currentLine);
            if (word.length > w) {
              let temp = word;
              while (temp.length > w) {
                lines.push(temp.substring(0, w));
                temp = temp.substring(w);
              }
              currentLine = temp;
            } else {
              currentLine = word;
            }
          }
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines.map(line => center(line));
    };

    const wrapField = (label: string, value: string): string[] => {
      return wrapAndIndent(label, value, w, label.length);
    };

    const lines = [
      ...centerWrapped(storeName.toUpperCase()),
      ...centerWrapped(businessAddress),
      center(`Tel: ${businessPhone}`),
      businessOwner ? center(`Manager: ${businessOwner}`) : null,
      divider,
      center("** MANUAL POS RECEIPT **"),
      divider,
      `Date   : ${formattedDate}`,
      ...wrapField("Bill To: ", customerName || "Walk-In Customer"),
      ...wrapField("Phone  : ", phone1 || "N/A"),
      ...(phone2 ? wrapField("Phone 2: ", phone2) : []),
      ...wrapField("Addr   : ", addressLine || "Store Pickup"),
      ...wrapField("City   : ", city || "Colombo"),
      divider,
      center("ITEM NAME       QTY     PRICE"),
      divider,
      ...orderItems.map((it) => {
        const itemLine = `${it.name || "Custom Product"}`;
        const qtyPrice = `${it.quantity} x Rs.${it.price}`;
        return justify(itemLine, qtyPrice);
      }),
      divider,
      justify("SUBTOTAL", `Rs. ${sub.toLocaleString()}`),
      justify("DELIVERY", `Rs. ${fee.toLocaleString()}`),
      center(`(${courierRecommend})`),
      dblDivider,
      justify("GRAND TOTAL", `Rs. ${tot.toLocaleString()}`),
      dblDivider,
      center("THANK YOU!"),
      center("Powered by LakNexus OMS"),
      divider
    ].filter((line) => line !== null && line !== undefined && line !== "");

    return lines.join("\n");
  };

  const copyToClipboard = (text: string, type: "58" | "80") => {
    navigator.clipboard.writeText(text);
    setCopiedFlag(type);
    setTimeout(() => setCopiedFlag(null), 1800);
  };

  const handlePrintWindow = () => {
    const printContent = generateThermalBill(58);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker prevented printing. Please allow popups for LakNexus!");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>POS Receipt - ${storeName}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 58mm;
              margin: 0;
              padding: 10px;
              font-size: 11px;
              color: #000;
              background: #fff;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              margin: 0;
            }
            @media print {
              body {
                width: 58mm;
                padding: 0;
              }
              @page {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <pre>${printContent}</pre>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Create final order and dispatch
  const handleSaveManualOrder = (status: "Approved" | "High Risk Hold") => {
    if (!customerName || !phone1) {
      alert("Please fill in Customer Name and Mobile Phone 1 at minimum.");
      return;
    }

    const sub = getSubtotal();
    const fee = getProvinceFee();
    const tot = sub + fee;

    const finalOrder: ScrapedOrder = {
      id: "LN-" + Math.floor(100000 + Math.random() * 900000),
      customer: {
        name: customerName,
        phone1: phone1,
        phone2: phone2 || undefined,
        address: {
          line1: addressLine || "Store Pickup",
          line2: "",
          city: city || "Colombo",
          district: district || "Colombo",
          province: province || "Western"
        }
      },
      items: orderItems.map((it, i) => ({
        id: String(i),
        name: it.name || "General Product",
        quantity: Number(it.quantity),
        price: Number(it.price),
        size: it.size || undefined,
        color: it.color || undefined
      })),
      rtoRisk: {
        score: rtoRiskScore,
        level: rtoRiskScore >= 75 ? "CRITICAL" : rtoRiskScore >= 55 ? "HIGH" : "LOW",
        warningSinhala: rtoRiskScore >= rtoThreshold 
          ? "RTO අවදානම අධිකය - දුරකථන අංක පරීක්ෂා කරන්න" 
          : "ප්‍රමාණවත් ලිපින සහ දුරකථන විස්තර ලැබී ඇත. ආරක්ෂිතයි.",
        warningEnglish: rtoRiskScore >= rtoThreshold 
          ? "High return probability risk due to phone/address length attributes" 
          : "Stable delivery attributes matching destination courier profiles",
        reasons: rtoRiskScore >= rtoThreshold ? ["Short Address Line", "No Fallback Mobile", "High Risk Province zone"] : []
      },
      courier: {
        recommended: courierRecommend,
        fee: fee,
        reason: courierReason,
        ratesSummary: `Rs. ${fee} cash collection handling`
      },
      invoice: {
        subtotal: sub,
        deliveryFee: fee,
        total: tot,
        thermalLayout58: generateThermalBill(58),
        thermalLayout80: generateThermalBill(80)
      },
      createdAt: new Date().toLocaleDateString("si-LK") + " " + new Date().toLocaleTimeString("si-LK"),
      rawInput: "Manual Hand-Keyed Merchant In-store Entry",
      status
    };

    onSaveOrder(finalOrder);

    // Reset Form
    setCustomerName("");
    setPhone1("");
    setPhone2("");
    setAddressLine("");
    setCity("");
    setDistrict("");
    setProvince("");
    setOrderItems([{ name: "", quantity: 1, price: 0, size: "", color: "" }]);
    setSelectedInventoryId("");
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
      
      {/* Header section with brand accent */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white">
              <ShoppingCart size={18} />
            </span>
            <div>
              <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                Order Management - Manual Order Entry
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                ඇණවුම් කළමනාකරණය - අතින් නව ඇණවුමක් සෘජුවම ඇතුළත් කිරීම සහ මුද්‍රණය
              </p>
            </div>
          </div>
        </div>

        {/* Inventory Item Quick Loader */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase whitespace-nowrap">Load Stock Product:</span>
          <select
            id="manual-inventory-selector"
            value={selectedInventoryId}
            onChange={(e) => handleInventorySelect(e.target.value)}
            className="text-xs p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none max-w-[200px]"
          >
            <option value="">-- select product --</option>
            {inventory.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} (Rs.{item.price} - Stock: {item.stock})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Entry state column */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Customer profile cards */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <User size={13} className="text-blue-500" /> Customer Information (පාරිභෝගික විස්තර)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name *</label>
                <input 
                  type="text"
                  id="manual-customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Insert Name"
                  className="w-full text-xs p-3 bg-slate-950 border border-slate-850 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-white font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Mobile Phone 1 *</label>
                <input 
                  type="text"
                  id="manual-customer-phone1"
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                  placeholder="077xxxxxxx"
                  className="w-full text-xs p-3 bg-slate-950 border border-slate-850 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-white font-black font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono">Fallback Phone 2</label>
                <input 
                  type="text"
                  id="manual-customer-phone2"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  placeholder="Optional extra mobile"
                  className="w-full text-xs p-3 bg-slate-950 border border-slate-850 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-white font-bold font-mono"
                />
              </div>
            </div>
          </div>

          {/* Shipping addresses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <MapPin size={13} className="text-emerald-500" /> Shipping & Delivery Address (ලිපිනය)
              </h3>
              <button 
                type="button"
                id="manual-standardize-address-btn"
                onClick={triggerStandardizeAddress}
                className="text-[9px] font-extrabold text-cyan-400 hover:text-cyan-300 transition-all uppercase flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-850 cursor-pointer"
              >
                <RefreshCw size={10} /> Standardize Address
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Registered Courier Address Line</label>
              <input 
                type="text"
                id="manual-customer-address"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="No/Name, Street name, Village (අදාල ලිපිනය පමණක් යොදන්න)"
                className="w-full text-xs p-3 bg-slate-950 border border-slate-850 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">City / Town</label>
                <input 
                  type="text"
                  id="manual-customer-city"
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  placeholder="e.g. Galle"
                  className="w-full text-xs p-3 bg-slate-950 border border-slate-850 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">District</label>
                <input 
                  type="text"
                  id="manual-customer-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="District"
                  className="w-full text-xs p-3 bg-slate-950 border border-slate-850 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-slate-400 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Province</label>
                <input 
                  type="text"
                  id="manual-customer-province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Province"
                  className="w-full text-xs p-3 bg-slate-950 border border-slate-850 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-slate-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Sub Items additions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <ShoppingCart size={13} className="text-amber-500" /> Order Items & SKU List (භාණ්ඩ ලැයිස්තුව)
              </h3>
              <button
                type="button"
                id="manual-add-item-row-btn"
                onClick={addItemRow}
                className="text-[9px] font-extrabold text-blue-400 hover:text-blue-300 transition-all uppercase flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-slate-850 cursor-pointer"
              >
                <Plus size={10} /> Add Item Row
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850 relative group">
                  
                  {/* Name field */}
                  <div className="md:col-span-5 space-y-1">
                    <input 
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItemRow(index, "name", e.target.value)}
                      placeholder="Item Name or SKU label"
                      className="w-full text-[11px] p-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2 space-y-1">
                    <input 
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItemRow(index, "quantity", Math.max(1, Number(e.target.value) || 1))}
                      placeholder="Qty"
                      className="w-full text-[11px] p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-center font-bold"
                    />
                  </div>

                  {/* Price */}
                  <div className="md:col-span-2 space-y-1">
                    <input 
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(e) => updateItemRow(index, "price", Math.max(0, Number(e.target.value) || 0))}
                      placeholder="Price"
                      className="w-full text-[11px] p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold"
                    />
                  </div>

                  {/* Size */}
                  <div className="md:col-span-1 space-y-1">
                    <input 
                      type="text"
                      value={item.size || ""}
                      onChange={(e) => updateItemRow(index, "size", e.target.value)}
                      placeholder="L"
                      className="w-full text-[11px] p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-center uppercase"
                    />
                  </div>

                  {/* Color */}
                  <div className="md:col-span-1 space-y-1">
                    <input 
                      type="text"
                      value={item.color || ""}
                      onChange={(e) => updateItemRow(index, "color", e.target.value)}
                      placeholder="Color"
                      className="w-full text-[11px] p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-center"
                    />
                  </div>

                  {/* Delete button */}
                  <div className="md:col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Courier Recommendation Config */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                <Truck size={12} className="text-blue-400" /> Dispatch Carrier Route (කුරියර් ආයතනය)
              </label>
              <select
                id="manual-courier-recommend"
                value={courierRecommend}
                onChange={(e) => setCourierRecommend(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-250 font-bold focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="Koombiyo Logistics">Koombiyo Logistics</option>
                <option value="Domex Courier">Domex Courier</option>
                <option value="Fardar Express">Fardar Express</option>
                <option value="Pronto Lanka">Pronto Lanka</option>
                <option value="CityPak Delivery">CityPak Delivery</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Courier Dispatch Strategy</label>
              <textarea 
                value={courierReason}
                onChange={(e) => setCourierReason(e.target.value)}
                className="w-full text-[10px] p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 focus:ring-1 focus:ring-blue-500 outline-none h-14"
              />
            </div>
          </div>

        </div>

        {/* Right Output Panel: Printable Invoice Preview and Actions */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          
          {/* Real-time calculated bill widget */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <span className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-1">
                <Printer size={13} className="text-blue-400" /> POS Preview & Thermal Outputs
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="print-pos-invoice"
                  onClick={handlePrintWindow}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold uppercase rounded-lg transition-all cursor-pointer"
                >
                  <Printer size={10} /> Print Receipt
                </button>
              </div>
            </div>

            {/* Simulated Live Ticket Output preview */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-slate-400">
                <div>Subtotal: <span className="text-white font-black font-mono">Rs. {getSubtotal().toLocaleString()}</span></div>
                <div>Delivery Fee: <span className="text-white font-black font-mono">Rs. {getProvinceFee().toLocaleString()}</span></div>
              </div>

              <div className="border border-slate-800/80 rounded-xl p-3 bg-slate-900 flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase font-black text-slate-400 select-none">Live Return Risk Predictor</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${rtoRiskScore >= rtoThreshold ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                    <span className={`text-[10px] font-black ${rtoRiskScore >= rtoThreshold ? "text-rose-400" : "text-emerald-400"}`}>
                      {rtoRiskScore >= rtoThreshold ? "Risk Alert Hold Recommended" : "Pass Zone Stable"}
                    </span>
                  </div>
                </div>
                <div className={`p-2 rounded-lg font-black text-xs ${rtoRiskScore >= rtoThreshold ? "bg-rose-950/40 text-rose-400" : "bg-emerald-950/40 text-emerald-400"}`}>
                  {rtoRiskScore}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">58mm Thermal Receipt</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generateThermalBill(58), "58")}
                      className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold align-middle bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 transition-all cursor-pointer"
                    >
                      {copiedFlag === "58" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="text-[9px] font-mono whitespace-pre text-slate-400 bg-slate-900 p-2 rounded-xl border border-slate-850 h-36 overflow-y-auto">
                    {generateThermalBill(58)}
                  </pre>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">80mm Wide Receipt</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generateThermalBill(80), "80")}
                      className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold align-middle bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 transition-all cursor-pointer"
                    >
                      {copiedFlag === "80" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="text-[9px] font-mono whitespace-pre text-slate-400 bg-slate-900 p-2 rounded-xl border border-slate-850 h-36 overflow-y-auto">
                    {generateThermalBill(80)}
                  </pre>
                </div>
              </div>

            </div>

          </div>

          {/* Quick action triggers */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="manual-hold-risk-btn"
                onClick={() => handleSaveManualOrder("High Risk Hold")}
                className="py-2.5 border border-amber-800 text-amber-500 hover:bg-amber-950/20 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Save as Risk Hold (රඳවා ගන්න)
              </button>
              
              <button
                type="button"
                id="manual-save-approved-btn"
                onClick={() => handleSaveManualOrder("Approved")}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                GENERATE & BOOK ORDER
              </button>
            </div>
            <p className="text-[9px] text-slate-500 font-medium text-center">
              * Click "GENERATE & BOOK ORDER" to instantly parse this order, push to courier database api schedules, reduce inventory, and redirect.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
