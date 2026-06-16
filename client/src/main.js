import { marked } from "marked";
import DOMPurify from "dompurify";

const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-message");

const languageSelect = document.getElementById("language");
const levelSelect = document.getElementById("level");
const scenarioInput = document.getElementById("scenario");

const sendBtn = document.getElementById("send-btn");
const startBtn = document.getElementById("start-chat");
const resetBtn = document.getElementById("reset-chat");

const statusText = document.getElementById("status");

let messages = [];
let practiceStarted = false;
let lastAIMessage = "";

/* ==========================
   LOCAL STORAGE
========================== */

loadChat();

function saveChat() {
  localStorage.setItem(
    "polyglot-chat",
    JSON.stringify({
      messages,
      language: languageSelect.value,
      level: levelSelect.value,
      scenario: scenarioInput.value,
      practiceStarted,
    }),
  );
}

function loadChat() {
  const saved = localStorage.getItem("polyglot-chat");

  if (!saved) return;

  try {
    const data = JSON.parse(saved);

    messages = data.messages || [];
    practiceStarted = data.practiceStarted || false;

    if (data.language) {
      languageSelect.value = data.language;
    }

    if (data.level) {
      levelSelect.value = data.level;
    }

    if (data.scenario) {
      scenarioInput.value = data.scenario;
    }

    if (messages.length > 0) {
      chatMessages.innerHTML = "";

      messages.forEach((msg) => {
        addMessage(msg.role, msg.content, false);
      });

      const lastAssistant = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");

      if (lastAssistant) {
        lastAIMessage = lastAssistant.content;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

/* ==========================
   MESSAGE UI
========================== */

function addMessage(role, text, save = true) {
  if (chatMessages.querySelector(".empty-state")) {
    chatMessages.innerHTML = "";
  }

  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const html = marked.parse(text);

  bubble.innerHTML = DOMPurify.sanitize(html);

  // Add speak button only for assistant messages
  if (role === "assistant") {
    const speakBtn = document.createElement("button");

    speakBtn.className = "speak-btn";

    speakBtn.innerHTML = "🔊";

    speakBtn.title = "Listen to pronunciation";

    speakBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      speakText(text);
    });

    bubble.appendChild(speakBtn);
  }

  wrapper.appendChild(bubble);

  chatMessages.appendChild(wrapper);

  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (save) {
    saveChat();
  }
}

/* ==========================
   STATUS
========================== */

function setStatus(text) {
  statusText.textContent = text;
}

/* ==========================
   START PRACTICE
========================== */

startBtn.addEventListener("click", startPractice);

function startPractice() {
  chatMessages.innerHTML = "";

  messages = [];
  practiceStarted = true;

  const lang = languageSelect.value;
  const scenario = scenarioInput.value.trim();

  let intro = `Welcome! Start introducing yourself in ${lang}.`;

  if (scenario) {
    intro = `Scenario: ${scenario}. Begin the conversation.`;
  }

  addMessage("assistant", intro);

  messages.push({
    role: "assistant",
    content: intro,
  });

  setStatus("Ready");

  saveChat();
}

/* ==========================
   SEND MESSAGE
========================== */

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

async function sendMessage() {
  if (!practiceStarted) {
    alert("Please click Start Practice first.");
    return;
  }

  const text = userInput.value.trim();

  if (!text) return;

  addMessage("user", text);

  messages.push({
    role: "user",
    content: text,
  });

  userInput.value = "";

  setStatus("AI is typing...");

  const typingDiv = createTypingIndicator();

  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        language: languageSelect.value,
        level: levelSelect.value,
        scenario: scenarioInput.value.trim(),
        messages: messages.slice(-20),
      }),
    });

    const data = await response.json();

    typingDiv.remove();

    if (!response.ok) {
      throw new Error(data.error || "AI request failed");
    }

    addMessage(
      "assistant",
      data.reply || "Sorry, I couldn't generate a response.",
    );

    messages.push({
      role: "assistant",
      content: data.reply || "Sorry, I couldn't generate a response.",
    });

    lastAIMessage = data.reply || "";

    saveChat();

    setStatus("Ready");
  } catch (err) {
    typingDiv.remove();

    addMessage("assistant", "Something went wrong. Please try again.");

    setStatus("Error");

    console.error(err);
  }
}

/* ==========================
   TYPING INDICATOR
========================== */

function createTypingIndicator() {
  const wrapper = document.createElement("div");

  wrapper.className = "message assistant";

  wrapper.innerHTML = `
    <div class="bubble">
      <div class="typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;

  return wrapper;
}

/* ==========================
   SPEECH SYNTHESIS
========================== */

function cleanSpeechText(text) {
  return text
    .replace(/\([^)]*\)/g, "")
    .replace(/[#*_`]/g, "")
    .trim();
}

function speakText(text) {
  if (!text) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanSpeechText(text));

  utterance.rate = 0.9;
  utterance.pitch = 1;

  const voiceMap = {
    Japanese: "ja-JP",
    Chinese: "zh-CN",
    Hindi: "hi-IN",
    Telugu: "te-IN",
    Tamil: "ta-IN",
    Spanish: "es-ES",
    French: "fr-FR",
    German: "de-DE",
    Russian: "ru-RU",
    Greek: "el-GR",
    English: "en-US",
  };

  utterance.lang = voiceMap[languageSelect.value] || "en-US";

  speechSynthesis.speak(utterance);
}

/* ==========================
   RESET CHAT
========================== */

resetBtn.addEventListener("click", resetChat);

function resetChat() {
  messages = [];
  lastAIMessage = "";
  practiceStarted = false;

  chatMessages.innerHTML = `
    <div class="empty-state">
      Select a language and click
      <strong>Start Practice</strong>.
    </div>
  `;

  localStorage.removeItem("polyglot-chat");

  setStatus("Ready");
}

/* ==========================
   RESET ON SETTINGS CHANGE
========================== */

languageSelect.addEventListener("change", resetChat);

levelSelect.addEventListener("change", resetChat);

scenarioInput.addEventListener("change", resetChat);

/* ==========================
   AUTO SCROLL
========================== */

window.addEventListener("load", () => {
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
