# 🌤️ WeatherGPT: Conversational AI for Weather Forecasting, Alerts, and Climate Information

**SIH Problem Statement ID:** `SIH26068`  
**Topic:** WeatherGPT - Conversational AI for Weather Forecasting, Emergency Alerts, and Climate Intelligence  

---

## 🚀 Key Features & Highlights

### 📱 6 Fullstack Integrated UI/UX Screens
1. **Home / Dashboard**: Live location weather overview, high/low, rain probability, wind speed, humidity, umbrella advisory card, Tehsil quick selector, launch countdown badge.
2. **AI Chat (WeatherGPT)**: Multilingual NLP Assistant supporting **Hinglish, Hindi, and English** with Web Speech Text-to-Speech (TTS) voice readout. Responds to:
   - *"Aaj weather kaisa hai?"*
   - *"Kal baarish hogi?"*
   - *"Temperature kya rahega?"*
   - *"Weather alert hai kya?"*
   - *"Weekend forecast?"*
   - *"Air/climate information?"*
   - *"Should I carry an umbrella?"*
   - *"Hindi mein weather batao"*
3. **Weather Forecast**: 24-hour horizontal scrolling timeline cards, 7-day extended forecast, and Chart.js interactive temperature & rain trend graphs.
4. **Weather Alerts**: Severe emergency advisories (Thunderstorms, Heatwave, Heavy Rain, AQI Hazards) with severity badges and custom threshold alert config.
5. **Climate & AQI Information**: Live US AQI index gauge, PM2.5, PM10, CO, NO2 pollutant breakdown, UV index, and eco recommendations.
6. **Settings / Language**: Language selector (Hinglish, Hindi, English, Marathi, Bengali, Tamil), Unit toggle (°C / °F), and single database control.

---

## ⚡ Dynamic Particle Weather Animations (Canvas 2D Engine)
Interactive, real-time Canvas background animations that switch automatically based on weather condition:
- 🌩️ **Thunderstorm & Lightning**: Dark storm rain particles with random canvas lightning strikes & screen flashes.
- ❄️ **Snowfall**: Falling crystalline snowflake physics drifting with wind dynamics.
- 🌧️ **Rainy**: Raindrop vectors with ground ripple splash animations.
- ☀️ **Hard Sun / Shiny**: Solar flare light rays radiating with warm solar particle dust.
- 🌫️ **Cloudy / Foggy**: Atmospheric mist and drifting cloud layers.

---

## 📡 Live APIs & Database Architecture
- **Open-Meteo Free APIs**: Live forecast, 7-day extended data, US AQI metrics, and Geocoding search supporting **all 700+ Indian Tehsils/Districts** and **world capital cities**. Completely free with zero API key required.
- **Single Database (`db.json`)**: Persistent JSON database logging user chat history, saved locations, custom alert configurations, and settings.

---

## 💻 How to Run Locally

```bash
# 1. Navigate to project directory
cd C:\Users\HP\.gemini\antigravity\scratch\weather-gpt

# 2. Start Node Server
node server.js
```

Open your browser at `http://localhost:3000` to view the live dashboard!

---

## 📦 Uploading to GitHub & Sharing Live Link

To publish this project on your GitHub repository `weather-gpt`:

```bash
# Initialize git repository
git init

# Add remote origin
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/weather-gpt.git

# Stage and commit files
git add .
git commit -m "Initial commit - WeatherGPT SIH26068 Fullstack Web App"

# Rename branch to main & push
git branch -M main
git push -u origin main
```

Your live project repository link will be:  
`https://github.com/<YOUR_GITHUB_USERNAME>/weather-gpt`

You can share this link directly with your team and group mates!
