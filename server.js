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

// Known cities dictionary for fast offline database lookup fallback
const POPULAR_LOCATIONS = [
  { name: "Mumbai, Maharashtra", lat: 19.0760, lon: 72.8777, keywords: ["mumbai", "bombay"] },
  { name: "Delhi, India", lat: 28.6139, lon: 77.2090, keywords: ["delhi", "dilli", "ncr", "new delhi"] },
  { name: "Lucknow, UP", lat: 26.8467, lon: 80.9462, keywords: ["lucknow", "lakhnau"] },
  { name: "Shimla, HP", lat: 31.1048, lon: 77.1734, keywords: ["shimla", "simla"] },
  { name: "Jaipur, Rajasthan", lat: 26.9124, lon: 75.7873, keywords: ["jaipur"] },
  { name: "Bhopal, MP", lat: 23.2599, lon: 77.4126, keywords: ["bhopal"] },
  { name: "Indore, MP", lat: 22.7196, lon: 75.8577, keywords: ["indore"] },
  { name: "Chandigarh, India", lat: 30.7333, lon: 76.7794, keywords: ["chandigarh"] },
  { name: "Bangalore, Karnataka", lat: 12.9716, lon: 77.5946, keywords: ["bangalore", "bengaluru"] },
  { name: "Pune, Maharashtra", lat: 18.5204, lon: 73.8567, keywords: ["pune", "poona"] },
  { name: "Patna, Bihar", lat: 25.5941, lon: 85.1376, keywords: ["patna"] },
  { name: "Kolkata, West Bengal", lat: 22.5726, lon: 88.3639, keywords: ["kolkata", "calcutta"] },
  { name: "Chennai, Tamil Nadu", lat: 13.0827, lon: 80.2707, keywords: ["chennai", "madras"] },
  { name: "Hyderabad, Telangana", lat: 17.3850, lon: 78.4867, keywords: ["hyderabad"] },
  { name: "Ahmedabad, Gujarat", lat: 23.0225, lon: 72.5714, keywords: ["ahmedabad"] },
  { name: "Surat, Gujarat", lat: 21.1702, lon: 72.8311, keywords: ["surat"] },
  { name: "Goa, India", lat: 15.2993, lon: 74.1240, keywords: ["goa"] },
  { name: "Dehradun, Uttarakhand", lat: 30.3165, lon: 78.0322, keywords: ["dehradun"] },
  { name: "Varanasi, UP", lat: 25.3176, lon: 82.9739, keywords: ["varanasi", "banaras", "kashi"] },
  { name: "Agra, UP", lat: 27.1767, lon: 78.0081, keywords: ["agra"] },
  { name: "Srinagar, J&K", lat: 34.0837, lon: 74.7973, keywords: ["srinagar"] },
  { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, keywords: ["tokyo"] },
  { name: "London, UK", lat: 51.5074, lon: -0.1278, keywords: ["london"] },
  { name: "New York, USA", lat: 40.7128, lon: -74.0060, keywords: ["new york", "nyc"] },
  { name: "Paris, France", lat: 48.8566, lon: 2.3522, keywords: ["paris"] },
  { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708, keywords: ["dubai"] }
];

