import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { lookupCity, SRI_LANKAN_CITIES, getStandardizedCourierAddress } from "./src/cities.js";
import { enterpriseRouter } from "./server/enterprise-routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/api/enterprise", enterpriseRouter);

// Initialize Gemini safely
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fallback to client-side heuristics.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Health check API
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", keyAvailable: !!process.env.GEMINI_API_KEY });
});

// 2. Fetch all Sri Lankan cities
app.get("/api/cities", (req, res) => {
  res.json(SRI_LANKAN_CITIES);
});

// 3. Process Messy Text Order API using Gemini
app.post("/api/process-order", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid text input" });
  }

  // Fallback parsed response in case Gemini fails/is not configured
  const mockFallbackResponse = (rawInputText: string) => {
    // Basic local scraper regex as fallback
    const names = ["Kamal Perera", "Amal Silva", "Nimal Fernando", "Saman Bandara", "Priyantha Jayakody"];
    const nameMatch = rawInputText.match(/(?:මම|නම|නම\s*:\s*|kamal|priyantha|amal|nimal|saman)\s*([A-Za-z\u0D80-\u0DFF]+(?:\s+[A-Za-z\u0D80-\u0DFF]+)*)/i) || 
                      rawInputText.match(/^([A-Za-z\u0D80-\u0DFF]+(?:\s+[A-Za-z\u0D80-\u0DFF]+){1,3})/);
    const resolvedName = nameMatch ? nameMatch[1].trim() : "Sri Lankan Customer";

    // Extract potential Sri Lankan numbers (07XXXXXXXX, 10-digit)
    const phoneMatches = rawInputText.match(/(?:07\d{8}|\+94\d{9})/g) || [];
    const phone1 = phoneMatches[0] || "";
    const phone2 = phoneMatches[1] || "";

    // City and district detection
    let detectedCity = "Colombo";
    let detectedDistrict = "Colombo";
    let detectedProvince = "Western";

    for (const item of SRI_LANKAN_CITIES) {
      const cityRegex = new RegExp(`\\b${item.city}\\b|${item.city}`, "i");
      if (cityRegex.test(rawInputText)) {
        detectedCity = item.city;
        detectedDistrict = item.district;
        detectedProvince = item.province;
        break;
      }
    }

    const rawL1 = rawInputText.split(/[\n,]/)[1]?.trim() || "";
    const rawL2 = rawInputText.split(/[\n,]/)[2]?.trim() || "";
    const stdAddress = getStandardizedCourierAddress(rawL1, rawL2, detectedCity, detectedDistrict);

    return {
      customerName: resolvedName,
      phone1,
      phone2,
      addressLine1: stdAddress,
      addressLine2: "",
      city: detectedCity,
      district: detectedDistrict,
      province: detectedProvince,
      items: [
        {
          name: "Standard Sri Lankan Product",
          quantity: 1,
          price: 1500,
          size: "M",
          color: "Default"
        }
      ],
      rtoRiskScore: phone1 ? 40 : 85,
      rtoRiskReasons: phone1 ? ["Standard automatic checkout"] : ["Missing vital contact phone status"],
      courierRecommended: "Koombiyo",
      courierReason: "Default standard recommendation for Southern/Western regions",
      rtoWarningEnglish: phone1 ? "Secure order, ready to dispatch." : "Critical RTO risk: Missing phone contact. Ask for advance payment!",
      rtoWarningSinhala: phone1 ? "ආරක්ෂිත ඇණවුමක්, යැවීමට සූදානම්." : "බරපතල RTO අවදානම: දුරකථන අංකය ඇතුලත් කර නැත. අත්තිකාරම් මුදලක් ලබාගන්න!"
    };
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return beautiful fallback processed order immediately if key is missing
      const fallback = mockFallbackResponse(text);
      return res.json({ success: true, method: "fallback-heuristics", data: fallback });
    }

    const ai = getAiClient();
    const systemInstruction = `
      You are LakNexus AI, the core data scraping intelligence engine for LakNexus OMS (Sri Lanka's ultimate Order Management System).
      Your job is to read messy conversational transcripts, WhatsApp messages, social media order details, or speech transcripts (written in pure Sinhala script, Singlish, or English) from Sri Lankan e-commerce buyers.
      
      Extract and parse the text into a clean, structured JSON order layout.
      
      You must perform these steps:
      1. Cleanly parse Customer Name.
      2. Extract Phone Number 1 and Phone Number 2 if present. Format them cleanly as 10-digit Sri Lankan phone numbers (e.g., 077XXXXXXXX).
      3. Extract Address Lines and crucially identify the "City".
      4. Auto-detect the Sri Lankan District and Province based on the City.
         * Important Sri Lankan city lookup clues:
           - Unawatuna -> District: Galle, Province: Southern
           - Pohorabawa or Eheliyagoda -> District: Ratnapura, Province: Sabaragamuwa
           - Gampola or Peradeniya -> District: Kandy, Province: Central
           - Weligama or Mirissa -> District: Matara, Province: Southern
           - Negombo, Gampaha -> District: Gampaha, Province: Western
           - Panadura, Horana -> District: Kalutara, Province: Western
           - Kuliyapitiya -> District: Kurunegala, Province: North Western
           - Bandarawela, Ella -> District: Badulla, Province: Uva
      5. Identify ordered items. Extract: Product Name, Weight/Size variation (S, M, L, XL, etc.), Color variation, Quantity, and estimated Unit Price (if mentioned or if empty default to 1800 LKR).
      6. Return Return-to-Origin (RTO) Delivery Failure risk score (10% to 100% based on warnings like extremely short/vague listing with no block/road numbers, missing contact numbers, fake names).
      7. Provide user guidance. If the RTO risk score is above 65%, warn "Ask for an advance payment" (අත්තිකාරම් මුදලක් ලබාගන්න) inside warningSinhala.
      
      Output strictly matching this JSON schema. Any missing fields must have elegant placeholders.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Process this messy Sri Lankan customer order data:\n\n${text}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING, description: "Customer's extracted full name" },
            phone1: { type: Type.STRING, description: "Primary 10 digit Sri Lankan mobile number starting with 07 or +94" },
            phone2: { type: Type.STRING, description: "Optional secondary contact number" },
            addressLine1: { type: Type.STRING, description: "House number, block, road, village details" },
            addressLine2: { type: Type.STRING, description: "Secondary road or division detail" },
            city: { type: Type.STRING, description: "Extracted Sri Lankan City / Town name" },
            district: { type: Type.STRING, description: "Sri Lankan District mapped from city" },
            province: { type: Type.STRING, description: "Sri Lankan Province mapped from city" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Raw or cleaned product name" },
                  quantity: { type: Type.INTEGER, description: "Quantity of items ordered, default to 1" },
                  price: { type: Type.NUMBER, description: "Calculated item price in LKR, default 1500 if not stated" },
                  size: { type: Type.STRING, description: "Product size (e.g. S, M, L, XL, XXL, Free Size)" },
                  color: { type: Type.STRING, description: "Product color (e.g. Red, Black, Blue)" }
                },
                required: ["name", "quantity", "price"]
              }
            },
            rtoRiskScore: { type: Type.INTEGER, description: "Percentage representing risk of order return (10 to 100)" },
            rtoRiskReasons: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Bullet points detailing RTO risks flag (e.g., missing phone number, city only, no street detail)"
            },
            courierRecommended: { type: Type.STRING, description: "Courier recommendation e.g. Koombiyo, Domex, Pronto, Fardar" },
            courierReason: { type: Type.STRING, description: "Brief justification for suggested courier" },
            rtoWarningEnglish: { type: Type.STRING, description: "Short warning in English regarding delivery" },
            rtoWarningSinhala: { type: Type.STRING, description: "Short, polite warning in professional Sinhala. If high risk, explicitly include 'අත්තිකාරම් මුදලක් ලබාගන්න'!" }
          },
          required: ["customerName", "phone1", "city", "items", "rtoRiskScore", "rtoRiskReasons", "rtoWarningEnglish", "rtoWarningSinhala"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini");
    }

    const parsedData = JSON.parse(resultText.trim());

    // CRITICAL SRI LANKAN LOCAL AUTO-COMPLETE POST-PROCESS OVERRIDE:
    // If the parsed town/city is matched in our high-precision local database,
    // we override the district and province to make absolutely sure they are exact.
    if (parsedData.city) {
      const dbMatch = lookupCity(parsedData.city);
      if (dbMatch) {
        parsedData.city = dbMatch.city;
        parsedData.district = dbMatch.district;
        parsedData.province = dbMatch.province;
      }
    }

    // Force AI Address Standardization under courier-ready layout
    parsedData.addressLine1 = getStandardizedCourierAddress(
      parsedData.addressLine1 || "",
      parsedData.addressLine2 || "",
      parsedData.city || "Colombo",
      parsedData.district || "Colombo"
    );
    parsedData.addressLine2 = "";

    // Safety check on RTO flags
    if (!parsedData.phone1 || parsedData.phone1.length < 8) {
      parsedData.rtoRiskScore = Math.max(parsedData.rtoRiskScore, 85);
      if (!parsedData.rtoRiskReasons.includes("Missing or invalid contact number")) {
        parsedData.rtoRiskReasons.push("Missing or invalid contact number");
      }
    }

    // Apply strict "Ask for advance" rule based on calculated RTO risk score
    if (parsedData.rtoRiskScore > 65) {
      if (!parsedData.rtoWarningSinhala.includes("අත්තිකාරම්") && !parsedData.rtoWarningSinhala.includes("බැංකු")) {
        parsedData.rtoWarningSinhala = "ඇණවුම භාරදීමේ ඉහළ අවදානමක් ඇත. කරුණාකර තහවුරු කරගැනීම සඳහා අත්තිකාරම් මුදලක් ලබාගන්න.";
      }
      if (!parsedData.rtoWarningEnglish.includes("advance payment") && !parsedData.rtoWarningEnglish.includes("deposit")) {
        parsedData.rtoWarningEnglish = "High risk of delivery failure. Recommended to request an advance payment prior to dispatch.";
      }
    }

    res.json({ success: true, method: "gemini-api", data: parsedData });
  } catch (err: any) {
    console.error("Gemini processing error:", err);
    // Graceful fallback to guarantee system never crashes and keeps the No-Code backend happy
    const fallback = mockFallbackResponse(text);
    res.json({ success: true, method: "fallback-heuristics-error-triggered", data: fallback, error: err.message });
  }
});

// 4. Process Messy Inventory Addition API using Gemini
app.post("/api/parse-inventory-item", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid text input" });
  }

  // Fallback parsed response
  const mockFallbackResponse = (rawInputText: string) => {
    let name = "Unknown Product";
    let cost = 0;
    let price = 0;
    let stock = 0;
    const englishMatch = rawInputText.match(/product:\s*([^,]+),\s*cost:\s*(\d+),\s*price:\s*(\d+),\s*stock:\s*(\d+)/i);
    if (englishMatch) {
      name = englishMatch[1].trim();
      cost = parseInt(englishMatch[2], 10);
      price = parseInt(englishMatch[3], 10);
      stock = parseInt(englishMatch[4], 10);
    } else {
      const numbers = rawInputText.match(/\d+/g);
      if (numbers && numbers.length >= 3) {
        cost = parseInt(numbers[0], 10);
        price = parseInt(numbers[1], 10);
        stock = parseInt(numbers[2], 10);
        name = rawInputText
          .replace(/\d+/g, "")
          .replace(/add product|cost|price|stock|අලුත් බඩුවක් ඇතුළත් කරන්න|මම අලුතින්|වගයක් ගෙනාවා|එකක මිල|මට වැටුනේ|ස්ටොක්|තියෙනවා/gi, "")
          .replace(/[,:]/g, "")
          .trim();
        if (!name) name = "Unknown Product";
      }
    }
    return { name, cost, price, stock };
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallback = mockFallbackResponse(text);
      return res.json({ success: true, method: "fallback", data: fallback });
    }

    const ai = getAiClient();
    const systemInstruction = `
      You are an AI assistant for a Sri Lankan inventory management system.
      Extract the product name, cost price (LKR), selling price (LKR), and initial stock from the following text (which could be in Sinhala, Singlish, or English).
      - If "මට වැටුනේ" (cost to me) or similar is mentioned, it's the cost.
      - If "විකුණන මිල" or "එකක මිල" (price of one) is mentioned, it's the selling price.
      
      Output strictly matching this JSON schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Extract inventory details from this text:\n\n${text}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             name: { type: Type.STRING, description: "Product name (translated to English if necessary or kept clean)" },
             cost: { type: Type.INTEGER, description: "Cost price in LKR" },
             price: { type: Type.INTEGER, description: "Selling price in LKR" },
             stock: { type: Type.INTEGER, description: "Initial stock quantity" }
          },
          required: ["name", "cost", "price", "stock"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini");
    }

    const parsedData = JSON.parse(resultText.trim());
    res.json({ success: true, method: "gemini-api", data: parsedData });
  } catch (err: any) {
    console.error("Gemini inventory parser error:", err);
    const fallback = mockFallbackResponse(text);
    res.json({ success: true, method: "fallback-error", data: fallback });
  }
});

