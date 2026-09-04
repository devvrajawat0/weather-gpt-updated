/**
 * WeatherGPT Conversational AI Interface Module
 * Supports multilingual natural language queries (Hinglish / Hindi / English)
 * Features Web Speech Synthesis text-to-speech, interactive prompt chips, structured visual weather cards,
 * and dual mode (Node Backend + GitHub Pages static client-side fallback).
 */

class WeatherGPTChatClient {
  constructor() {
    this.chatContainer = document.getElementById('chat-messages');
    this.inputField = document.getElementById('chat-input-text');
    this.sendBtn = document.getElementById('chat-send-btn');
    this.ttsToggle = document.getElementById('tts-toggle-btn');
    this.micBtn = document.getElementById('mic-input-btn');
    this.ttsEnabled = true;

    this.initEventListeners();
  }

  initEventListeners() {
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.handleSendMessage());
    }

    if (this.inputField) {
      this.inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSendMessage();
      });
    }

    if (this.ttsToggle) {
      this.ttsToggle.addEventListener('click', () => {
        this.ttsEnabled = !this.ttsEnabled;
        this.ttsToggle.classList.toggle('bg-blue-600', this.ttsEnabled);
        this.ttsToggle.classList.toggle('bg-slate-700', !this.ttsEnabled);
        const icon = this.ttsToggle.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', this.ttsEnabled ? 'volume-2' : 'volume-x');
          if (window.lucide) lucide.createIcons();
        }
      });
    }

    if (this.micBtn) {
      this.micBtn.addEventListener('click', () => this.handleVoiceInput());
    }

    document.querySelectorAll('.chat-prompt-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const text = e.currentTarget.getAttribute('data-prompt') || e.currentTarget.innerText;
        if (this.inputField) {
          this.inputField.value = text;
          this.handleSendMessage();
        }
      });
    });
  }

  async handleSendMessage(customQuery = null) {
    const text = customQuery || (this.inputField ? this.inputField.value.trim() : '');
    if (!text) return;

    if (this.inputField) this.inputField.value = '';

    this.appendMessage('user', text);
    const typingId = this.showTypingIndicator();

    try {
      const weatherContext = window.AppState ? window.AppState.getWeatherContext() : {};
      
      let data;
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: text,
            context: weatherContext,
            language: window.AppState ? window.AppState.language : 'hinglish'
          })
        });
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('Fallback to client NLP');
        }
      } catch (backendErr) {
        data = await this.clientSideWeatherGPTNLP(text, weatherContext);
      }

      this.removeTypingIndicator(typingId);
      this.appendBotResponseCard(data);

      if (this.ttsEnabled && data.speechText) {
        this.speakText(data.speechText);
      }

    } catch (err) {
      console.error('Chat Error:', err);
      this.removeTypingIndicator(typingId);
      this.appendMessage('bot', '⚠️ Maaf kijiye, weather details load karne me problem aayi. Kripya punah prayas karein.');
    }
  }

  async clientSideWeatherGPTNLP(query, context = {}) {
    const q = query.toLowerCase().trim();
    let location = context.locationName || 'Your Location';
    let temp = Math.round(context.temp || 28);
    let maxTemp = context.maxTemp || Math.round(temp + 4);
    let minTemp = context.minTemp || Math.round(temp - 4);
    let rainProb = context.rainProb || 15;
    let humidity = context.humidity || 60;
    let windSpeed = context.windSpeed || 12;

    // Detect Indian location mentioned in query
    const stopWords = ["weather", "temperature", "temp", "baarish", "barish", "rain", "today", "tomorrow", "kaisa", "hogi", "kya", "alert", "warning", "weekend", "hindi", "batao", "bataoo", "mein", "ka", "ki", "ko", "par", "se", "umbrella", "chhata", "hawa", "climate", "haalat", "report", "please", "should", "carry", "best", "visit", "trip", "going", "to"];
    const match = q.match(/(?:in|me|at|near|ka|ki|for|to)\s+([a-z\s]+)/i);
    let candidateWord = match ? match[1].trim().split(/\s+/).find(w => w.length >= 3 && !stopWords.includes(w)) : null;

    if (!candidateWord) {
      candidateWord = q.split(/\s+/).map(w => w.replace(/[^a-z]/g, '')).find(w => w.length >= 3 && !stopWords.includes(w));
    }

    if (candidateWord) {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(candidateWord)}&count=5&language=en&format=json`);
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results[0]) {
          const indianResult = geoData.results.find(r => r.country === 'India') || geoData.results[0];
          location = `${indianResult.name}${indianResult.admin1 ? ', ' + indianResult.admin1 : ''}`;
          
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${indianResult.latitude}&longitude=${indianResult.longitude}&current_weather=true&hourly=precipitation_probability,relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
          const wData = await wRes.json();
          if (wData.current_weather) {
            temp = Math.round(wData.current_weather.temperature);
            windSpeed = Math.round(wData.current_weather.windspeed || 12);
          }
          if (wData.daily && wData.daily.temperature_2m_max) {
            maxTemp = Math.round(wData.daily.temperature_2m_max[0]);
            minTemp = Math.round(wData.daily.temperature_2m_min[0]);
          }
          if (wData.hourly && wData.hourly.precipitation_probability) {
            rainProb = wData.hourly.precipitation_probability[0] || 15;
          }
        }
      } catch (e) {
        console.warn('Client NLP fetch failed:', e);
      }
    }

    const carryUmbrella = rainProb >= 40;
    const umbrellaAdvice = carryUmbrella
      ? '☔ Haan, aaj chhata (umbrella) saath rakhein! Baarish hone ki sambhavna hai.'
      : '☀️ Nahin, aaj chhata ki zarurat nahi hai. Mausam saaf rahne ki ummeed hai.';

    let outfitTip = temp > 32 ? '👕 Light cotton clothes pehno, garmi zyada hai.' : temp < 18 ? '🧥 Woolen jacket pehno, thand hai.' : '👕 Comfortable casual clothes pehno.';
    let responseText = '';
    let speechText = '';

    if (q.includes('umbrella') || q.includes('chhata') || q.includes('chata')) {
      responseText = `${umbrellaAdvice}\n\n📍 **${location}** me rain probability **${rainProb}%** hai aur temperature **${temp}°C** hai.\n👉 ${outfitTip}`;
      speechText = carryUmbrella ? `${location} me baarish ki sambhavna hai. Chhata saath rakhein.` : `${location} me aaj chhata ki zaroorat nahi hai.`;
    } else if (q.includes('baarish') || q.includes('rain') || q.includes('kal') || q.includes('monsoon')) {
      responseText = `🌧️ **Rain & Monsoon Forecast for ${location}:**\n\n• Live Rain Chance: **${rainProb}%**\n• Current Temp: **${temp}°C**\n\n${rainProb > 40 ? '⚠️ Rain warning active. Keep umbrella ready.' : '✅ Heavy rainfall alert active nahi hai.'}`;
      speechText = `${location} me baarish ki sambhavna ${rainProb} percent hai.`;
    } else {
      responseText = `📍 **${location}** Weather Report:\n\n• 🌡️ **Temperature:** ${temp}°C (High: ${maxTemp}°C / Low: ${minTemp}°C)\n• 🌧️ **Baarish Chance:** ${rainProb}%\n• 💧 **Humidity:** ${humidity}%\n• 💨 **Wind:** ${windSpeed} km/h\n\n👉 ${outfitTip}\n${carryUmbrella ? '👉 Chhata saath me rakhein.' : '👉 Outside activities ke liye mausam acha hai.'}`;
      speechText = `${location} me temperature ${temp} degree celsius hai. Rain probability ${rainProb} percent hai.`;
    }

    return {
      text: responseText,
      speechText: speechText,
      umbrellaNeeded: carryUmbrella,
      rainProbability: rainProb,
      temperature: temp,
      maxTemp: maxTemp,
      minTemp: minTemp,
      location: location,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  handleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition API supported in Chrome browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;

    this.micBtn.classList.add('animate-pulse', 'bg-red-500');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.inputField) {
        this.inputField.value = transcript;
        this.handleSendMessage();
      }
    };

    recognition.onerror = () => {
      this.micBtn.classList.remove('animate-pulse', 'bg-red-500');
    };

    recognition.onend = () => {
      this.micBtn.classList.remove('animate-pulse', 'bg-red-500');
    };

    recognition.start();
  }

  speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  }

  appendMessage(sender, text) {
    if (!this.chatContainer) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex w-full mb-4 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;

    if (sender === 'user') {
      msgDiv.innerHTML = `
        <div class="chat-bubble-user px-4 py-3 max-w-[80%] text-sm md:text-base leading-relaxed">
          <p>${this.escapeHtml(text)}</p>
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="flex gap-3 max-w-[85%]">
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg">
            <i data-lucide="bot" class="w-4 h-4"></i>
          </div>
          <div class="chat-bubble-bot px-4 py-3 text-sm md:text-base leading-relaxed">
            <p>${this.formatMarkdown(text)}</p>
          </div>
        </div>
      `;
    }

    this.chatContainer.appendChild(msgDiv);
    if (window.lucide) lucide.createIcons();
    this.scrollToBottom();
  }

  appendBotResponseCard(data) {
    if (!this.chatContainer) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex w-full mb-4 justify-start';

    const isUmbrella = data.umbrellaNeeded;

    msgDiv.innerHTML = `
      <div class="flex gap-3 max-w-[90%] md:max-w-[80%]">
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg border border-blue-400/30">
          <i data-lucide="sparkles" class="w-5 h-5 text-amber-300"></i>
        </div>
        <div class="chat-bubble-bot p-4 text-sm md:text-base leading-relaxed w-full space-y-3">
          <div class="whitespace-pre-line text-slate-100">${this.formatMarkdown(data.text)}</div>

          <div class="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs md:text-sm">
            <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50 flex items-center gap-2">
              <i data-lucide="${isUmbrella ? 'umbrella' : 'sun'}" class="${isUmbrella ? 'text-amber-400' : 'text-amber-300'} w-5 h-5"></i>
              <div>
                <div class="text-slate-400 text-[10px] uppercase font-semibold">Umbrella Advisory</div>
                <div class="font-bold text-slate-200">${isUmbrella ? 'Chhata Saath Rakhein ☔' : 'No Umbrella Needed ☀️'}</div>
              </div>
            </div>
            
            <div class="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50 flex items-center gap-2">
              <i data-lucide="cloud-rain" class="text-sky-400 w-5 h-5"></i>
              <div>
                <div class="text-slate-400 text-[10px] uppercase font-semibold">Rain Prob</div>
                <div class="font-bold text-sky-300">${data.rainProbability}% Chance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.chatContainer.appendChild(msgDiv);
    if (window.lucide) lucide.createIcons();
    this.scrollToBottom();
  }

  showTypingIndicator() {
    if (!this.chatContainer) return null;
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'flex w-full mb-4 justify-start';
    typingDiv.innerHTML = `
      <div class="flex gap-3 items-center">
        <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
          <i data-lucide="bot" class="w-4 h-4 animate-spin"></i>
        </div>
        <div class="chat-bubble-bot px-4 py-2 text-slate-400 text-xs flex items-center gap-1.5">
          <span>WeatherGPT soch raha hai</span>
          <span class="animate-bounce">.</span>
          <span class="animate-bounce delay-100">.</span>
          <span class="animate-bounce delay-200">.</span>
        </div>
      </div>
    `;
    this.chatContainer.appendChild(typingDiv);
    if (window.lucide) lucide.createIcons();
    this.scrollToBottom();
    return id;
  }

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  scrollToBottom() {
    if (this.chatContainer) {
      this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }
  }

  formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300 font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }
}

window.WeatherChat = null;
document.addEventListener('DOMContentLoaded', () => {
  window.WeatherChat = new WeatherGPTChatClient();
});
