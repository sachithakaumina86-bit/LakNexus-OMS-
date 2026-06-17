export interface CityLocation {
  city: string;
  district: string;
  province: string;
}

export const SRI_LANKAN_CITIES: CityLocation[] = [
  // Colombo District - Western Province
  { city: "Colombo", district: "Colombo", province: "Western" },
  { city: "Dehiwala", district: "Colombo", province: "Western" },
  { city: "Mount Lavinia", district: "Colombo", province: "Western" },
  { city: "Moratuwa", district: "Colombo", province: "Western" },
  { city: "Kotte", district: "Colombo", province: "Western" },
  { city: "Sri Jayawardenepura Kotte", district: "Colombo", province: "Western" },
  { city: "Kaduwela", district: "Colombo", province: "Western" },
  { city: "Nugegoda", district: "Colombo", province: "Western" },
  { city: "Maharagama", district: "Colombo", province: "Western" },
  { city: "Kolonnawa", district: "Colombo", province: "Western" },
  { city: "Battaramulla", district: "Colombo", province: "Western" },
  { city: "Malabe", district: "Colombo", province: "Western" },
  { city: "Homagama", district: "Colombo", province: "Western" },
  { city: "Kottawa", district: "Colombo", province: "Western" },
  { city: "Piliyandala", district: "Colombo", province: "Western" },
  { city: "Kesbewa", district: "Colombo", province: "Western" },
  { city: "Ratmalana", district: "Colombo", province: "Western" },
  { city: "Wellampitiya", district: "Colombo", province: "Western" },
  { city: "Hanwella", district: "Colombo", province: "Western" },
  { city: "Avissawella", district: "Colombo", province: "Western" },
  { city: "Grandpass", district: "Colombo", province: "Western" },
  { city: "Wellawatte", district: "Colombo", province: "Western" },
  { city: "Bambalapitiya", district: "Colombo", province: "Western" },

  // Gampaha District - Western Province
  { city: "Gampaha", district: "Gampaha", province: "Western" },
  { city: "Negombo", district: "Gampaha", province: "Western" },
  { city: "Kelaniya", district: "Gampaha", province: "Western" },
  { city: "Wattala", district: "Gampaha", province: "Western" },
  { city: "Peliyagoda", district: "Gampaha", province: "Western" },
  { city: "Ragama", district: "Gampaha", province: "Western" },
  { city: "Ja-Ela", district: "Gampaha", province: "Western" },
  { city: "Kadawatha", district: "Gampaha", province: "Western" },
  { city: "Kiribathgoda", district: "Gampaha", province: "Western" },
  { city: "Nittambuwa", district: "Gampaha", province: "Western" },
  { city: "Minuwangoda", district: "Gampaha", province: "Western" },
  { city: "Veyangoda", district: "Gampaha", province: "Western" },
  { city: "Mirigama", district: "Gampaha", province: "Western" },
  { city: "Yakkala", district: "Gampaha", province: "Western" },
  { city: "Katunayake", district: "Gampaha", province: "Western" },

  // Kalutara District - Western Province
  { city: "Kalutara", district: "Kalutara", province: "Western" },
  { city: "Panadura", district: "Kalutara", province: "Western" },
  { city: "Horana", district: "Kalutara", province: "Western" },
  { city: "Beruwala", district: "Kalutara", province: "Western" },
  { city: "Aluthgama", district: "Kalutara", province: "Western" },
  { city: "Matugama", district: "Kalutara", province: "Western" },
  { city: "Bandaragama", district: "Kalutara", province: "Western" },
  { city: "Wadduwa", district: "Kalutara", province: "Western" },

  // Kandy District - Central Province
  { city: "Kandy", district: "Kandy", province: "Central" },
  { city: "Gampola", district: "Kandy", province: "Central" },
  { city: "Peradeniya", district: "Kandy", province: "Central" },
  { city: "Katugastota", district: "Kandy", province: "Central" },
  { city: "Kundasale", district: "Kandy", province: "Central" },
  { city: "Akurana", district: "Kandy", province: "Central" },
  { city: "Nawalapitiya", district: "Kandy", province: "Central" },
  { city: "Digana", district: "Kandy", province: "Central" },
  { city: "Pilimathalawa", district: "Kandy", province: "Central" },
  { city: "Deltota", district: "Kandy", province: "Central" },
  { city: "Gelioya", district: "Kandy", province: "Central" },
  { city: "Wattegama", district: "Kandy", province: "Central" },

  // Matale District - Central Province
  { city: "Matale", district: "Matale", province: "Central" },
  { city: "Dambulla", district: "Matale", province: "Central" },
  { city: "Sigiriya", district: "Matale", province: "Central" },
  { city: "Ukuwela", district: "Matale", province: "Central" },
  { city: "Rattota", district: "Matale", province: "Central" },

  // Nuwara Eliya District - Central Province
  { city: "Nuwara Eliya", district: "Nuwara Eliya", province: "Central" },
  { city: "Hatton", district: "Nuwara Eliya", province: "Central" },
  { city: "Talawakele", district: "Nuwara Eliya", province: "Central" },
  { city: "Ginigathena", district: "Nuwara Eliya", province: "Central" },
  { city: "Nanu Oya", district: "Nuwara Eliya", province: "Central" },

  // Galle District - Southern Province
  { city: "Galle", district: "Galle", province: "Southern" },
  { city: "Unawatuna", district: "Galle", province: "Southern" },
  { city: "Hikkaduwa", district: "Galle", province: "Southern" },
  { city: "Ambalangoda", district: "Galle", province: "Southern" },
  { city: "Karapitiya", district: "Galle", province: "Southern" },
  { city: "Elpitiya", district: "Galle", province: "Southern" },
  { city: "Baddegama", district: "Galle", province: "Southern" },
  { city: "Ahangama", district: "Galle", province: "Southern" },

  // Matara District - Southern Province
  { city: "Matara", district: "Matara", province: "Southern" },
  { city: "Weligama", district: "Matara", province: "Southern" },
  { city: "Mirissa", district: "Matara", province: "Southern" },
  { city: "Akuressa", district: "Matara", province: "Southern" },
  { city: "Dickwella", district: "Matara", province: "Southern" },
  { city: "Hakmana", district: "Matara", province: "Southern" },
  { city: "Kamburupitiya", district: "Matara", province: "Southern" },

  // Hambantota District - Southern Province
  { city: "Hambantota", district: "Hambantota", province: "Southern" },
  { city: "Tangalle", district: "Hambantota", province: "Southern" },
  { city: "Beliatta", district: "Hambantota", province: "Southern" },
  { city: "Ambalantota", district: "Hambantota", province: "Southern" },
  { city: "Tissamaharama", district: "Hambantota", province: "Southern" },

  // Ratnapura District - Sabaragamuwa Province
  { city: "Ratnapura", district: "Ratnapura", province: "Sabaragamuwa" },
  { city: "Eheliyagoda", district: "Ratnapura", province: "Sabaragamuwa" },
  { city: "Pohorabawa", district: "Ratnapura", province: "Sabaragamuwa" },
  { city: "Balangoda", district: "Ratnapura", province: "Sabaragamuwa" },
  { city: "Embilipitiya", district: "Ratnapura", province: "Sabaragamuwa" },
  { city: "Pelmadulla", district: "Ratnapura", province: "Sabaragamuwa" },
  { city: "Kuruwita", district: "Ratnapura", province: "Sabaragamuwa" },
  { city: "Godakawela", district: "Ratnapura", province: "Sabaragamuwa" },

  // Kegalle District - Sabaragamuwa Province
  { city: "Kegalle", district: "Kegalle", province: "Sabaragamuwa" },
  { city: "Mawanella", district: "Kegalle", province: "Sabaragamuwa" },
  { city: "Rambukkana", district: "Kegalle", province: "Sabaragamuwa" },
  { city: "Ruwanwella", district: "Kegalle", province: "Sabaragamuwa" },
  { city: "Dehiowita", district: "Kegalle", province: "Sabaragamuwa" },
  { city: "Deraniyagala", district: "Kegalle", province: "Sabaragamuwa" },

  // Kurunegala District - North Western Province
  { city: "Kurunegala", district: "Kurunegala", province: "North Western" },
  { city: "Kuliyapitiya", district: "Kurunegala", province: "North Western" },
  { city: "Narammala", district: "Kurunegala", province: "North Western" },
  { city: "Ibbagamuwa", district: "Kurunegala", province: "North Western" },
  { city: "Wariyapola", district: "Kurunegala", province: "North Western" },
  { city: "Mawathagama", district: "Kurunegala", province: "North Western" },
  { city: "Polgahawela", district: "Kurunegala", province: "North Western" },
  { city: "Pannala", district: "Kurunegala", province: "North Western" },

  // Puttalam District - North Western Province
  { city: "Chilaw", district: "Puttalam", province: "North Western" },
  { city: "Puttalam", district: "Puttalam", province: "North Western" },
  { city: "Wennappuwa", district: "Puttalam", province: "North Western" },
  { city: "Marawila", district: "Puttalam", province: "North Western" },
  { city: "Dankotuwa", district: "Puttalam", province: "North Western" },
  { city: "Anamaduwa", district: "Puttalam", province: "North Western" },

  // Anuradhapura District - North Central Province
  { city: "Anuradhapura", district: "Anuradhapura", province: "North Central" },
  { city: "Mihintale", district: "Anuradhapura", province: "North Central" },
  { city: "Kekirawa", district: "Anuradhapura", province: "North Central" },
  { city: "Eppawala", district: "Anuradhapura", province: "North Central" },
  { city: "Medawachchiya", district: "Anuradhapura", province: "North Central" },
  { city: "Galenbindunuwewa", district: "Anuradhapura", province: "North Central" },

  // Polonnaruwa District - North Central Province
  { city: "Polonnaruwa", district: "Polonnaruwa", province: "North Central" },
  { city: "Kaduruwela", district: "Polonnaruwa", province: "North Central" },
  { city: "Medirigiriya", district: "Polonnaruwa", province: "North Central" },
  { city: "Hingurakgoda", district: "Polonnaruwa", province: "North Central" },

  // Badulla District - Uva Province
  { city: "Badulla", district: "Badulla", province: "Uva" },
  { city: "Bandarawela", district: "Badulla", province: "Uva" },
  { city: "Haputale", district: "Badulla", province: "Uva" },
  { city: "Welimada", district: "Badulla", province: "Uva" },
  { city: "Diyatalawa", district: "Badulla", province: "Uva" },
  { city: "Ella", district: "Badulla", province: "Uva" },
  { city: "Mahiyanganaya", district: "Badulla", province: "Uva" },

  // Monaragala District - Uva Province
  { city: "Monaragala", district: "Monaragala", province: "Uva" },
  { city: "Bibile", district: "Monaragala", province: "Uva" },
  { city: "Wellawaya", district: "Monaragala", province: "Uva" },
  { city: "Buttala", district: "Monaragala", province: "Uva" },
  { city: "Kataragama", district: "Monaragala", province: "Uva" },

  // Jaffna District - Northern Province
  { city: "Jaffna", district: "Jaffna", province: "Northern" },
  { city: "Chavakachcheri", district: "Jaffna", province: "Northern" },
  { city: "Point Pedro", district: "Jaffna", province: "Northern" },
  { city: "Kankesanthurai", district: "Jaffna", province: "Northern" },
  { city: "Karainagar", district: "Jaffna", province: "Northern" },

  // Others in Northern Province
  { city: "Kilinochchi", district: "Kilinochchi", province: "Northern" },
  { city: "Mannar", district: "Mannar", province: "Northern" },
  { city: "Vavuniya", district: "Vavuniya", province: "Northern" },
  { city: "Mullaitivu", district: "Mullaitivu", province: "Northern" },

  // Trincomalee District - Eastern Province
  { city: "Trincomalee", district: "Trincomalee", province: "Eastern" },
  { city: "Kinniya", district: "Trincomalee", province: "Eastern" },
  { city: "Mutur", district: "Trincomalee", province: "Eastern" },

  // Batticaloa District - Eastern Province
  { city: "Batticaloa", district: "Batticaloa", province: "Eastern" },
  { city: "Eravur", district: "Batticaloa", province: "Eastern" },
  { city: "Kattankudy", district: "Batticaloa", province: "Eastern" },
  { city: "Valachchenai", district: "Batticaloa", province: "Eastern" },

  // Ampara District - Eastern Province
  { city: "Ampara", district: "Ampara", province: "Eastern" },
  { city: "Kalmunai", district: "Ampara", province: "Eastern" },
  { city: "Sainthamaruthu", district: "Ampara", province: "Eastern" },
  { city: "Sammanthurai", district: "Ampara", province: "Eastern" },
  { city: "Akkaraipattu", district: "Ampara", province: "Eastern" }
];

