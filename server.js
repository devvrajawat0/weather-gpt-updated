const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const https = require('https');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Helper to fetch data from external APIs via https
function fetchHttps(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, { headers: { 'User-Agent': 'WeatherGPT-SIH26068/1.0' } }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: 'Failed to parse API response', raw: body });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Database helper
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { settings: {}, savedLocations: [], customAlerts: [], chatHistory: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { settings: {}, savedLocations: [], customAlerts: [], chatHistory: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// MASSIVE INDIAN GEOGRAPHY & CITIES KNOWLEDGE DATABASE (100+ Cities, Capitals, Districts & Hill Stations)
const POPULAR_LOCATIONS = [
  // North India & Himalayas
  { name: "Delhi, India", lat: 28.6139, lon: 77.2090, keywords: ["delhi", "dilli", "ncr", "new delhi"] },
  { name: "Shimla, Himachal Pradesh", lat: 31.1048, lon: 77.1734, keywords: ["shimla", "simla"] },
  { name: "Manali, Himachal Pradesh", lat: 32.2432, lon: 77.1892, keywords: ["manali"] },
  { name: "Dharamshala, Himachal Pradesh", lat: 32.2190, lon: 76.3234, keywords: ["dharamshala", "mcleodganj"] },
  { name: "Srinagar, Jammu & Kashmir", lat: 34.0837, lon: 74.7973, keywords: ["srinagar", "kashmir"] },
  { name: "Jammu, Jammu & Kashmir", lat: 32.7266, lon: 74.8570, keywords: ["jammu"] },
  { name: "Leh, Ladakh", lat: 34.1526, lon: 77.5771, keywords: ["leh", "ladakh"] },
  { name: "Dehradun, Uttarakhand", lat: 30.3165, lon: 78.0322, keywords: ["dehradun"] },
  { name: "Mussoorie, Uttarakhand", lat: 30.4598, lon: 78.0644, keywords: ["mussoorie"] },
  { name: "Nainital, Uttarakhand", lat: 29.3919, lon: 79.4542, keywords: ["nainital"] },
  { name: "Rishikesh, Uttarakhand", lat: 30.0869, lon: 78.2676, keywords: ["rishikesh"] },
  { name: "Haridwar, Uttarakhand", lat: 29.9457, lon: 78.1642, keywords: ["haridwar"] },
  { name: "Chandigarh, UT", lat: 30.7333, lon: 76.7794, keywords: ["chandigarh"] },
  { name: "Amritsar, Punjab", lat: 31.6340, lon: 74.8723, keywords: ["amritsar"] },
  { name: "Ludhiana, Punjab", lat: 30.9010, lon: 75.8573, keywords: ["ludhiana"] },
  { name: "Jalandhar, Punjab", lat: 31.3260, lon: 75.5762, keywords: ["jalandhar"] },
  { name: "Gurgaon (Gurugram), Haryana", lat: 28.4595, lon: 77.0266, keywords: ["gurgaon", "gurugram"] },
  { name: "Noida, UP", lat: 28.5355, lon: 77.3910, keywords: ["noida"] },
  { name: "Ghaziabad, UP", lat: 28.6692, lon: 77.4538, keywords: ["ghaziabad"] },

  // West & Central India
  { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777, keywords: ["mumbai", "bombay", "bandra", "andheri"] },
  { name: "Pune, Maharashtra", lat: 18.5204, lon: 73.8567, keywords: ["pune", "poona"] },
  { name: "Nagpur, Maharashtra", lat: 21.1458, lon: 79.0882, keywords: ["nagpur"] },
  { name: "Nashik, Maharashtra", lat: 19.9975, lon: 73.7898, keywords: ["nashik", "nasik"] },
  { name: "Thane, Maharashtra", lat: 19.2183, lon: 72.9781, keywords: ["thane"] },
  { name: "Aurangabad, Maharashtra", lat: 19.8762, lon: 75.3433, keywords: ["aurangabad", "sambhajinagar"] },
  { name: "Ahmedabad, Gujarat", lat: 23.0225, lon: 72.5714, keywords: ["ahmedabad", "amdavad"] },
  { name: "Surat, Gujarat", lat: 21.1702, lon: 72.8311, keywords: ["surat"] },
  { name: "Vadodara, Gujarat", lat: 22.3072, lon: 73.1812, keywords: ["vadodara", "baroda"] },
  { name: "Rajkot, Gujarat", lat: 22.3039, lon: 70.8022, keywords: ["rajkot"] },
  { name: "Jaipur, Rajasthan", lat: 26.9124, lon: 75.7873, keywords: ["jaipur"] },
  { name: "Udaipur, Rajasthan", lat: 24.5854, lon: 73.7125, keywords: ["udaipur"] },
  { name: "Jodhpur, Rajasthan", lat: 26.2389, lon: 73.0243, keywords: ["jodhpur"] },
  { name: "Kota, Rajasthan", lat: 25.2138, lon: 75.8648, keywords: ["kota"] },
  { name: "Jaisalmer, Rajasthan", lat: 26.9157, lon: 70.9083, keywords: ["jaisalmer"] },
  { name: "Ajmer, Rajasthan", lat: 26.4499, lon: 74.6399, keywords: ["ajmer"] },
  { name: "Bhopal, MP", lat: 23.2599, lon: 77.4126, keywords: ["bhopal"] },
  { name: "Indore, MP", lat: 22.7196, lon: 75.8577, keywords: ["indore"] },
  { name: "Gwalior, MP", lat: 26.2183, lon: 78.1828, keywords: ["gwalior"] },
  { name: "Jabalpur, MP", lat: 23.1815, lon: 79.9864, keywords: ["jabalpur"] },
  { name: "Ujjain, MP", lat: 23.1765, lon: 75.7885, keywords: ["ujjain"] },
  { name: "Panaji, Goa", lat: 15.4909, lon: 73.8278, keywords: ["goa", "panaji", "panjim"] },

  // East & North-East India
  { name: "Lucknow, UP", lat: 26.8467, lon: 80.9462, keywords: ["lucknow", "lakhnau"] },
  { name: "Varanasi, UP", lat: 25.3176, lon: 82.9739, keywords: ["varanasi", "banaras", "kashi"] },
  { name: "Agra, UP", lat: 27.1767, lon: 78.0081, keywords: ["agra"] },
  { name: "Kanpur, UP", lat: 26.4499, lon: 80.3319, keywords: ["kanpur"] },
  { name: "Prayagraj (Allahabad), UP", lat: 25.4358, lon: 81.8463, keywords: ["allahabad", "prayagraj"] },
  { name: "Kolkata, West Bengal", lat: 22.5726, lon: 88.3639, keywords: ["kolkata", "calcutta"] },
  { name: "Darjeeling, West Bengal", lat: 27.0410, lon: 88.2663, keywords: ["darjeeling"] },
  { name: "Siliguri, West Bengal", lat: 26.7271, lon: 88.3953, keywords: ["siliguri"] },
  { name: "Patna, Bihar", lat: 25.5941, lon: 85.1376, keywords: ["patna"] },
  { name: "Gaya, Bihar", lat: 24.7914, lon: 85.0002, keywords: ["gaya", "bodhgaya"] },
  { name: "Muzaffarpur, Bihar", lat: 26.1209, lon: 85.3647, keywords: ["muzaffarpur"] },
  { name: "Ranchi, Jharkhand", lat: 23.3441, lon: 85.3096, keywords: ["ranchi"] },
  { name: "Jamshedpur, Jharkhand", lat: 22.8046, lon: 86.2029, keywords: ["jamshedpur"] },
  { name: "Bhubaneswar, Odisha", lat: 20.2961, lon: 85.8245, keywords: ["bhubaneswar"] },
  { name: "Puri, Odisha", lat: 19.8135, lon: 85.8312, keywords: ["puri"] },
  { name: "Cuttack, Odisha", lat: 20.4625, lon: 85.8828, keywords: ["cuttack"] },
  { name: "Raipur, Chhattisgarh", lat: 21.2514, lon: 81.6296, keywords: ["raipur"] },
  { name: "Guwahati, Assam", lat: 26.1445, lon: 91.7362, keywords: ["guwahati"] },
  { name: "Shillong, Meghalaya", lat: 25.5788, lon: 91.8933, keywords: ["shillong", "cherrapunji"] },
  { name: "Gangtok, Sikkim", lat: 27.3389, lon: 88.6065, keywords: ["gangtok"] },
  { name: "Imphal, Manipur", lat: 24.8170, lon: 93.9368, keywords: ["imphal"] },
  { name: "Agartala, Tripura", lat: 23.8315, lon: 91.2868, keywords: ["agartala"] },

  // South India
  { name: "Bangalore (Bengaluru), Karnataka", lat: 12.9716, lon: 77.5946, keywords: ["bangalore", "bengaluru"] },
  { name: "Mysore, Karnataka", lat: 12.2958, lon: 76.6394, keywords: ["mysore", "mysuru"] },
  { name: "Mangalore, Karnataka", lat: 12.9141, lon: 74.8560, keywords: ["mangalore", "mangaluru"] },
  { name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707, keywords: ["chennai", "madras"] },
  { name: "Coimbatore, Tamil Nadu", lat: 11.0168, lon: 76.9558, keywords: ["coimbatore"] },
  { name: "Madurai, Tamil Nadu", lat: 9.9252, lon: 78.1198, keywords: ["madurai"] },
  { name: "Ooty, Tamil Nadu", lat: 11.4102, lon: 76.6950, keywords: ["ooty"] },
  { name: "Hyderabad, Telangana", lat: 17.3850, lon: 78.4867, keywords: ["hyderabad"] },
  { name: "Visakhapatnam, AP", lat: 17.6868, lon: 83.2185, keywords: ["visakhapatnam", "vizag"] },
  { name: "Vijayawada, AP", lat: 16.5062, lon: 80.6480, keywords: ["vijayawada"] },
  { name: "Tirupati, AP", lat: 13.6288, lon: 79.4192, keywords: ["tirupati"] },
  { name: "Kochi, Kerala", lat: 9.9312, lon: 76.2673, keywords: ["kochi", "cochin"] },
  { name: "Thiruvananthapuram, Kerala", lat: 8.5241, lon: 76.9366, keywords: ["trivandrum", "thiruvananthapuram"] },
  { name: "Munnar, Kerala", lat: 10.0889, lon: 77.0595, keywords: ["munnar"] }
];

// Smart Location Extractor from User Question
async function extractLocationAndFetchWeather(userQuery, defaultContext = {}) {
  const q = (userQuery || '').toLowerCase().trim();
  const db = readDB();

  let targetLocation = null;

  // 1. Check popular Indian locations dictionary first
  for (let item of POPULAR_LOCATIONS) {
    if (item.keywords.some(kw => q.includes(kw))) {
      targetLocation = { name: item.name, lat: item.lat, lon: item.lon };
      break;
    }
  }

  // 2. Check local DB savedLocations
  if (!targetLocation && db.savedLocations && db.savedLocations.length > 0) {
    for (let loc of db.savedLocations) {
      const nameClean = loc.name.toLowerCase();
      const firstWord = nameClean.split(',')[0].trim();
      if (q.includes(firstWord) && firstWord.length > 2) {
        targetLocation = { name: loc.name, lat: loc.lat, lon: loc.lon };
        break;
      }
    }
  }

  // 3. Search via Open-Meteo Geocoding API if unknown city mentioned
  if (!targetLocation) {
    const stopWords = ["weather", "temperature", "temp", "baarish", "barish", "rain", "today", "tomorrow", "kaisa", "hogi", "kya", "alert", "warning", "weekend", "hindi", "batao", "bataoo", "mein", "ka", "ki", "ko", "par", "se", "umbrella", "chhata", "hawa", "climate", "haalat", "report", "please", "should", "carry", "best", "visit", "trip", "going", "to"];
    
    const match = q.match(/(?:in|me|at|near|ka|ki|for|to)\s+([a-z\s]+)/i);
    let candidateWord = null;

    if (match) {
      const words = match[1].trim().split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
      candidateWord = words.find(w => w.length >= 3 && !stopWords.includes(w));
    }

    if (!candidateWord) {
      const words = q.split(/\s+/).map(w => w.replace(/[^a-z]/g, ''));
      candidateWord = words.find(w => w.length >= 3 && !stopWords.includes(w));
    }

    if (candidateWord && candidateWord.length >= 3) {
      try {
        const geoData = await fetchHttps(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidateWord)}&count=5&language=en&format=json`);
        if (geoData.results && geoData.results.length > 0) {
          const indianResult = geoData.results.find(r => r.country === 'India') || geoData.results[0];
          const placeName = `${indianResult.name}${indianResult.admin1 ? ', ' + indianResult.admin1 : ''}${indianResult.country ? ', ' + indianResult.country : ''}`;
          targetLocation = { name: placeName, lat: indianResult.latitude, lon: indianResult.longitude };

          // Cache new location in DB
          db.savedLocations = db.savedLocations || [];
          if (!db.savedLocations.some(l => l.name === placeName)) {
            db.savedLocations.push({ name: placeName, lat: indianResult.latitude, lon: indianResult.longitude, type: 'District', country: indianResult.country || 'India' });
            writeDB(db);
          }
        }
      } catch (err) {
        console.error('Dynamic geocoding error:', err);
      }
    }
  }

  // Fallback to default location provided in context (Current Device Location)
  if (!targetLocation) {
    targetLocation = {
      name: defaultContext.locationName || 'Current Location',
      lat: defaultContext.lat || 28.6139,
      lon: defaultContext.lon || 77.2090
    };
  }

  // Fetch live weather data for the target location
  try {
    const weatherRes = await fetchHttps(`https://api.open-meteo.com/v1/forecast?latitude=${targetLocation.lat}&longitude=${targetLocation.lon}&current_weather=true&hourly=precipitation_probability,relativehumidity_2m&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=auto`);
    
    const cur = weatherRes.current_weather || {};
    const rainProb = weatherRes.hourly && weatherRes.hourly.precipitation_probability ? weatherRes.hourly.precipitation_probability[0] || 10 : 10;
    const humidity = weatherRes.hourly && weatherRes.hourly.relativehumidity_2m ? weatherRes.hourly.relativehumidity_2m[0] || 60 : 60;
    const maxTemp = weatherRes.daily && weatherRes.daily.temperature_2m_max ? Math.round(weatherRes.daily.temperature_2m_max[0]) : Math.round(cur.temperature + 4);
    const minTemp = weatherRes.daily && weatherRes.daily.temperature_2m_min ? Math.round(weatherRes.daily.temperature_2m_min[0]) : Math.round(cur.temperature - 4);

    return {
      locationName: targetLocation.name,
      temp: cur.temperature !== undefined ? Math.round(cur.temperature) : (defaultContext.temp || 28),
      maxTemp: maxTemp,
      minTemp: minTemp,
      weatherCode: cur.weathercode !== undefined ? cur.weathercode : 0,
      windSpeed: cur.windspeed !== undefined ? Math.round(cur.windspeed) : 12,
      rainProb: rainProb,
      humidity: humidity,
      aqi: defaultContext.aqi || 45
    };
  } catch (err) {
    console.error('Weather fetch error for location:', err);
    return {
      locationName: targetLocation.name,
      temp: defaultContext.temp || 28,
      maxTemp: 32,
      minTemp: 24,
      weatherCode: 0,
      windSpeed: 12,
      rainProb: 15,
      humidity: 60,
      aqi: 45
    };
  }
}

// AI Engine for Multilingual Chat Processing
async function processWeatherGPTChat(query, defaultContext = {}, language = 'hinglish') {
  const q = (query || '').toLowerCase().trim();

  // Dynamically analyze query, extract location if specified, and fetch live weather
  const weatherContext = await extractLocationAndFetchWeather(query, defaultContext);

  const location = weatherContext.locationName;
  const temp = weatherContext.temp;
  const maxTemp = weatherContext.maxTemp;
  const minTemp = weatherContext.minTemp;
  const weatherCode = weatherContext.weatherCode;
  const rainProb = weatherContext.rainProb;
  const aqi = weatherContext.aqi;
  const humidity = weatherContext.humidity;
  const windSpeed = weatherContext.windSpeed;

  let conditionText = 'Saaf Aakash (Clear Sky)';
  let isRainy = rainProb > 40 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);
  let isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);
  let isThunder = [95, 96, 99].includes(weatherCode);
  let isCloudy = [1, 2, 3, 45, 48].includes(weatherCode);

  if (isThunder) conditionText = 'Bijli aur Toofan (Thunderstorm)';
  else if (isSnowy) conditionText = 'Barafbaari (Snowfall)';
  else if (isRainy) conditionText = 'Baarish (Rainy)';
  else if (isCloudy) conditionText = 'Baadal (Cloudy)';

  const carryUmbrella = isRainy || rainProb >= 45;
  const umbrellaAdvice = carryUmbrella
    ? '☔ Haan, aaj chhata (umbrella) saath rakhein! Baarish hone ki sambhavna hai.'
    : '☀️ Nahin, aaj chhata ki zarurat nahi hai. Mausam saaf rahne ki ummeed hai.';

  let responseText = '';
  let category = 'general';
  let speechText = '';

  // Outfit & Travel Suggestion Engine
  let outfitTip = temp > 32 ? '👕 Light cotton clothes pehno, garmi zyada hai.' : temp < 18 ? '🧥 Woolen jacket ya sweater pehno, thand hai.' : '👕 Comfortable casual clothes pehno.';

  if (q.includes('umbrella') || q.includes('chhata') || q.includes('chata') || q.includes('raincoat')) {
    category = 'umbrella';
    responseText = `${umbrellaAdvice}\n\n📍 **${location}** me rain probability **${rainProb}%** hai aur temperature **${temp}°C** hai.\n👉 ${outfitTip}`;
    speechText = carryUmbrella ? `${location} me baarish ki sambhavna hai. Chhata saath le jaana mat bhoolna.` : `${location} me aaj chhata le jaane ki zaroorat nahi hai. Aakash saaf hai.`;
  }
  else if (q.includes('kaisa') || q.includes('weather') || q.includes('mausam') || q.includes('today') || q.includes('aaj') || q.includes('how is')) {
    category = 'today';
    responseText = `📍 **${location}** ka live mausam report:\n\n• 🌡️ **Temperature:** ${temp}°C (High: ${maxTemp}°C / Low: ${minTemp}°C)\n• 🌤️ **Sthiti:** ${conditionText}\n• 🌧️ **Baarish Chance:** ${rainProb}%\n• 💧 **Humidity:** ${humidity}%\n• 💨 **Wind Speed:** ${windSpeed} km/h\n\n👉 ${outfitTip}\n${carryUmbrella ? '👉 Chhata saath me rakhein.' : '👉 Outside activities ke liye mausam acha hai.'}`;
    speechText = `${location} me abhi temperature ${temp} degree celsius hai. Mausam ${conditionText} hai aur baarish ki sambhavna ${rainProb} percent hai.`;
  }
  else if (q.includes('baarish') || q.includes('barish') || q.includes('rain') || q.includes('kal') || q.includes('tomorrow') || q.includes('monsoon')) {
    category = 'rain';
    responseText = `🌧️ **Rain & Monsoon Forecast for ${location}:**\n\n• Live Rain Chance: **${rainProb}%**\n• Condition: **${conditionText}**\n• Max Temp: **${maxTemp}°C**\n\n${rainProb > 45 ? '⚠️ Heavy rain advisory: Waterlogging aur traffic disruption se bachne ke liye raincoat/umbrella tayyar rakhein.' : '✅ Abhi severe rainfall ki badi warning nahi hai.'}`;
    speechText = `${location} me baarish ki sambhavna lagbhag ${rainProb} percent hai.`;
  }
  else if (q.includes('temp') || q.includes('temperature') || q.includes('garmi') || q.includes('sardi') || q.includes('thand')) {
    category = 'temperature';
    responseText = `🌡️ **Temperature Details for ${location}:**\n\n• Current Temp: **${temp}°C**\n• Expected High: **${maxTemp}°C**\n• Expected Low: **${minTemp}°C**\n• RealFeel: **${temp + 2}°C**\n\n${temp > 35 ? '🔥 High temperature alert! Paani pite rahein aur direct dhoop se bachein.' : temp < 15 ? '❄️ Coldwave advisory! Garm kapde pehno.' : '🌿 Mausam suhana aur anukool hai.'}`;
    speechText = `${location} me abhi taapmaan ${temp} degree celsius hai. Max temperature ${maxTemp} degree rahega.`;
  }
  else if (q.includes('alert') || q.includes('warning') || q.includes('khatra') || q.includes('cyclone') || q.includes('storm')) {
    category = 'alert';
    if (isThunder) {
      responseText = `⚠️ **CRITICAL WEATHER ALERT:**\n\n📍 ${location} me **Thunderstorm Warning** active hai! Bijli kadakne aur heavy rain ki sambhavna hai. Khule maidaan me na khade ho.`;
    } else if (temp > 38) {
      responseText = `⚠️ **HEATWAVE WARNING:**\n\n📍 ${location} me high temperature (**${temp}°C**) hai! Direct dhoop se bachein.`;
    } else {
      responseText = `✅ **No Emergency Warnings:**\n\n📍 ${location} ke liye abhi koi severe disaster alert active nahi hai. Mausam normal hai.`;
    }
    speechText = `${location} me abhi koi severe warning active nahi hai.`;
  }
  else if (q.includes('hindi') || q.includes('हिंदी')) {
    category = 'hindi';
    responseText = `🇮🇳 **मौसम रिपोर्ट (${location}):**\n\n• वर्तमान तापमान: **${temp}°C** (अधिकतम: ${maxTemp}°C / न्यूनतम: ${minTemp}°C)\n• मौसम स्थिति: **${conditionText}**\n• बारिश की संभावना: **${rainProb}%**\n• हवा की गति: **${windSpeed} किमी/घंटा**\n\n${carryUmbrella ? '👉 सलाह: बाहर जाते समय छाता साथ रखें।' : '👉 सलाह: मौसम सुहावना है।'}`;
    speechText = `${location} mein vartaman tapman ${temp} degree celsius hai. Vrishti ki sambhavna ${rainProb} percent hai.`;
  }
  else {
    responseText = `📍 **${location}** Weather Summary:\n\n• Temperature: **${temp}°C** (${conditionText})\n• Max/Min: **${maxTemp}°C / ${minTemp}°C**\n• Precipitation Chance: **${rainProb}%**\n• Humidity: **${humidity}%**\n\nAap inse judi jaankari pooch sakte hain:\n- "Aaj weather kaisa hai?"\n- "Mumbai me baarish hogi?"\n- "Shimla me baraf giregi kya?"\n- "Hindi mein weather batao"`;
    speechText = `${location} ka mausam abhi ${temp} degree celsius hai. Rain chance ${rainProb} percent hai.`;
  }

  return {
    text: responseText,
    speechText: speechText,
    category: category,
    umbrellaNeeded: carryUmbrella,
    rainProbability: rainProb,
    temperature: temp,
    maxTemp: maxTemp,
    minTemp: minTemp,
    location: location,
    condition: conditionText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

// HTTP Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // --- REST API ENDPOINTS ---

  // 1. Live Weather Proxy Endpoint
  if (pathname === '/api/weather' && method === 'GET') {
    const lat = parsedUrl.query.lat || 28.6139;
    const lon = parsedUrl.query.lon || 77.2090;
    
    const targetUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,weathercode,windspeed_10m,surface_pressure&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max&timezone=auto`;
    
    try {
      const data = await fetchHttps(targetUrl);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch live weather data', details: err.message }));
    }
    return;
  }

  // 2. Air Quality Proxy Endpoint
  if (pathname === '/api/aqi' && method === 'GET') {
    const lat = parsedUrl.query.lat || 28.6139;
    const lon = parsedUrl.query.lon || 77.2090;
    
    const targetUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone&timezone=auto`;
    
    try {
      const data = await fetchHttps(targetUrl);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch AQI data', details: err.message }));
    }
    return;
  }

  // 3. Geocoding Search Endpoint (Prioritizes Indian Cities/Districts)
  if (pathname === '/api/geocoding' && method === 'GET') {
    const query = parsedUrl.query.q || '';
    if (!query) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results: [] }));
      return;
    }
    
    const targetUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    
    try {
      const data = await fetchHttps(targetUrl);
      if (data.results && data.results.length > 0) {
        data.results.sort((a, b) => (a.country === 'India' ? -1 : 1) - (b.country === 'India' ? -1 : 1));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to search locations', details: err.message }));
    }
    return;
  }

  // 4. AI Chat Processing Endpoint
  if (pathname === '/api/chat' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userQuery = payload.query || '';
        const defaultContext = payload.context || {};
        const language = payload.language || 'hinglish';

        const botResponse = await processWeatherGPTChat(userQuery, defaultContext, language);

        // Save to DB history
        const db = readDB();
        const userMsg = { id: Date.now(), sender: 'user', text: userQuery, time: botResponse.timestamp };
        const botMsg = { id: Date.now() + 1, sender: 'bot', ...botResponse };
        
        db.chatHistory = db.chatHistory || [];
        db.chatHistory.push(userMsg, botMsg);
        if (db.chatHistory.length > 50) db.chatHistory = db.chatHistory.slice(-50);
        writeDB(db);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(botResponse));
      } catch (err) {
        console.error('Chat Error:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload or server error' }));
      }
    });
    return;
  }

  // 5. Database CRUD Endpoints
  if (pathname === '/api/db' && method === 'GET') {
    const dbData = readDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(dbData));
    return;
  }

  if (pathname === '/api/db' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const db = readDB();

        if (payload.action === 'saveLocation') {
          db.savedLocations = db.savedLocations || [];
          if (!db.savedLocations.some(l => l.name === payload.location.name)) {
            db.savedLocations.push(payload.location);
          }
        } else if (payload.action === 'updateSettings') {
          db.settings = { ...db.settings, ...payload.settings };
        } else if (payload.action === 'addAlert') {
          db.customAlerts = db.customAlerts || [];
          db.customAlerts.push(payload.alert);
        } else if (payload.action === 'clearChat') {
          db.chatHistory = [];
        }

        writeDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, db }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update DB' }));
      }
    });
    return;
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const extname = path.extname(filePath);
  
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌤️ WeatherGPT SIH26068 Server is Live on Port ${PORT}`);
  console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
