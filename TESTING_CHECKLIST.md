# 🧪 WeatherGPT Testing Checklist

## Test Environment
- **URL**: http://localhost:3000 (Local) OR your GitHub Pages live link
- **Browser**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop, Tablet (iPad), Mobile (iOS & Android)

---

## 📱 SCREEN 1: HOME / DASHBOARD

### 1.1 Header & Navigation
- [ ] Logo "WeatherGPT" clickable and returns to dashboard
- [ ] SIH26068 badge displays correctly
- [ ] All nav links work (Dashboard, AI Chat, Forecast, Alerts, Climate, Settings)
- [ ] Desktop nav shows all 6 screens correctly
- [ ] Mobile bottom nav appears on small screens
- [ ] "My Location" button appears and is clickable
- [ ] Completion countdown timer displays (if applicable)

### 1.2 Search Bar & Popular Cities
- [ ] Search input accepts text
- [ ] Search input placeholder text is visible
- [ ] Popular cities quick buttons appear (Delhi, Mumbai, Bangalore, etc.)
- [ ] Clicking popular city buttons fetches data for that location
- [ ] Search results appear instantly

### 1.3 Main Weather Card (Left Section)
- [ ] Location name displays correctly (e.g., "Delhi, India")
- [ ] Weather condition text shows (Clear Sky, Rainy, Cloudy, etc.)
- [ ] Temperature displays in large font (e.g., "28°C")
- [ ] Weather icon matches condition (sun for clear, cloud for cloudy, rain for rainy)
- [ ] Temperature source text visible ("Powered by Open-Meteo")
- [ ] Humidity % displays correctly
- [ ] Wind speed displays in km/h
- [ ] Rain probability % displays correctly
- [ ] Data updates when searching new location

### 1.4 AI Smart Insights Card (Right Section)
- [ ] Umbrella badge shows (☔ "Carry Umbrella" or ☀️ "No Umbrella Needed")
- [ ] Umbrella advice is accurate based on rain probability
- [ ] Smart suggestion buttons appear (3 pre-filled prompts)
- [ ] Clicking suggestion buttons opens AI Chat
- [ ] "Open WeatherGPT Chat Engine" button visible and clickable
- [ ] All text is readable on mobile

---

## 💬 SCREEN 2: AI CHAT (WEATHERGPT CONVERSATIONAL)

### 2.1 Chat Interface
- [ ] Chat window loads with initial bot greeting
- [ ] Greeting mentions Hinglish capability
- [ ] Chat messages display in correct bubbles (bot left, user right)
- [ ] Bot avatar shows correct icon
- [ ] Scrollable chat history
- [ ] Chat history persists when switching screens

### 2.2 Input & Sending
- [ ] Text input field accepts typing
- [ ] Placeholder text visible
- [ ] Send button clickable and styled correctly
- [ ] Enter key submits message
- [ ] Mic button appears (for voice input)
- [ ] TTS (Text-to-Speech) toggle button visible
- [ ] Sending message shows loading state

### 2.3 AI Responses - Clothing Advisory
**Test Query**: "Aaj kya pehne?" OR "What should I wear?"
- [ ] Bot responds with clothing advice
- [ ] Response includes current temperature
- [ ] Response includes weather condition
- [ ] Response includes rain probability
- [ ] Advice is contextual (light clothes for warm, heavy for cold)
- [ ] Markdown formatting works (bold, emojis display)

### 2.4 AI Responses - Umbrella Query
**Test Query**: "Chhata saath rakhein?" OR "Should I carry umbrella?"
- [ ] Bot responds with umbrella recommendation
- [ ] Response includes rain probability
- [ ] Response includes temperature
- [ ] Advice is clear and actionable

### 2.5 AI Responses - Weather Query
**Test Query**: "Aaj weather kaisa hai?" OR "How is the weather today?"
- [ ] Bot responds with current weather details
- [ ] Response includes temperature (current, min, max)
- [ ] Response includes weather condition
- [ ] Response includes humidity and wind speed
- [ ] Response includes rain probability