const isReportTrigger = (msg: string) => {
  const text = msg.toLowerCase().trim();
  return text.includes("දවසේ රිපෝට්") || 
         text.includes("දවසේ රිපොට්") || 
         text.includes("daily summary") || 
         text.includes("daily report") || 
         text.includes("financial reporting") || 
         text.includes("දෛනික විකුණුම් වාර්තාව") || 
         (text.includes("report") && (text.includes("financial") || text.includes("today") || text.includes("sales"))) ||
         (text.includes("දවසේ") && text.includes("වාර්තා"));
};

const calculateDailyReport = (orders: any[] = [], inventory: any[] = []) => {
  const totalOrders = orders.length;
  let totalProductCost = 0;
  let totalRevenue = 0;

  for (const order of orders) {
    for (const item of (order.items || [])) {
      const qty = item.quantity || 1;
      const product = (inventory || []).find(inv => inv.name.toLowerCase() === item.name.toLowerCase());
      if (product) {
        totalProductCost += (product.cost * qty);
        totalRevenue += (product.price * qty);
      } else {
        // Fallback calculation using item's price and standard 50% estimated cost
        totalProductCost += (Math.round(item.price * 0.5) * qty);
        totalRevenue += (item.price * qty);
      }
    }
  }

  const netProfit = totalRevenue - totalProductCost;
  return { totalOrders, totalProductCost, totalRevenue, netProfit };
};

