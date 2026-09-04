/**
 * WeatherGPT Conversational AI Interface Module
 * Supports multilingual natural language queries (Hinglish / Hindi / English)
 * Features Web Speech Synthesis text-to-speech, interactive prompt chips, and structured visual weather cards.
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

    // Bind prompt chips
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

    // Render User Message
    this.appendMessage('user', text);

    // Show Typing Indicator
    const typingId = this.showTypingIndicator();

    try {
      // Get current weather context from App State
      const weatherContext = window.AppState ? window.AppState.getWeatherContext() : {};
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          context: weatherContext,
          language: window.AppState ? window.AppState.language : 'hinglish'
        })
      });

      const data = await response.json();
      this.removeTypingIndicator(typingId);

      // Render Bot Response Card
      this.appendBotResponseCard(data);

      // Speak answer if TTS is enabled
      if (this.ttsEnabled && data.speechText) {
        this.speakText(data.speechText);
      }

    } catch (err) {
      console.error('Chat Error:', err);
      this.removeTypingIndicator(typingId);
      this.appendMessage('bot', '⚠️ Maaf kijiye, server se connect karne me problem aayi. Kripya punah prayas karein.');
    }
  }

  handleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Aapke browser me speech recognition support nahi hai. Direct text type karein.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi/Hinglish speech recognition
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
    window.speechSynthesis.cancel(); // Stop current speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; // Hindi voice accent
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

    // Umbrella & weather status badge colors
    const isUmbrella = data.umbrellaNeeded;
    const badgeColor = isUmbrella ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

    msgDiv.innerHTML = `
      <div class="flex gap-3 max-w-[90%] md:max-w-[80%]">
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg border border-blue-400/30">
          <i data-lucide="sparkles" class="w-5 h-5 text-amber-300"></i>
        </div>
        <div class="chat-bubble-bot p-4 text-sm md:text-base leading-relaxed w-full space-y-3">
          <!-- Text Body -->
          <div class="whitespace-pre-line text-slate-100">${this.formatMarkdown(data.text)}</div>

          <!-- Structured Card Details -->
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