### 2.6 AI Responses - Rain/Monsoon Query
**Test Query**: "Baarish hogi?" OR "Will it rain?"
- [ ] Bot responds with rain forecast
- [ ] Response includes rain probability
- [ ] Response includes weather condition
- [ ] Response mentions high temperature
- [ ] Monsoon context (if applicable) is mentioned

### 2.7 AI Responses - Temperature Query
**Test Query**: "Kitni garmi/sardi hai?" OR "What's the temperature?"
- [ ] Bot responds with temperature details
- [ ] Current temp shows
- [ ] Max/min temps show
- [ ] RealFeel index shows (if available)

### 2.8 AI Responses - Location-Based Query
**Test Query**: "Mumbai me weather kaisa hai?" OR "What's the weather in Bangalore?"
- [ ] Bot extracts location correctly
- [ ] Bot fetches weather for that location
- [ ] Response is location-specific
- [ ] Location is saved to savedLocations (if first time)

### 2.9 AI Responses - Hindi/Hinglish Response
**Test Query**: "Hindi mein bata" OR Any query
- [ ] Bot responds in Hinglish/Hindi
- [ ] Devanagari characters display correctly (if Hindi)
- [ ] Response is understandable

### 2.10 Voice Features (TTS & STT)
- [ ] Voice TTS toggle button works
- [ ] When enabled, bot response plays audio
- [ ] Audio quality is clear
- [ ] Mic button activates voice input (if browser supports)
- [ ] Voice recording starts/stops correctly
- [ ] Voice is converted to text

### 2.11 Suggestion Chips
- [ ] Pre-filled suggestion chips appear at bottom
- [ ] Clicking chip sends that prompt
- [ ] Chips are horizontally scrollable
- [ ] All 6 suggested prompts work

### 2.12 Chat History
- [ ] Messages persist when navigating back to chat
- [ ] Messages display in chronological order
- [ ] Chat is saved to db.json (check via Settings > Clear Chat DB)
- [ ] Clearing chat from Settings clears history

---

## 📊 SCREEN 3: WEATHER FORECAST

### 3.1 24-Hour Hourly Timeline
- [ ] Hourly cards appear
- [ ] Cards are horizontally scrollable
- [ ] Each card shows: time, temperature, weather icon
- [ ] Cards display for 24 hours
- [ ] Icons match weather conditions
- [ ] Temperatures are accurate
- [ ] Time format is readable (HH:MM or 12h format)

### 3.2 Temperature & Precipitation Chart
- [ ] Chart.js chart loads
- [ ] Line graph shows temperature trend
- [ ] Bar chart shows precipitation/rain probability
- [ ] Chart is responsive on mobile
- [ ] Legend shows both metrics
- [ ] Chart is interactive (can hover for details)
- [ ] X-axis shows hours or days
- [ ] Y-axis shows temperature and rain %

### 3.3 7-Day Extended Outlook
- [ ] 7 daily cards appear
- [ ] Each card shows: date, high/low temp, condition, rain chance
- [ ] Weather icons are correct
- [ ] Cards are vertically stacked
- [ ] All data is readable on mobile
- [ ] Information matches Open-Meteo API response

---

## ⚠️ SCREEN 4: WEATHER ALERTS

### 4.1 Alert Display
- [ ] Weather alerts list loads
- [ ] Alert cards display severity badges (CRITICAL, WARNING, etc.)
- [ ] Alert text is clear and actionable
- [ ] Appropriate icons show for different alert types

### 4.2 Alert Types
**Test with different conditions**:
- [ ] Thunderstorm alert shows when weather code indicates thunder
- [ ] Heatwave alert shows when temp > 38°C
- [ ] Rain alert shows when rain probability > 60%
- [ ] No alerts message shows when conditions are normal

### 4.3 Custom Alert Configuration
- [ ] Trigger condition dropdown works
- [ ] Options: Rain > 60%, Temp > 40°C, AQI > 200, Wind > 30 km/h
- [ ] Notification channel dropdown works
- [ ] "Save Custom Alert" button works
- [ ] Success message appears after saving
- [ ] Custom alerts are saved to db.json