const makeMockInsightSinhala = (totalRevenue: number, netProfit: number) => {
  const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  if (margin >= 50) {
    return `විශිෂ්ටයි! අද දින ලාභ ආන්තිකය ${margin}% කි. ඔබේ ව්‍යාපාරයේ අලෙවිකරණ උපාය මාර්ග ඉතා සාර්ථකයි. මේ ආකාරයෙන්ම ඉදිරියටම යමු! 🚀`;
  } else if (margin >= 30) {
    return `ඉතා හොඳ ප්‍රගතියක්! අද දින ලාභ ආන්තිකය ${margin}% කි. ඇණවුම් ප්‍රමාණය තවත් වැඩි කර ගැනීමට ඩිජිටල් ප්‍රවර්ධන කටයුතු ශක්තිමත් කරන්න. 👍`;
  } else if (margin > 0) {
    return `හොඳ ආරම්භයක්! ලාභ ආන්තිකය ${margin}% කි. පිරිවැය තවත් අඩු කර ගැනීමෙන් හෝ භාණ්ඩ ඩිලිවරි ක්‍රියාවලිය කාර්යක්ෂම කිරීමෙන් ලාභය තවත් වැඩි කර ගත හැක. 💪`;
  } else {
    return `අද දින ලාභයක් වාර්තා වී නොමැත. විකුණුම් වැඩි කිරීමට සහ පිරිවැය පාලනය කිරීමට නව සැලසුම් සකස් කරමු. 🎯`;
  }
};

