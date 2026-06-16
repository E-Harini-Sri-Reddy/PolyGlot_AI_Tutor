# 🦜 PolyGlot AI

**Learn languages through AI-powered conversations.**

PolyGlot AI is an interactive language-learning web application that allows users to practice conversations in multiple languages with an AI tutor named **Polly**. The app provides corrections, pronunciation guides, translations, word-by-word explanations, and scenario-based conversations.

---

## ✨ Features

### 🌍 Multi-Language Support

Practice conversations in:

- Spanish
- French
- German
- Japanese
- Chinese
- Hindi
- Telugu
- Tamil
- Greek
- Russian
- Korean
- Arabic
- English

---

## 🧠 AI Language Tutor

Polly acts as an intelligent language tutor that:

- Responds only in the target language
- Corrects mistakes politely
- Encourages conversation
- Adapts to proficiency level
- Supports contextual scenarios

---

## 📚 Learning Features

### ✅ Error Correction

Example:

**User:**

```text
Yo gusta pizza
```

**AI:**

```text
Pequeña corrección:
"Me gusta la pizza."

Usamos "me gusta" para expresar preferencias.
¿Cuál es tu pizza favorita?
```

---

### 🔤 Pronunciation Support

For languages with non-Latin scripts (Japanese, Chinese, Hindi, Telugu, etc.), responses include pronunciation:

```text
こんにちは！
(Konnichiwa!)

私はポリーです。
(Watashi wa Porī desu.)
```

---

### 📖 Translation & Help Mode

Type:

```text
/help
meaning
translate
what does that mean?
```

to receive:

- English translation
- Word-by-word explanation
- Pronunciation
- Suggested responses
- Cultural notes

---

### 💬 Scenario-Based Conversations

Practice real-world situations such as:

- Meeting a friend
- Ordering food
- Job interviews
- Traveling abroad
- Shopping
- Classroom conversations

Example:

```text
Scenario: Ordering food at a restaurant
```

---

### 🎭 Conversation Tone

Choose how the AI should speak:

- Casual
- Friendly
- Formal
- Professional
- Polite

Example:

Japanese:

**Casual**

```text
元気？
(Genki?)
```

**Formal**

```text
お元気ですか？
(O-genki desu ka?)
```

---

### 📈 Proficiency Levels

Adjust conversation difficulty:

- Beginner
- Intermediate
- Advanced

---

### 🔊 Speech Synthesis

Listen to AI responses with built-in browser speech synthesis.

Features:

- Inline speaker button (🔊)
- Language-specific voices
- Pronunciation playback

---

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Vite

### Backend

- Node.js
- Express.js
- OpenAI SDK

### AI Provider

- Groq API
- Llama 3.1 8B Instant

---

## 📂 Project Structure

```text
PolyGlotChat/
│
├── client/
│   ├── public/assets/
│   ├── src/
│   │   └── main.js
│   ├── styles/
│   │   └── styles.css
│   ├── index.html
│   └── vite.config.js
│
├── server/
│   └── server.js
│
├── dist/
├── .env
├── package.json
├── README.md
└── package-lock.json
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd PolyGlotChat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
PORT=3001
AI_URL=https://api.groq.com/openai/v1
AI_MODEL=llama-3.1-8b-instant
AI_KEY=YOUR_API_KEY
```

---

## ▶️ Run Locally

Start both frontend and backend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3001
```

---

## 📦 Build for Production

```bash
npm run build
npm start
```

---

## 🎯 Future Enhancements

- User authentication
- Progress tracking
- Vocabulary flashcards
- Achievements and streaks
- Voice input (speech-to-text)
- Pronunciation scoring
- AI-generated quizzes
- Conversation history export

---

## 📸 Sample Interaction

### Japanese

**User:**

```text
Konnichiwa! Watashi wa Harini desu.
```

**AI:**

```text
こんにちは、ハリニさん！
(Konnichiwa, Harini-san!)

私はポリーです。
(Watashi wa Porī desu.)

何を勉強していますか？
(Nani o benkyō shite imasu ka?)
```

---

## 👩‍💻 Author

Developed by **Harini Sri Reddy**

Built as an AI-powered language learning project exploring:

- Conversational AI
- Prompt Engineering
- Full Stack Development
- Natural Language Processing
- Human-Computer Interaction

---