### 4.4 Alert Accessibility
- [ ] Alert text is readable on all screen sizes
- [ ] Alert colors have sufficient contrast
- [ ] All alerts are scrollable on mobile

---

## 🌍 SCREEN 5: CLIMATE & AQI INFORMATION

### 5.1 AQI Display
- [ ] Main AQI value displays (numeric)
- [ ] AQI status badge shows (Good, Moderate, Poor, etc.)
- [ ] AQI emoji shows correctly
- [ ] Color coding matches AQI level

### 5.2 Pollutant Breakdown
- [ ] PM2.5 value displays with unit (µg/m³)
- [ ] PM10 value displays
- [ ] CO (Carbon Monoxide) value displays
- [ ] NO2 (Nitrogen Dioxide) value displays
- [ ] All values are numeric and realistic

### 5.3 Climate Recommendations
- [ ] Climate recommendation card appears
- [ ] Recommendation text is relevant to air quality
- [ ] Eco-friendly suggestions are present

### 5.4 Solar & UV Index Guide
- [ ] UV index value displays
- [ ] Solar recommendation appears
- [ ] Sunscreen advice shows if UV is high
- [ ] Text is actionable and clear

### 5.5 Responsive Design
- [ ] Layout is grid-based
- [ ] Cards stack on mobile
- [ ] All text is readable
- [ ] Icons display correctly

---

## ⚙️ SCREEN 6: SETTINGS & PREFERENCES

### 6.1 Language Selection
- [ ] Language dropdown appears with options:
  - [ ] Hinglish (Hindi-English Blend) - DEFAULT
  - [ ] Hindi (हिंदी)
  - [ ] English
  - [ ] Marathi (मराठी)
  - [ ] Bengali (বাংলা)
- [ ] Selecting language changes AI response language
- [ ] Selection is saved to db.json
- [ ] Selection persists after refresh

### 6.2 Temperature Unit Toggle
- [ ] Toggle switch appears
- [ ] Toggle is clickable
- [ ] When ON: temperatures show in °F
- [ ] When OFF: temperatures show in °C
- [ ] Selection is saved to db.json
- [ ] All screens update with new unit

### 6.3 Database Status
- [ ] "Single DB Connected (db.json)" message shows
- [ ] "Clear Chat DB" button appears
- [ ] Clicking button clears chat history
- [ ] Confirmation message appears
- [ ] Chat history is actually cleared

### 6.4 Settings Persistence
- [ ] All settings save to db.json
- [ ] Settings persist after page refresh
- [ ] Settings apply globally across all screens

---

## 🎨 ANIMATION & VISUAL EFFECTS

### 7.1 Weather Canvas Animations
- [ ] Canvas animation loads on page
- [ ] Animation is visible behind content
- [ ] Animations change based on weather:
  - [ ] Sunny: Solar flares and particles
  - [ ] Rainy: Rain droplets with ripples
  - [ ] Thunderstorm: Lightning strikes and dark rain
  - [ ] Snowy: Snowflakes falling
  - [ ] Cloudy: Mist and cloud layers
- [ ] Animation doesn't freeze the UI
- [ ] Performance is good (no lag)

### 7.2 UI Animations
- [ ] Floating weather icons animate smoothly
- [ ] Hover effects work on buttons
- [ ] Transitions are smooth (not jarring)
- [ ] Loading spinner shows when fetching data
- [ ] Spinner disappears after data loads

### 7.3 Icon Animations
- [ ] Weather icons match conditions
- [ ] Icons are colorful and clear
- [ ] Icons animate (pulse, rotate) appropriately

---

## 🌐 API & DATA INTEGRATION

### 8.1 Open-Meteo Weather API
- [ ] Weather data loads from Open-Meteo
- [ ] All fields populate: temp, humidity, wind, rain, condition
- [ ] Data updates when location changes
- [ ] Coordinates are accurate for searched cities
- [ ] Response time is reasonable (< 3 seconds)

### 8.2 Open-Meteo Geocoding API
- [ ] City search works
- [ ] Indian locations are prioritized in results
- [ ] City names and coordinates are correct
- [ ] Searched locations are saved to db.json