// 5. Smart Chat AI Inventory Assistant API
app.post("/api/chat-inventory", async (req, res) => {
  const { message, history, inventory, orders } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid text input" });
  }

  try {
    // 1. Check if Daily Sales Summary is triggered
    if (isReportTrigger(message)) {
      const reportData = calculateDailyReport(orders, inventory);
      const insight = makeMockInsightSinhala(reportData.totalRevenue, reportData.netProfit);
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          const ai = getAiClient();
          const margin = reportData.totalRevenue > 0 ? Math.round((reportData.netProfit / reportData.totalRevenue) * 100) : 0;
          
          const systemInstruction = `
            You are the "LakNexus AI Assistant". The merchant has asked for the daily financial summary or sales report.
            You MUST return a JSON matching this exact structure:
            {
              "reply": "Your beautiful Sinhala report text matching the template",
              "extractedItems": []
            }

            The "reply" value MUST display the exact following Sinhala layout text, substituting the calculated report data:

            ==================================
            💰 LAKNEXUS OMS - දෛනික විකුණුම් වාර්තාව
            ==================================
            • මුළු ඇණවුම් සංඛ්‍යාව (Total Orders): ${reportData.totalOrders}
            • මුළු පිරිවැය (Total Product Cost): LKR ${reportData.totalProductCost.toLocaleString()}
            • මුළු දළ ආදායම (Total Revenue): LKR ${reportData.totalRevenue.toLocaleString()}
            ----------------------------------
            📈 ශුද්ධ ලාභය (Net Profit): **LKR ${reportData.netProfit.toLocaleString()}**
            ==================================
            [Your motivating AI insight in friendly Sinhala here]

            Instead of [Your motivating AI insight in friendly Sinhala here], construct a motivating AI insight in Sinhala based on a profit margin of ${margin}%. Maintain exactly the same template lines of the report but place your custom AI insight at the end in markdown.
          `;

          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `The merchant has typed: "${message}". Please generate the daily sales report JSON reply.`,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                   reply: { type: Type.STRING },
                   extractedItems: { type: Type.ARRAY, items: { type: Type.OBJECT } }
                },
                required: ["reply", "extractedItems"]
              }
            }
          });

          const parsedData = JSON.parse(response.text.trim());
          return res.json({ success: true, reply: parsedData.reply, updatedInventory: inventory });
        } catch (err) {
          console.error("Gemini daily summary error in chat-inventory:", err);
        }
      }

      // Fallback if no apiKey or Gemini fails
      const replyText = `==================================
💰 LAKNEXUS OMS - දෛනික විකුණුම් වාර්තාව
==================================
• මුළු ඇණවුම් සංඛ්‍යාව (Total Orders): ${reportData.totalOrders}
• මුළු පිරිවැය (Total Product Cost): LKR ${reportData.totalProductCost.toLocaleString()}
• මුළු දළ ආදායම (Total Revenue): LKR ${reportData.totalRevenue.toLocaleString()}
----------------------------------
📈 ශුද්ධ ලාභය (Net Profit): **LKR ${reportData.netProfit.toLocaleString()}**
==================================
${insight}`;

      return res.json({
         success: true,
         reply: replyText,
         updatedInventory: inventory
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       // Fallback for no API key
       return res.json({ 
         success: true, 
         reply: "API Key එකක් ලබා දී නොමැත. කරුණාකර Settings වලදී Gemini API Key එකක් ඇතුළත් කරන්න.",
         updatedInventory: inventory
       });
    }

    const ai = getAiClient();
    const systemInstruction = `
      You are the "LakNexus AI Inventory Assistant". Your only job is to chat with the merchant, collect product details (Name, Cost, Price, Stock) from their natural Sinhala, English, or Singlish messages, update active memory, and output a clean Markdown table of all products whenever asked ("මගේ බඩු ටික පෙන්වන්න", "Stock විස්තර", or "Inventory Report"). Always speak in friendly, cooperative Sinhala as a business partner, using emojis, and keep the user updated on their total inventory value.

      CURRENT ACTIVE DATABASE (Starting Memory / Current Memory):
      ${JSON.stringify(inventory, null, 2)}
      
      CAPABILITIES & RULES:
      1. DYNAMIC STOCK ADDITION / RESTOCK: If the merchant describes a new item or restocking in natural Sinhala (e.g., "මම අලුතින් Shoes වගයක් ගෙනාවා. එකක් විකුණන්නේ 4500ට. මට වැටුණේ 2000ට. ස්ටොක් 15ක් තියෙනවා"), intelligently extract: Product Name, Cost price, Selling Price, and Stock quantity. If the item already exists in the memory (by matching name case-insensitively), add the stock to the existing stock. Otherwise, add as a new product. Confirm the addition or restock politely in friendly Sinhala using emojis.
      2. DYNAMIC TABLE DISPLAY: If the merchant asks "මගේ බඩු ටික පෙන්වන්න" (Show my items), "Stock විස්තර", "Inventory Report", or any equivalent query, output a beautifully formatted Markdown table containing ALL products in memory (including newly added ones).
      3. TABLE FORMAT & COLUMNS:
         The table MUST use exactly these columns:
         | භාණ්ඩයේ නම (Product Name) | පිරිවැය (Cost LKR) | විකුණුම් මිල (Selling Price LKR) | පවතින තොගය (Current Stock) | මුළු වටිනාකම (Total Value = Stock x Cost) |
         |---|---|---|---|---|
         (Rows must list the current products in memory, with total locked value for each calculated as Stock * Cost)
      4. LOW-STOCK ALERT WARNINGS: Check if any item's stock in the final inventory (after applying updates from the current message) is less than 5 units. If yes, you MUST append a bold warning text immediately after the table: "🚨 STOCK WARNING: [Product Name] is running out! Only [N] left." for EACH such product.
      5. INSIGHTS & CASH FLOW: Mention the total inventory value and which product has the highest cash flow locked in stock, using warm and helpful Sinhala words.
      
      SCHEMA FOR JSON OUTPUT:
      - reply: Your friendly Sinhala conversational response incorporating text and Markdown tables (and stock warnings if applicable) as requested.
      - extractedItems: Array of any new products or restocks mentioned in the user's latest incoming message. Use empty array [] if no product addition or restocking is mentioned in this message. Do not list products that were not newly mentioned in the latest message here.
    `;

    // Map history to Gemini format, but we'll just pass history as context in the prompt to keep schema generation simple, or use generateContent with history.
    // To ensure JSON schema works reliably, we use generateContent with the full conversation stitched, or simply pass the message since the system instruction holds the current active inventory state!
    
    // Stitch conversation history for deeper context:
    const stitchedHistory = (history || []).map((h: any) => `${h.role === 'user' ? 'Merchant' : 'Assistant'}: ${h.content}`).join("\\n");
    const fullPrompt = `Chat History:\\n${stitchedHistory}\\n\\nMerchant: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             reply: { type: Type.STRING, description: "Your conversational Sinhala response. Use Markdown for tables if requested." },
             extractedItems: {
                type: Type.ARRAY,
                description: "New products or restocks extracted from the merchant's latest message. Empty array if none.",
                items: {
                   type: Type.OBJECT,
                   properties: {
                     name: { type: Type.STRING },
                     cost: { type: Type.INTEGER },
                     price: { type: Type.INTEGER },
                     stock: { type: Type.INTEGER }
                   },
                   required: ["name", "cost", "price", "stock"]
                }
             }
          },
          required: ["reply", "extractedItems"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini");
    }

    const parsedData = JSON.parse(resultText.trim());
    
    // Process updated inventory safely
    let updatedInventory = [...(inventory || [])];
    if (parsedData.extractedItems && parsedData.extractedItems.length > 0) {
      for (const newItem of parsedData.extractedItems) {
        const existingIdx = updatedInventory.findIndex(i => i.name.toLowerCase() === newItem.name.toLowerCase());
        if (existingIdx !== -1) {
           updatedInventory[existingIdx] = {
              ...updatedInventory[existingIdx],
              stock: updatedInventory[existingIdx].stock + newItem.stock,
              cost: newItem.cost > 0 ? newItem.cost : updatedInventory[existingIdx].cost,
              price: newItem.price > 0 ? newItem.price : updatedInventory[existingIdx].price
           };
        } else {
           updatedInventory.push({
              id: Date.now().toString() + Math.random().toString().slice(2, 6),
              ...newItem
           });
        }
      }
    }

    res.json({ success: true, reply: parsedData.reply, updatedInventory });
  } catch (err: any) {
    console.error("Gemini Chat Parser error:", err);
    res.json({ success: false, error: err.message });
  }
});

// 6. Multi-functional Business Intelligence Agent API
app.post("/api/business-intelligence", async (req, res) => {
  const { message, module, inventory, history, orders } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid text input" });
  }

  const normalized = message.toLowerCase().trim();

  // Handle Daily Sales Summary if triggered
  if (isReportTrigger(message)) {
    const reportData = calculateDailyReport(orders, inventory);
    const insight = makeMockInsightSinhala(reportData.totalRevenue, reportData.netProfit);
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = getAiClient();
        const margin = reportData.totalRevenue > 0 ? Math.round((reportData.netProfit / reportData.totalRevenue) * 100) : 0;
        
        const systemInstruction = `
          You are the "LakNexus AI Business Intelligence Agent". The merchant has asked for the daily financial summary or sales report.
          You MUST return a JSON matching this exact structure:
          {
            "reply": "Your beautiful Sinhala report text matching the template",
            "detectedModule": "menu"
          }

          The "reply" value MUST display the exact following Sinhala layout text, substituting the calculated report data:

          ==================================
          💰 LAKNEXUS OMS - දෛනික විකුණුම් වාර්තාව
          ==================================
          • මුළු ඇණවුම් සංඛ්‍යාව (Total Orders): ${reportData.totalOrders}
          • මුළු පිරිවැය (Total Product Cost): LKR ${reportData.totalProductCost.toLocaleString()}
          • මුළු දළ ආදායම (Total Revenue): LKR ${reportData.totalRevenue.toLocaleString()}
          ----------------------------------
          📈 ශුද්ධ ලාභය (Net Profit): **LKR ${reportData.netProfit.toLocaleString()}**
          ==================================
          [Your motivating AI insight in friendly Sinhala here]

          Instead of [Your motivating AI insight in friendly Sinhala here], construct a motivating AI insight in Sinhala based on a profit margin of ${margin}%. Maintain exactly the same template lines of the report but place your custom AI insight at the end in markdown.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `The merchant has typed: "${message}". Please generate the daily sales report JSON reply.`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                 reply: { type: Type.STRING },
                 detectedModule: { type: Type.STRING }
              },
              required: ["reply", "detectedModule"]
            }
          }
        });

        const parsedData = JSON.parse(response.text.trim());
        return res.json({ success: true, reply: parsedData.reply, detectedModule: "menu", method: "gemini-api" });
      } catch (err) {
        console.error("Gemini daily summary error in business-intelligence:", err);
      }
    }

    // Fallback if no apiKey or Gemini fails
    const replyText = `==================================
💰 LAKNEXUS OMS - දෛනික විකුණුම් වාර්තාව
==================================
• මුළු ඇණවුම් සංඛ්‍යාව (Total Orders): ${reportData.totalOrders}
• මුළු පිරිවැය (Total Product Cost): LKR ${reportData.totalProductCost.toLocaleString()}
• මුළු දළ ආදායම (Total Revenue): LKR ${reportData.totalRevenue.toLocaleString()}
----------------------------------
📈 ශුද්ධ ලාභය (Net Profit): **LKR ${reportData.netProfit.toLocaleString()}**
==================================
${insight}`;

    return res.json({
       success: true,
       reply: replyText,
       detectedModule: "menu",
       method: "fallback"
    });
  }

  // Helper local fallback implementation to ensure absolute robustness
  const getFallbackReply = () => {
    // 1. Check for Help / Menu
    if (normalized === "/menu" || normalized === "menu" || normalized === "help" || normalized.includes("උදව්") || normalized.includes("මොනවද කරන්න")) {
      return {
        reply: `🌸 **LakNexus AI Business Intelligence (BI) තීරණ සහායක සහකරු වෙත සාදරයෙන් පිළිගනිමු!** 💡\n\nඔබේ ඊ-කොමර්ස් ව්‍යාපාරික වර්ධනය සහ අවදානම් අවම කරගැනීම සඳහා පහත සඳහන් AI මොඩියුල ක්‍රියාත්මක කිරීමට මට විධාන ලබා දෙන්න:\n\n1. 📢 **AI Ad Writer & Marketing Engine**\n   - ක්‍රියාත්මක කිරීමට: "[භාණ්ඩයේ නම] එකට ඇඩ් එකක් ලියන්න" හෝ "Write an ad for [Product Name]" ලෙස පවසන්න.\n   - ලබාදෙන දේ: High-Converting Hooks 3ක් (Sinhala, Singlish, Mixed), persuasive body copy, සහ පියවරෙන් පියවර order template එකක්.\n\n2. 🛡️ **AI RTO Predictor & Courier Risk Analyzer**\n   - ක්‍රියාත්මක කිරීමට: පාරිභෝගිකයාගේ හැසිරීම් සටහන් ඇතුළත් කරන්න (උදා: "කොළඹ විතරයි තියෙන්නේ, ගෙදර නැහැ කිව්වා" හෝ "පස්සේ ගන්නම් කිව්වා").\n   - ලබාදෙන දේ: Risk level, Return probability %, සහ උපක්‍රමශීලී උපදෙස් සිංහලෙන්.\n\n3. 💬 **AI Auto-Reply & Sales Closer**\n   - ක්‍රියාත්මක කිරීමට: පාරිභෝගිකයාගේ විරෝධතා පේස්ට් කරන්න (උදා: "ගණන් වැඩියි", "ඩිලිවරි නොමිලේද?", "Confirm da?").\n   - ලබාදෙන දේ: මනෝවිද්‍යාත්මකව ඔප්පු කරන ලද සහ විකුණුම් සාර්ථක කරගන්නා පිළිතුරක් සිංහලෙන්.\n\nකරුණාකර ඉහත මොඩියුලයක් තෝරා ගැනීමට අදාළ විස්තර ටයිප් කරන්න හෝ ඉහළ ඇති ක්ෂණික පෝරමය (Forms Layout) භාවිතා කරන්න! 👇`,
        detectedModule: "menu"
      };
    }

    // 2. Check for objection responses (Module 3)
    if (normalized.includes("ගණන් වැඩියි") || normalized.includes("පස්සේ ගන්නම්") || normalized.includes("මිල වැඩියි")) {
      return {
        reply: `💬 **AI Auto-Reply & Sales Closer (මිල විරෝධතා සදහා):**\n\nමෙම පිළිතුර පාරිභෝගිකයා වෙත යවන්න:\n\n"ආයුබෝවන්! 🌸 ඔව්, ඔබට මිල තරමක් වැඩි යැයි සිතෙන්න පුළුවන්. නමුත් අප මෙහිදී ඔබට ලබා දෙන්නේ වෙළඳපොලේ ඇති හොඳම ගුණාත්මකභාවයෙන් (Premium Quality) යුතු සහතික ලත් භාණ්ඩයක්. ඒ වගේම ඔබට භාණ්ඩය ලැබුණු පසු මුදල් ගෙවීමේ (Cash on Delivery) පහසුකම ද තිබෙන නිසා කිසිදු අවදානමක් නැහැ. දිගුකාලීන පැවැත්ම සහ විශ්වසනීයත්වය සමඟ සසදන විට මෙම මිල ඉතා සාධාරණයි. ඔබ වෙනුවෙන් අදම ඇණවුම වෙන් කරන්නද? 😊"`,
        detectedModule: "auto-reply"
      };
    }
    if (normalized.includes("free delivery") || normalized.includes("delivery free") || normalized.includes("ඩිලිවරි නොමිලේද") || normalized.includes("ඩිලිවරි ෆ්‍රී")) {
      return {
        reply: `💬 **AI Auto-Reply & Sales Closer (ඩිලිවරි විමසීම් සදහා):**\n\nමෙම පිළිතුර පාරිභෝගිකයා වෙත යවන්න:\n\n"ආයුබෝවන්! 🌸 ලංකාව පුරා ඉන්ධන සහ කුරියර් ගාස්තු ඉහළ යාම නිසා අපට සාමාන්‍යයෙන් ඩිලිවරි ගාස්තුවක් අය කිරීමට සිදුවනවා. නමුත් ඔබ එකම වර්ගයෙන් හෝ වෙනත් භාණ්ඩ 2ක් හෝ ඊට වැඩි ප්‍රමාණයක් එකවර ඇණවුම් කළහොත්, අප ඔබට විශේෂ වට්ටමක් (Combo Discount) හෝ නොමිලේ ප්‍රවාහනය (Free Delivery) ලබා දීමට උපරිමයෙන් උත්සාහ කරන්නෙමු! ඔබට අවශ්‍ය භාණ්ඩ 2 තෝරාගනිමුද? 😊"`,
        detectedModule: "auto-reply"
      };
    }
    if (normalized.includes("confirm da") || normalized.includes("කන්ෆර්ම්ද") || normalized.includes("confirm?")) {
      return {
        reply: `💬 **AI Auto-Reply & Sales Closer (ඇණවුම තහවුරු කිරීමට):**\n\nමෙම පිළිතුර පාරිභෝගිකයා වෙත යවන්න:\n\n"ආයුබෝවන්! 🌸 ඔබගේ ඇණවුම මේ වන විටත් ඉතාම සුරක්ෂිතව ඇසුරුම් කර (Packing) කුරියර් සමාගමට භාර දීම සඳහා සූදානම් කර ඇත. ඔබගේ ලිපිනයට දින 2-3 කින් ආරක්ෂිතව භාණ්ඩය ලැබෙනු ඇත. ඇණවුම කුරියර් සමාගමට කඩිනමින් භාර දීම සඳහා කරුණාකර ඔබගේ අවසාන කැමැත්ත (Confirm!) අප වෙත ලබා දෙන්න. ඔබට ස්තූතියි! 🚚📦"`,
        detectedModule: "auto-reply"
      };
    }

    // 3. Ad Writer check (Module 1)
    if (normalized.includes("ad") || normalized.includes("ඇඩ්") || normalized.includes("ලියන්න") || normalized.includes("write an")) {
      // Find matching product
      let selectedProduct = (inventory && inventory.length > 0) ? inventory[0] : { name: "Smart Product", price: 2450 };
      for (const item of (inventory || [])) {
        if (normalized.includes(item.name.toLowerCase())) {
          selectedProduct = item;
          break;
        }
      }

      return {
        reply: `📢 **AI Ad Writer & Marketing Engine (${selectedProduct.name} සදහා):**\n\nමෙන්න ඔබේ භාණ්ඩය ඉක්මනින් විකුණා ගැනීමට සකස් කළ සාර්ථක දැන්වීම් පිටපත:\n\n---\n\n### ⚡ 1. High-Converting Hooks (දැන්වීම් සිරස්තල 3ක්):\n\n* **PURE SINHALA (සිංහලෙන්ම):** "නිතරම සල්ලි නැතිවෙන ප්‍රශ්නෙට, හැමෝම හොයන ස්මාර්ට්ම විසඳුම මෙන්න! 💳🌸"\n* **SINGLISH (ලතින් අකුරෙන්):** "Pocket eke thiyena watina badu tika parissamin thiyaganna oni neda? Smart Wallet eka lagadi ganna! 🔥"\n* **MIXED LANGUAGE:** "Premium Quality & Smart Design! ඔයාගෙ Style එකට ගැලපෙන සුපිරිම ${selectedProduct.name} එක දැන් විශේෂ ඩිස්කවුන්ට් එකක් එක්ක! 💼✨"\n\n### 📝 2. PERSUASIVE BODY COPY (දැන්වීම් විස්තරය):\n\nපිරිමින් සඳහාම විශේෂයෙන් නිපදවූ සුපිරි නිමාවකින් යුත් ආකර්ශනීය **${selectedProduct.name}** දැන් ලංකාවේ අවම මිලට අපෙන් ලබාගත හැක! \n\n* **විශේෂ වාසි:** ශක්තිමත් නිමාව, සුවපහසු ප්‍රමාණය සහ අතිශය ආරක්ෂිත ලෙදර් මෝස්තරය. \n* **විශේෂ මිල:** රු. ${selectedProduct.price.toLocaleString()} පමණි! (මුදල් ගෙවීම භාණ්ඩය ලැබුණු පසු - COD)\n* **කඩිනම් වන්න:** සීමිත තොග (Limited Stock!) ඇති බැවින් අදම ඇණවුම් කරන්න.\n\n### 🛒 3. CALL TO ACTION (CTA - ඇණවුම් කරන්න):\n\nමෙම විශේෂ මිලට අදම මිලදී ගැනීමට පහත විස්තර අප වෙත එවන්න:\n\n* භාණ්ඩයේ නම: ${selectedProduct.name}\n* ඔබේ නම:\n* දුරකථන අංකය:\n* ඩිලිවරි ලිපිනය:\n\n**[ORDER NOW]** බොත්තම ඔබා අපගේ WhatsApp එකට කෙලින්ම යොමු කරන්න! 🚚✨`,
        detectedModule: "ad-writer"
      };
    }

    // 4. Risk / RTO Check (Module 2)
    if (normalized.includes("පස්සේ") || normalized.includes("නැහැ") || normalized.includes("නැත") || normalized.includes("කෝල්") || normalized.includes("colombo") || normalized.includes("galle") || normalized.includes("මෝඩියුලය") || normalized.length > 5) {
      let score = 35;
      let level = "🟢 LOW RISK";
      let rec = "විශ්වාසවන්ත ඇණවුමකි, සාමාන්‍ය පරිදි Dispatch කරන්න.";

      if (normalized.includes("පස්සේ") || normalized.includes("ගෙදර නැහැ") || normalized.includes("ගන්නම්") || normalized.includes("පස්සෙ")) {
         score = 80;
         level = "🔴 HIGH RISK";
         rec = "🔴 HIGH RISK: මෙම පාරිභෝගිකයා පසුව ගන්නා ලෙස පවසමින් මඟ හැරීමට ඉඩ ඇත. කුරියර් ගාස්තුව හෝ සම්පූර්ණ මුදල කලින් බැංකු ගිණුමට දමා ගන්නා ලෙස පාරිභෝගිකයාට පවසන්න.";
      } else if (normalized.includes("නැහැ") || normalized.includes("කොළඹ") || normalized.includes("colombo") || normalized.length < 15) {
         score = 55;
         level = "🟡 MEDIUM RISK";
         rec = "🟡 MEDIUM RISK: ලිපිනය අසම්පූර්ණයි. Dispatch කිරීමට පෙර දුරකථන ඇමතුමක් මඟින් ලිපිනය හා කැමැත්ත තහවුරු කරගන්න.";
      }

      return {
        reply: `🛡️ **AI RTO Predictor & Courier Risk Analyzer**\n\nසමාලෝචනය කරන ලද අවදානම් විශ්ලේෂණ වාර්තාව (RISK ASSESSMENT REPORT):\n\n- **Risk Level:** ${level}\n- **Return Probability:** ${score}%\n- **AI Recommendation (In Sinhala):**\n  ${rec}`,
        detectedModule: "rto-predictor"
      };
    }

    return {
      reply: `🌸 **LakNexus BI තීරණ සහායකයා:**\n\nමා වෙත ලැබුණු පණිවිඩය: "${message}"\n\nමොනවාද කළ යුත්තේ කියා පැහැදිලි නැත. විධාන මෙනුව බැලීම සදහා කරුණාකර **/menu** ලෙස ටයිප් කරන්න. 😊`,
      detectedModule: "chat"
    };
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fb = getFallbackReply();
      return res.json({ success: true, ...fb, method: "fallback-no-key" });
    }

    const ai = getAiClient();
    const systemInstruction = `
      You are the Multi-functional Business Intelligence (BI) Agent for LakNexus Sri Lankan Order Management System.
      Your goal is to increase merchant business sales, write ads, and mitigate RTO (Return to Origin) delivery risk.
      You MUST strictly reply in friendly, professional, helpful Sinhala with emojis. Use precise Markdown formatting.
      
      CURRENT ACTIVE INVENTORY DATABASE (For looking up product price/details, look case-insensitively):
      ${JSON.stringify(inventory || [], null, 2)}

      ### CORE CAPABILITIES & COMMAND ROUTING DIRECTIVES:
      
      1. GLOBAL COMMAND / HELP MENU:
         - If the user types "/menu" or asks for help ("help", "උදව් කරන්න", "මොනවද කරන්න පුළුවන්" or "menu"), you must display all 3 modules clearly categorized with bullet points/numbered lists in beautiful Sinhala and ask them which module they wish to use.
         
      2. MODULE 12.1: [AI AD WRITER & MARKETING ENGINE]
         - Trigger: Merchant requests an ad script (e.g., "Write an ad", "ඇඩ් එකක් ලියන්න", "ad for Smart Wallet").
         - Task: Intelligently extract the desired product's name. Check the Inventory Database. Use its actual Selling Price (price) and features in the copywriting.
         - Required Outputs (Return exactly this structure nested in the Sinhala reply):
           * **HOOKS**: List 3 variations of high-converting social media hooks:
             - Hook 1: Pure Sinhala (highly engaging)
             - Hook 2: Singlish (Latin character Sinhala, widely used in SL)
             - Hook 3: Combined Sinhala/English Mix
           * **PERSUASIVE BODY COPY**: Highly persuasive product description emphasizing features, benefits, and urgent call-to-actions ("Limited Stock!" / "සීමිත තොග ඇති බැවින් ඉක්මන් කරන්න!"). Highlight the exact price (Selling Price from db).
           * **CALL TO ACTION (CTA) TEMPLATE**: Order template for WhatsApp checkout (e.g. Name, Phone, Address fields for easy copying).
         
      3. MODULE 12.2: [AI RTO PREDICTOR & COURIER RISK ANALYZER]
         - Trigger: Merchant enters customer behavior notes or signs of reluctance (e.g. "පස්සේ ගන්නම්", "අද නැහැ කිව්වා", "කොළඹ විතරයි ලිපිනය", "ඇමතුම් වලට පිළිතුරු නෑ").
         - Task: Estimate the RTO risk level based on the sentiment and completeness indicators. High risks are incomplete addresses ("Galle" only), hesitation about Cash on Delivery, unpredictable time limits, or incorrect numbers.
         - Required Outputs (Return exactly this report):
           * Risk Level: 🟢 LOW RISK | 🟡 MEDIUM RISK | 🔴 HIGH RISK
           * Return Probability: [Estimated % based on text analysis between 10% and 99%]
           * AI Recommendation (In Sinhala): Provide tactical real-world tips (e.g., request advance courier fee, call to confirm, pack soon, or hold dispatch).
         
      4. MODULE 12.3: [AI AUTO-REPLY & SALES CLOSER]
         - Trigger: Merchant copies an objection pasted by a customer (e.g., "ගණන් වැඩියි" (Too expensive), "ඩිලිවරි නොමිලේද?" (Is delivery free?), "Confirm da?" (Are you sure?)).
         - Rules & Response Matrix:
           * If 'ගණන් වැඩියි': Highlight premium build quality, money safety via Cash on Delivery, and premium customer service. Contrast price against durable value.
           * If 'Free Delivery?': Highlight rising courier service costs, but offer combo discounts or special treatment if they secure 2 or more products.
           * If 'Confirm da?': Demonstrate absolute professional commitment, confirm the item is already prioritized for packaging, and ask for a quick confirmation to dispatch immediately.
         - Output: Write a psychological, polite, sales-optimized closing message in friendly Sinhala wrapped in copyable quote marks.
         
      Output format is strictly JSON matching this structure:
      {
         "reply": "Your beautiful Sinhala answer incorporating the selected module response in formatted rich Markdown",
         "detectedModule": "menu" | "ad-writer" | "rto-predictor" | "auto-reply"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             reply: { type: Type.STRING, description: "Your conversational Sinhala response with precise Markdown" },
             detectedModule: { type: Type.STRING, enum: ["menu", "ad-writer", "rto-predictor", "auto-reply"] }
          },
          required: ["reply", "detectedModule"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini");
    }

    const parsedData = JSON.parse(resultText.trim());
    res.json({ success: true, reply: parsedData.reply, detectedModule: parsedData.detectedModule, method: "gemini-api" });
  } catch (err: any) {
    console.error("Gemini BI Agent error:", err);
    const fb = getFallbackReply();
    res.json({ success: true, ...fb, method: "fallback-error" });
  }
});

// 7. Navigation Bar AI Smart Calculator API
app.post("/api/smart-calculator", async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid text input" });
  }

  const normalized = message.toLowerCase().trim();

  // Pure JavaScript accurate parser helper
  const getFallbackCalculation = () => {
    // 1. SMART DISCOUNTERS
    // Input e.g.: "LKR 4500 item, 12% discount, add 350 courier" or "4500, 12% discount, 350 courier"
    const priceMatch = normalized.match(/(?:lkr|rs\.?)\s*(\d+)|(\d+)\s*item|\b(\d{4,5})\b/i);
    const discountMatch = normalized.match(/(\d+)\s*%\s*(?:discount|disc)?/i) || normalized.match(/discount\s*(\d+)\s*%/i) || normalized.match(/(\d+)\%\s*/);
    const courierMatch = normalized.match(/(?:add|plus|\+)\s*(\d+)/i) || normalized.match(/(\d+)\s*courier/i) || normalized.match(/courier\s*(\d+)/i);

    if (priceMatch && (discountMatch || courierMatch)) {
      const originalPrice = parseFloat(priceMatch[1] || priceMatch[2] || priceMatch[3] || "0");
      const discountPct = discountMatch ? parseFloat(discountMatch[1] || discountMatch[2] || "0") : 0;
      const courier = courierMatch ? parseFloat(courierMatch[1] || courierMatch[2] || courierMatch[3] || "0") : 0;

      if (originalPrice > 0) {
        const discountAmount = Math.round(originalPrice * (discountPct / 100));
        const finalPrice = Math.round(originalPrice - discountAmount + courier);

        return {
          reply: `### 🎯 Smart Price Breakdown