// Smart Location Extractor from User Question
async function extractLocationAndFetchWeather(userQuery, defaultContext = {}) {
  const q = (userQuery || '').toLowerCase().trim();
  const db = readDB();

  let targetLocation = null;

  // 1. Check popular locations dictionary first
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
    const stopWords = ["weather", "temperature", "temp", "baarish", "barish", "rain", "today", "tomorrow", "kaisa", "hogi", "kya", "alert", "warning", "weekend", "hindi", "batao", "bataoo", "mein", "ka", "ki", "ko", "par", "se", "umbrella", "chhata", "hawa", "climate", "haalat", "report", "please", "should", "carry"];
    
    // Extract location after preposition or clean words list
    const match = q.match(/(?:in|me|at|near|ka|ki|for)\s+([a-z\s]+)/i);
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
        const geoData = await fetchHttps(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidateWord)}&count=1&language=en&format=json`);
        if (geoData.results && geoData.results.length > 0) {
          const place = geoData.results[0];
          const placeName = `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}${place.country ? ', ' + place.country : ''}`;
          targetLocation = { name: placeName, lat: place.latitude, lon: place.longitude };

          // Cache new location in DB
          db.savedLocations = db.savedLocations || [];
          if (!db.savedLocations.some(l => l.name === placeName)) {
            db.savedLocations.push({ name: placeName, lat: place.latitude, lon: place.longitude, type: place.country === 'India' ? 'District' : 'World City', country: place.country });
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

  // Fetch live weather data for the extracted target location
  try {
    const weatherRes = await fetchHttps(`https://api.open-meteo.com/v1/forecast?latitude=${targetLocation.lat}&longitude=${targetLocation.lon}&current_weather=true&hourly=precipitation_probability,relativehumidity_2m&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=auto`);
    
    const cur = weatherRes.current_weather || {};
    const rainProb = weatherRes.hourly && weatherRes.hourly.precipitation_probability ? weatherRes.hourly.precipitation_probability[0] || 10 : 10;
    const humidity = weatherRes.hourly && weatherRes.hourly.relativehumidity_2m ? weatherRes.hourly.relativehumidity_2m[0] || 60 : 60;

    return {
      locationName: targetLocation.name,
      temp: cur.temperature !== undefined ? Math.round(cur.temperature) : (defaultContext.temp || 28),
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
  const weatherCode = weatherContext.weatherCode;
  const rainProb = weatherContext.rainProb;
  const aqi = weatherContext.aqi;
  const humidity = weatherContext.humidity;
  const windSpeed = weatherContext.windSpeed;

  // Decode weather condition code (WMO standard)
  let conditionText = 'Saaf Aakash (Clear Sky)';
  let isRainy = rainProb > 40 || [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);
  let isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);
  let isThunder = [95, 96, 99].includes(weatherCode);
  let isCloudy = [1, 2, 3, 45, 48].includes(weatherCode);

  if (isThunder) conditionText = 'Bijli aur Toofan (Thunderstorm)';
  else if (isSnowy) conditionText = 'Barafbaari (Snowfall)';
  else if (isRainy) conditionText = 'Baarish (Rainy)';
  else if (isCloudy) conditionText = 'Baadal (Cloudy)';

  // Umbrella logic
  const carryUmbrella = isRainy || rainProb >= 45;
  const umbrellaAdvice = carryUmbrella
    ? '☔ Haan, aaj chhata (umbrella) saath rakhein! Baarish hone ki sambhavna hai.'
    : '☀️ Nahin, aaj chhata ki zarurat nahi hai. Mausam saaf rahne ki ummeed hai.';

  let responseText = '';
  let category = 'general';
  let speechText = '';

  // 1. Umbrella Query
  if (q.includes('umbrella') || q.includes('chhata') || q.includes('chata') || q.includes('raincoat')) {
    category = 'umbrella';
    responseText = `${umbrellaAdvice}\n\n📍 **${location}** me rain probability **${rainProb}%** hai aur temperature **${temp}°C** hai.`;
    speechText = carryUmbrella ? `${location} me baarish ki sambhavna hai. Chhata saath le jaana mat bhoolna.` : `${location} me aaj chhata le jaane ki zaroorat nahi hai. Aakash saaf hai.`;
  }
  // 2. Weather query ("Aaj weather kaisa hai?" or specific place weather)
  else if (q.includes('kaisa') || q.includes('weather') || q.includes('mausam') || q.includes('today') || q.includes('aaj') || q.includes('how is')) {
    category = 'today';
    responseText = `📍 **${location}** ka live mausam report:\n\n• 🌡️ **Temperature:** ${temp}°C\n• 🌤️ **Sthiti:** ${conditionText}\n• 🌧️ **Baarish Chance:** ${rainProb}%\n• 💧 **Humidity:** ${humidity}%\n• 💨 **Wind Speed:** ${windSpeed} km/h\n\n${carryUmbrella ? '👉 Chhata saath me rakhein.' : '👉 Outside activities ke liye mausam acha hai.'}`;
    speechText = `${location} me abhi temperature ${temp} degree celsius hai. Mausam ${conditionText} hai aur baarish ki sambhavna ${rainProb} percent hai.`;
  }
  // 3. Rain / Baarish Query
  else if (q.includes('baarish') || q.includes('barish') || q.includes('rain') || q.includes('kal') || q.includes('tomorrow')) {
    category = 'rain';
    responseText = `🌧️ **Rain Forecast for ${location}:**\n\n• Live Rain Chance: **${rainProb}%**\n• Status: **${conditionText}**\n\n${rainProb > 45 ? '⚠️ High rain alert: Waterlogging aur traffic disruption se bachne ke liye tayyari rakhein.' : '✅ Abhi heavy rainfall ki badi warning nahi hai.'}`;
    speechText = `${location} me baarish ki sambhavna lagbhag ${rainProb} percent hai.`;
  }
  // 4. Temperature query
  else if (q.includes('temp') || q.includes('temperature') || q.includes('garmi') || q.includes('sardi') || q.includes('thand')) {
    category = 'temperature';
    responseText = `🌡️ **Temperature Details for ${location}:**\n\n• Current Temp: **${temp}°C**\n• High expected: **${temp + 4}°C**\n• Low expected: **${temp - 4}°C**\n• RealFeel: **${temp + 2}°C**\n\n${temp > 35 ? '🔥 Garmi zyada hai, hydration banaye rakhein!' : temp < 15 ? '❄️ Thand hai, garm kapde pehno!' : '🌿 Mausam suhana hai.'}`;
    speechText = `${location} me abhi taapmaan ${temp} degree celsius hai.`;
  }
  // 5. Alert query
  else if (q.includes('alert') || q.includes('warning') || q.includes('khatra')) {
    category = 'alert';
    if (isThunder) {
      responseText = `⚠️ **CRITICAL WEATHER ALERT:**\n\n📍 ${location} me **Thunderstorm Warning** active hai! Bijli kadakne aur heavy rain ki sambhavna hai.`;
    } else if (temp > 38) {
      responseText = `⚠️ **HEATWAVE WARNING:**\n\n📍 ${location} me high temperature (**${temp}°C**) hai! Direct dhoop se bachein.`;
    } else {
      responseText = `✅ **No Emergency Warnings:**\n\n📍 ${location} ke liye abhi koi severe alert active nahi hai. Mausam normal hai.`;
    }
    speechText = `${location} me abhi koi severe warning active nahi hai.`;
  }
  // 6. Hindi request
  else if (q.includes('hindi') || q.includes('हिंदी')) {
    category = 'hindi';
    responseText = `🇮🇳 **मौसम रिपोर्ट (${location}):**\n\n• तापमान: **${temp}°C**\n• स्थिति: **${conditionText}**\n• बारिश की संभावना: **${rainProb}%**\n• हवा की गति: **${windSpeed} किमी/घंटा**\n\n${carryUmbrella ? '👉 सलाह: छाता साथ रखें।' : '👉 सलाह: मौसम सुहावना है।'}`;
    speechText = `${location} mein vartaman tapman ${temp} degree celsius hai. Vrishti ki sambhavna ${rainProb} percent hai.`;
  }
  // Default query
  else {
    responseText = `📍 **${location}** Weather Summary:\n\n• Temperature: **${temp}°C** (${conditionText})\n• Precipitation Chance: **${rainProb}%**\n• Humidity: **${humidity}%**\n\nAap inse judi jaankari pooch sakte hain:\n- "Aaj weather kaisa hai?"\n- "Should I carry an umbrella?"\n- "Mumbai me baarish hogi?"`;
    speechText = `${location} ka mausam abhi ${temp} degree celsius hai. Rain chance ${rainProb} percent hai.`;
  }

  return {
    text: responseText,
    speechText: speechText,
    category: category,
    umbrellaNeeded: carryUmbrella,
    rainProbability: rainProb,
    temperature: temp,
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

  // CORS headers
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

  // 3. Geocoding Search Endpoint (Supports Indian Cities/Districts & World Capitals)
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to search locations', details: err.message }));
    }
    return;
  }

  // 4. AI Chat Processing Endpoint (Asynchronous NLP & Dynamic Weather Fetching)
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
