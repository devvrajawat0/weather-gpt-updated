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

// AI Engine for Multilingual Chat Processing
function processWeatherGPTChat(query, weatherContext = {}, language = 'hinglish') {
  const q = (query || '').toLowerCase().trim();
  const location = weatherContext.locationName || 'Aapki location';
  const temp = weatherContext.temp !== undefined ? Math.round(weatherContext.temp) : 28;
  const weatherCode = weatherContext.weatherCode !== undefined ? weatherContext.weatherCode : 0;
  const rainProb = weatherContext.rainProb !== undefined ? weatherContext.rainProb : 10;
  const aqi = weatherContext.aqi !== undefined ? weatherContext.aqi : 45;
  const humidity = weatherContext.humidity !== undefined ? weatherContext.humidity : 60;
  const windSpeed = weatherContext.windSpeed !== undefined ? weatherContext.windSpeed : 12;

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

  // Response generation based on Intent
  let responseText = '';
  let category = 'general';
  let speechText = '';

  // 1. Umbrella Query
  if (q.includes('umbrella') || q.includes('chhata') || q.includes('chata') || q.includes('raincoat')) {
    category = 'umbrella';
    responseText = `${umbrellaAdvice}\n\n📍 **${location}** me rain probability abhi **${rainProb}%** hai aur temperature **${temp}°C** hai.`;
    speechText = carryUmbrella ? "Haan, baarish ki sambhavna hai. Chhata saath le jaana mat bhoolna." : "Nahi, aaj chhata le jaane ki zaroorat nahi hai. Aakash saaf hai.";
  }
  // 2. Today's weather query ("Aaj weather kaisa hai?")
  else if (q.includes('aaj') || q.includes('today') || q.includes('kaisa hai') || q.includes('current weather')) {
    category = 'today';
    responseText = `📍 **${location}** ka aaj ka mausam:\n\n• 🌡️ **Temperature:** ${temp}°C\n• 🌤️ **Sthiti:** ${conditionText}\n• 🌧️ **Baarish Probability:** ${rainProb}%\n• 💧 **Humidity:** ${humidity}%\n• 💨 **Wind Speed:** ${windSpeed} km/h\n\n${carryUmbrella ? '👉 Chhata saath me rakhein.' : '👉 Din me outdoor activities ke liye mausam badhiya hai.'}`;
    speechText = `${location} me abhi temperature ${temp} degree celsius hai. Mausam ${conditionText} hai aur baarish ki sambhavna ${rainProb} percent hai.`;
  }
  // 3. Tomorrow / Rain query ("Kal baarish hogi?")
  else if (q.includes('kal') || q.includes('tomorrow') || q.includes('baarish') || q.includes('barish') || q.includes('rain')) {
    category = 'rain';
    const tomorrowRain = Math.min(100, Math.max(0, rainProb + (Math.random() > 0.5 ? 15 : -10)));
    responseText = `🌧️ **Baarish Forecast for ${location}:**\n\n• Aaj baarish ki sambhavna **${rainProb}%** hai.\n• Kal aakash me baadal chaye rahne aur lagbhag **${Math.round(tomorrowRain)}%** baarish ki sambhavna hai.\n\n${tomorrowRain > 50 ? '⚠️ Rain alert: Waterlogging aur traffic disruption se bachne ke liye tayyari rakhein.' : '✅ Baarish ki badi warning nahi hai.'}`;
    speechText = `Kal ${location} me baarish ki sambhavna lagbhag ${Math.round(tomorrowRain)} percent hai.`;
  }
  // 4. Temperature query ("Temperature kya rahega?")
  else if (q.includes('temp') || q.includes('temperature') || q.includes('garmi') || q.includes('sardi') || q.includes('thand')) {
    category = 'temperature';
    responseText = `🌡️ **Temperature Status for ${location}:**\n\n• Abhi ka taapmaan: **${temp}°C**\n• Maximum expected: **${temp + 4}°C**\n• Minimum expected: **${temp - 5}°C**\n• RealFeel: **${temp + 2}°C**\n\n${temp > 35 ? '🔥 Garmi zyada hai, hydration banaye rakhein!' : temp < 15 ? '❄️ Thand hai, garm kapde pehno!' : '🌿 Mausam suhana hai.'}`;
    speechText = `${location} me abhi taapmaan ${temp} degree celsius hai. Real feel lagbhag ${temp + 2} degree hai.`;
  }
  // 5. Weather Alert query ("Weather alert hai kya?")
  else if (q.includes('alert') || q.includes('warning') || q.includes('danger') || q.includes('khatra')) {
    category = 'alert';
    if (isThunder) {
      responseText = `⚠️ **CRITICAL WEATHER ALERT:**\n\n📍 ${location} me **Thunderstorm & Lightning Warning** jaari ki gayi hai!\n• Bijli kadakne ki sambhavna hai.\n• Khule maidaan aur pedon ke neeche khade na ho. Heavy rain expected!`;
    } else if (temp > 38) {
      responseText = `⚠️ **HEATWAVE ADVISORY:**\n\n📍 ${location} me high temperature (**${temp}°C**) ka alert hai! Dhoop me nikalne se bachein aur paani pite rahein.`;
    } else if (aqi > 200) {
      responseText = `⚠️ **AIR QUALITY HAZARD ALERT:**\n\n📍 ${location} ka AQI **${aqi} (Poor)** hai! Mask ka prayog karein aur outdoor exercise reduce karein.`;
    } else {
      responseText = `✅ **No Severe Weather Alerts!**\n\n📍 ${location} ke liye abhi koi emergency weather warning active nahi hai. Mausam control me hai.`;
    }
    speechText = `Weather alert report: ${location} me abhi koi severe warning nahi hai. Mausam saaf hai.`;
  }
  // 6. Weekend forecast ("Weekend forecast?")
  else if (q.includes('weekend') || q.includes('saturday') || q.includes('sunday') || q.includes('hfta')) {
    category = 'weekend';
    responseText = `📅 **Weekend Weather Outlook for ${location}:**\n\n• **Saturday:** 🌤️ ${temp + 1}°C | Partly Cloudy | Rain Prob: ${Math.max(5, rainProb - 10)}%\n• **Sunday:** 🌧️ ${temp}°C | Light Showers Expected | Rain Prob: ${Math.min(90, rainProb + 25)}%\n\n👉 Sunday ko outdoor plans ke liye chhata saath rakhein!`;
    speechText = `Weekend me Saturday ko mausam saaf rahega, jabki Sunday ko light rain hone ki sambhavna hai.`;
  }
  // 7. Air / Climate info ("Air/climate information?")
  else if (q.includes('air') || q.includes('climate') || q.includes('aqi') || q.includes('pollution') || q.includes('hawa')) {
    category = 'climate';
    let aqiStatus = aqi <= 50 ? 'Good 😊' : aqi <= 100 ? 'Moderate 😐' : aqi <= 200 ? 'Unhealthy 😷' : 'Hazardous ⚠️';
    responseText = `🍃 **Climate & Air Quality Report for ${location}:**\n\n• **AQI Index:** ${aqi} (${aqiStatus})\n• **PM2.5 Level:** ${Math.round(aqi * 0.45)} µg/m³\n• **PM10 Level:** ${Math.round(aqi * 0.8)} µg/m³\n• **UV Index:** ${temp > 30 ? '7 (High)' : '4 (Moderate)'}\n\n👉 Climate tip: Green transportation and planting trees help improve local microclimate!`;
    speechText = `${location} ka Air Quality Index ${aqi} hai jo ki ${aqiStatus} category me aata hai.`;
  }
  // 8. Hindi query request ("Hindi mein weather batao")
  else if (q.includes('hindi') || q.includes('हिंदी')) {
    category = 'hindi';
    responseText = `🇮🇳 **मौसम की जानकारी (${location}):**\n\n• वर्तमान तापमान: **${temp}°C**\n• स्थिति: **${conditionText}**\n• बारिश की संभावना: **${rainProb}%**\n• हवा की गति: **${windSpeed} किमी/घंटा**\n\n${carryUmbrella ? '👉 सलाह: बाहर जाते समय छाता साथ रखें।' : '👉 सलाह: आज मौसम अनुकूल रहेगा।'}`;
    speechText = `${location} mein vartaman tapman ${temp} degree celsius hai. Vrishti ki sambhavna ${rainProb} percent hai.`;
  }
  // Default general query response
  else {
    responseText = `🤖 **WeatherGPT Smart Assistant:**\n\n📍 **${location}** Summary:\n• Temperature: **${temp}°C** (${conditionText})\n• Precipitation Chance: **${rainProb}%**\n• AQI Level: **${aqi}**\n\nAap inse judi aur jaankari pooch sakte hain:\n- "Aaj weather kaisa hai?"\n- "Kal baarish hogi?"\n- "Should I carry an umbrella?"\n- "Hindi mein weather batao"`;
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
    
    // Open-Meteo Weather API query
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

  // 3. Geocoding Search Endpoint (Indian Tehsils + World Capitals)
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

  // 4. AI Chat Processing Endpoint
  if (pathname === '/api/chat' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userQuery = payload.query || '';
        const weatherContext = payload.context || {};
        const language = payload.language || 'hinglish';

        const botResponse = processWeatherGPTChat(userQuery, weatherContext, language);

        // Save to DB history
        const db = readDB();
        const userMsg = { id: Date.now(), sender: 'user', text: userQuery, time: botResponse.timestamp };
        const botMsg = { id: Date.now() + 1, sender: 'bot', ...botResponse };
        
        db.chatHistory = db.chatHistory || [];
        db.chatHistory.push(userMsg, botMsg);
        // Keep last 50 messages
        if (db.chatHistory.length > 50) db.chatHistory = db.chatHistory.slice(-50);
        writeDB(db);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(botResponse));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
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
        // Fallback to index.html for SPA routing
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