• **Original Price**: LKR ${originalPrice.toLocaleString()}
• **Discount (${discountPct}%)**: -LKR ${discountAmount.toLocaleString()}
• **Courier Add-on**: +LKR ${courier.toLocaleString()}
----------------------------------
💡 **Final Buyer Cost**: **LKR ${finalPrice.toLocaleString()}**

*ස්මාර්ට් වට්ටම් ගැලපීම සාර්ථකයි! (Calculated instantly)*`
        };
      }
    }

    // 2. MARGIN CALCULATOR
    // Input e.g.: "Cost 1500, want 30% profit margin" or "cost 1500 margin 30%"
    const costMatch = normalized.match(/cost\s*(\d+)|(\d+)\s*cost/i);
    const marginMatch = normalized.match(/(\d+)\s*%\s*(?:profit\s*)?margin|margin\s*(\d+)\s*%/i) || normalized.match(/want\s*(\d+)\s*%/i) || normalized.match(/(\d+)\%\s*margin/i) || normalized.match(/margin\s*(\d+)/i);

    if (costMatch || marginMatch) {
      const cost = costMatch ? parseFloat(costMatch[1] || costMatch[2]) : 1500;
      const margin = marginMatch ? parseFloat(marginMatch[1] || marginMatch[2]) : 30;
      const marginRatio = margin / 100;

      if (cost > 0 && marginRatio < 1 && marginRatio > 0) {
        const sellingPrice = Math.round(cost / (1 - marginRatio));
        const profit = sellingPrice - cost;

        return {
          reply: `### 📈 Profit Margin Breakdown