export function lookupCity(cityName: string): CityLocation | null {
  const norm = cityName.trim().toLowerCase().replace(/[\s\-_]/g, "");
  if (!norm) return null;

  // Exact or close match
  let matched = SRI_LANKAN_CITIES.find(
    (c) => c.city.toLowerCase().replace(/[\s\-_]/g, "") === norm
  );

  if (matched) return matched;

  // Search part of word
  matched = SRI_LANKAN_CITIES.find(
    (c) => c.city.toLowerCase().includes(norm) || norm.includes(c.city.toLowerCase())
  );

  return matched || null;
}

export function getStandardizedCourierAddress(
  line1: string,
  line2: string,
  city: string,
  district: string
): string {
  const cLine1 = (line1 || "").trim();
  const cLine2 = (line2 || "").trim();
  const cCity = (city || "").trim();
  const cDistrict = (district || "").trim();

  // Combine address lines
  let combined = cLine1;
  if (cLine2) {
    if (combined && !combined.endsWith(",")) {
      combined += ",";
    }
    combined += " " + cLine2;
  }

  // If already formatted in standardized format & ends with district, do not over-write
  if (combined.toLowerCase().endsWith(cDistrict.toLowerCase()) && combined.split(",").length >= 4) {
    return combined;
  }

  // Define components
  let housePart = "";
  let streetPart = "";
  let villageAreaPart = "";

  // 1. DYNAMIC HOUSE / NO DETECTION
  const houseRegex = /(?:no\.?|no\s+|නො(?:ම්මර)?\.?\s*)(\d+[-/A-Za-z0-9]*)(\s*,)?/i;
  let houseMatch = combined.match(houseRegex);
  if (houseMatch) {
    housePart = `No. ${houseMatch[1].trim()}`;
  } else {
    const startNum = combined.match(/^\s*(\d+[-/A-Za-z0-9]*)\b/);
    if (startNum) {
      housePart = `No. ${startNum[1].trim()}`;
    } else {
      const buildingKeywords = ["villa", "house", "home", "lodge", "cottage", "නිවස", "නවස", "වලව්ව", "walauwa"];
      const segments = combined.split(/[,.\n]+/).map(s => s.trim()).filter(Boolean);
      const bMatch = segments.find(s => buildingKeywords.some(kw => s.toLowerCase().includes(kw)));
      if (bMatch) {
        housePart = bMatch;
      } else {
        housePart = "";
      }
    }
  }

  // 2. DYNAMIC STREET / ROAD DETECTION
  const streetKeywords = ["road", "rd", "පාර", "mawatha", "මාවත", "lane", "ලේන්", "street", "st"];
  const segments = combined.split(/[,.\n]+/).map(s => s.trim()).filter(Boolean);
  const sMatch = segments.find(s => streetKeywords.some(kw => new RegExp(kw, "i").test(s)));
  if (sMatch) {
    streetPart = sMatch;
  } else {
    const remParts = segments.filter(
      s => s !== housePart && 
      s.toLowerCase() !== cCity.toLowerCase() && 
      s.toLowerCase() !== cDistrict.toLowerCase()
    );
    if (remParts.length > 0) {
      streetPart = remParts[0];
    } else {
      streetPart = "";
    }
  }

  // 3. VILLAGE / AREA DETECTION
  const leftoverSegments = segments.filter(
    s => s !== housePart && 
         s !== streetPart && 
         s.toLowerCase() !== cCity.toLowerCase() && 
         s.toLowerCase() !== cDistrict.toLowerCase() && 
         s.length > 2
  );

  if (leftoverSegments.length > 0) {
    villageAreaPart = leftoverSegments[0];
  } else {
    villageAreaPart = cCity;
  }

  const clean = (text: string) => {
    return text.replace(/^[,.\s]+|[,.\s]+$/g, "").trim();
  };

  const fHouse = clean(housePart);
  const fStreet = clean(streetPart);
  const fVillage = clean(villageAreaPart);
  const fCity = clean(cCity);
  const fDistrict = clean(cDistrict);

  // Build the list of components that are valid (non-empty, non-placeholder and not duplicated)
  const parts: string[] = [];
  if (fHouse && fHouse !== "No/House Name") {
    parts.push(fHouse);
  }
  if (fStreet && fStreet !== "Street Name" && fStreet.toLowerCase() !== fHouse.toLowerCase()) {
    parts.push(fStreet);
  }
  if (fVillage && fVillage.toLowerCase() !== fStreet.toLowerCase() && fVillage.toLowerCase() !== fCity.toLowerCase()) {
    parts.push(fVillage);
  }
  if (fCity) {
    parts.push(fCity);
  }
  if (fDistrict && fDistrict.toLowerCase() !== fCity.toLowerCase()) {
    parts.push(fDistrict);
  }

  return parts.join(", ");
}