### 8.3 Open-Meteo AQI API
- [ ] AQI data loads
- [ ] Pollutant values are returned
- [ ] Data matches location coordinates
- [ ] Values are realistic

### 8.4 API Error Handling
- [ ] Network error shows graceful fallback
- [ ] Offline mode shows cached data (if available)
- [ ] Error messages are user-friendly
- [ ] App doesn't crash on API failure

---

## 💾 DATABASE (db.json)

### 9.1 Data Persistence
- [ ] Chat history is saved to db.json
- [ ] Settings are saved to db.json
- [ ] Saved locations are saved to db.json
- [ ] Custom alerts are saved to db.json

### 9.2 Database Structure
```json
{
  "settings": { "language": "hinglish", "tempUnit": "celsius" },
  "savedLocations": [ { "name": "...", "lat": 0, "lon": 0 } ],
  "customAlerts": [ { "condition": "...", "channel": "..." } ],
  "chatHistory": [ { "sender": "user/bot", "text": "..." } ]
}
```
- [ ] All fields are present
- [ ] Data is properly formatted
- [ ] No corrupted entries

---

## 📱 RESPONSIVE DESIGN & MOBILE

### 10.1 Mobile (iOS/Android)
- [ ] Layout stacks properly on mobile
- [ ] Text is readable without zooming
- [ ] Buttons are tap-friendly (min 44x44px)
- [ ] Horizontal scrolling works smoothly
- [ ] Bottom nav appears on mobile
- [ ] Top nav is hidden on mobile (hamburger menu)
- [ ] All inputs work on touch devices

### 10.2 Tablet
- [ ] Medium screen layout is optimal
- [ ] 2-column layout works
- [ ] Buttons are properly spaced
- [ ] No horizontal scrolling needed

### 10.3 Desktop
- [ ] 6-column grid works well
- [ ] Cards have proper spacing
- [ ] No text overflow
- [ ] Layout is centered and balanced

---

## 🔒 SECURITY & PERFORMANCE

### 11.1 Security
- [ ] No sensitive data in localStorage (beyond what's intended)
- [ ] API calls don't expose API keys
- [ ] CORS is handled correctly
- [ ] User input is sanitized (no XSS)

### 11.2 Performance
- [ ] Page load time < 3 seconds
- [ ] API responses < 2 seconds
- [ ] No memory leaks (check DevTools)
- [ ] Chat doesn't slow down with 50+ messages
- [ ] Canvas animation doesn't cause janky frames
- [ ] No console errors or warnings (except CDN)

### 11.3 Browser Compatibility
- [ ] Chrome ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅
- [ ] Mobile Safari (iOS) ✅
- [ ] Chrome Android ✅

---

## 🐛 BUG TRACKING TEMPLATE

### When You Find a Bug:
```
## Bug Report: [BUG NAME]

**Screen**: [Dashboard/Chat/Forecast/etc.]
**Severity**: [Critical/High/Medium/Low]
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**: 
What should happen?

**Actual Behavior**: 
What actually happened?

**Screenshots/Video**: 
[If applicable]

**Browser/Device**: 
[Chrome on iPhone 14, etc.]

**Console Errors**: 
[Any errors shown in DevTools?]
```

---

## ✅ SIGN-OFF CHECKLIST

- [ ] All 6 screens tested
- [ ] All API endpoints responding
- [ ] Database persisting correctly
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Accessibility checked
- [ ] All major user flows tested
- [ ] Documentation updated

---

## 🚀 HOW TO USE THIS CHECKLIST

1. **Go live**: Deploy to GitHub Pages or keep running locally
2. **Test each section**: Mark items as you test
3. **Document bugs**: Use the bug tracking template above
4. **Create issues**: Add critical bugs to GitHub Issues
5. **Fix & retry**: Once fixed, retest that section

**Live URL**: Check GitHub Pages settings for your live link
**Local URL**: `http://localhost:3000`

---

*Last Updated: September 5, 2026*
*WeatherGPT SIH26068 - Testing Checklist v1.0*