• **Direct Product Cost**: LKR ${cost.toLocaleString()}
• **Desired Profit Margin**: ${margin}%
• **Suggested Selling Price**: **LKR ${sellingPrice.toLocaleString()}**
----------------------------------
📊 **Net Profit Per Sale**: LKR ${profit.toLocaleString()}

*සූත්‍රය: Selling Price = Cost / (1 - Margin). ලාභ ඉලක්කය සපුරා ගැනීමට මෙම මිල යෝජනා කරයි.*`
        };
      }
    }

    // 3. AD ROI ANALYZER
    // Input e.g.: "Spent 5000 on FB ads, got 12 orders"
    const spentMatch = normalized.match(/(?:spent|spend|spend of|cost of)\s*(\d+)/i) || normalized.match(/(\d+)\s*on\s*(?:fb|google|tiktok|ads)/i) || normalized.match(/(?:spent|spend)\s*(\d+)/i);
    const ordersMatch = normalized.match(/(?:got|received|resulted in)?\s*(\d+)\s*(?:orders|sales|conversions)/i) || normalized.match(/(\d+)\s*(?:orders|sales)/i);

    if (spentMatch && ordersMatch) {
      const spent = parseFloat(spentMatch[1]);
      const orders = parseFloat(ordersMatch[1]);

      if (orders > 0) {
        const cpp = Math.round(spent / orders);
        let profitabilityInsight = "";
        
        if (cpp < 400) {
          profitabilityInsight = "🏆 **ඉතා සාර්ථකයි!** CPP අගය ඉතා අඩු මට්ටමකය. ප්‍රචාරණය තවදුරටත් පුළුල් කරන්න (Scale up)!";
        } else if (cpp < 800) {
          profitabilityInsight = "⚖️ **ලාභදායී මට්ටමක පවතී!** සාමාන්‍ය විකුණුම් මිල අනුව මෙය ලාභදායකයි. ප්‍රවර්ධනය ඉදිරියට ගෙනයන්න.";
        } else {
          profitabilityInsight = "⚠️ **අවදානම් සහගතයි!** මිලදී ගැනීමක පිරිවැය (CPP) ඉතා ඉහළයි. දැන්වීම් නිර්මාණ (Creative) හෝ Target Group වෙනස් කරන්න.";
        }

        return {
          reply: `### 📢 Ad Campaign ROI Breakdown
• **Total Ad Spend**: LKR ${spent.toLocaleString()}
• **Total Conversions**: ${orders} Orders
• **Cost Per Purchase (CPP)**: **LKR ${cpp.toLocaleString()}**
----------------------------------
${profitabilityInsight}`
        };
      }
    }

    // Default return
    return {
      reply: `### 🧮 LakNexus AI Smart Calculator
පහත ආකාරයේ විමසුම් ඇතුලත් කරන්න:
1. **Smart Discounting**: "LKR 4500 item, 12% discount, add 350 courier"
2. **Margin Calculator**: "Cost 1500, want 30% profit margin"
3. **Ad ROI Analyzer**: "Spent 5000 on FB ads, got 12 orders"

*කරුණාකර ඉහත ආකාරයට උදාහරණයක් ඇතුළු කරන්න.*`
    };
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallback = getFallbackCalculation();
      return res.json({ success: true, reply: fallback.reply, method: "fallback-no-key" });
    }

    const ai = getAiClient();
    const systemInstruction = `
      You are the "LakNexus Navigation Bar AI Smart Calculator". You process natural language pricing queries and ad campaign budgets.
      You are embedded in a compact navigation bar popover inside a Sri Lankan e-commerce system.
      Keep answers very short, concise, highly data-focused, and formatted in clean markdown.
      Always respond in extremely clear, beautiful, friendly Sinhala as requested by the merchant, while keeping core numeric fields easily readable.

      Handle these MODES strictly:
      1. SMART DISCOUNTERS:
         - Input pattern: "LKR 4500 item, 12% discount, add 350 courier"
         - Calculation needed: Subtract discount percentage from base price, and optionally add courier fee. Show the clear step-by-step math.
      2. MARGIN CALCULATOR:
         - Input pattern: "Cost 1500, want 30% profit margin"
         - Formula: Selling Price = Cost / (1 - Margin Ratio). Match are cost (1500) and desired margin (30% / 0.3).
         - Calculation: Selling Price = 1500 / 0.7 = 2142.85 LKR. Show direct cost, desired profit margin percentage, and final Selling Price.
      3. AD ROI ANALYZER:
         - Input pattern: "Spent 5000 on FB ads, got 12 orders"
         - Calculation needed: Calculate Cost Per Purchase (CPP) = Ad Spend / Orders. Output the CPP in LKR. Provide a 1-sentence friendly Sinhala evaluation of profitability.

      Output JSON format:
      {
         "reply": "Your concise data-rich Sinhala markdown reply"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Calculate this user pricing query: "${message}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING }
          },
          required: ["reply"]
        }
      }
    });

    const parsedData = JSON.parse(response.text.trim());
    return res.json({ success: true, reply: parsedData.reply, method: "gemini-api" });
  } catch (err: any) {
    console.error("Smart Calculator error:", err);
    const fallback = getFallbackCalculation();
    return res.json({ success: true, reply: fallback.reply, method: "fallback-error" });
  }
});

// Vite server integrations
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite development middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Static production build hosting
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LakNexus OMS Server successfully active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
