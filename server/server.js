import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cors());

const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ==========================
   ENVIRONMENT CHECK
========================== */

function checkEnvironment() {
  const required = ["AI_MODEL", "AI_URL", "AI_KEY"];

  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Missing environment variable: ${env}`);
    }
  }

  console.log("AI Model:", process.env.AI_MODEL);

  console.log("AI URL:", process.env.AI_URL);
}

checkEnvironment();

/* ==========================
   OPENAI CLIENT
========================== */

const openai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: process.env.AI_URL,
});

/* ==========================
   STATIC FILES
========================== */

app.use(express.static(path.join(__dirname, "../dist")));

/* ==========================
   SYSTEM PROMPT
========================== */

function buildSystemPrompt({
  language,
  level,
  scenario,
  helpRequested,
  lastAssistantMessage,
}) {
  let difficultyRules = "";

  switch (level) {
    case "Beginner":
      difficultyRules = `
      - Use simple vocabulary.
      - Use short sentences.
      - Avoid complex grammar.
      - Explain corrections briefly.
      `;
      break;

    case "Intermediate":
      difficultyRules = `
      - Use moderate vocabulary.
      - Introduce new grammar naturally.
      `;
      break;

    case "Advanced":
      difficultyRules = `
      - Use advanced vocabulary.
      - Use native-like expressions.
      `;
      break;
  }

  const nonLatinLanguages = [
    "Japanese",
    "Chinese",
    "Hindi",
    "Telugu",
    "Tamil",
    "Greek",
    "Russian",
    "Korean",
    "Arabic",
  ];

  const pronunciationRule = nonLatinLanguages.includes(language)
    ? `
      ========================
      MANDATORY OUTPUT FORMAT
      ========================

      IMPORTANT:
      The user may type using English letters (romaji/transliteration).

      You MUST ALWAYS reply in native script.

      NEVER mirror the user's Latin script.

      For every sentence:

      1. Write the sentence in native script.
      2. On the next line provide pronunciation in English letters.
      3. Never provide English translation unless help is requested.

      CORRECT FORMAT:

      こんにちは！
      (Konnichiwa!)

      私はポリーです。
      (Watashi wa Porī desu.)

      何を勉強していますか？
      (Nani o benkyō shite imasu ka?)

      INVALID FORMAT:

      Konnichiwa!
      こんにちは！

      INVALID FORMAT:

      Konnichiwa! Watashi wa Porī desu.

      Do not use IPA.
      Do not use phonetic symbols.
      Use natural pronunciation.

      Preserve user names exactly.
      Never change names.

      If the user writes:
      "Konnichiwa"

      You still reply:

      こんにちは！
      (Konnichiwa!)
    `
    : "";

  if (helpRequested) {
    return `
      You are a language tutor.
      The user requested help regarding the LAST AI MESSAGE.

      LAST AI MESSAGE:
      ${lastAssistantMessage}

      Return EXACTLY in this format:

      ## English Translation
      <full English translation>

      ## Word-by-Word Translation
      - word → pronunciation → meaning
      - phrase → pronunciation → meaning

      ## Explanation
      <brief explanation in English>

      ## How to Respond
      <one natural response in the target language>

      Do NOT continue the conversation.
      Do NOT add extra sections.
    `;
  }

  return `
    You are Polly, an expert language tutor.

    Target language: ${language}
    Student level: ${level}

    GLOBAL RULES:

    - ALWAYS respond entirely in ${language}.
    - Never use another language.
    - Never translate into English unless help is requested.
    - Keep replies under 3 short sentences.
    - Ask follow-up questions.
    - Preserve user names exactly.
    - Never change or "correct" names.

    CORRECTIONS:

    When correcting:

    1. Quote the corrected sentence.
    2. Explain briefly in ${language}.
    3. Continue naturally.

    The correction itself MUST be entirely in ${language}.
    Never use words or phrases from other languages.

    LANGUAGE PURITY RULE:

    Every response must be written entirely in ${language}.
    Do not use grammar terms from any other language.

    ${difficultyRules}

    ${pronunciationRule}

    ${
      scenario
        ? `
    SCENARIO:
    ${scenario}

    Remain within this scenario unless the user changes topics.
  `
        : ""
    }
`;
}

/* ==========================
   CHAT ENDPOINT
========================== */

app.post("/api/chat", async (req, res) => {
  try {
    const { language, level, scenario, messages } = req.body;

    if (!language || !level || !messages) {
      return res.status(400).json({
        error: "language, level and messages are required",
      });
    }

    const lastUserMessage =
      messages[messages.length - 1]?.content?.trim().toLowerCase() || "";

    const helpKeywords = [
      "/help",
      "help",
      "translate",
      "translation",
      "meaning",
      "means",
      "what does that mean",
      "what does this mean",
      "how to respond",
      "how do i respond",
      "how should i respond",
      "what should i say",
      "reply",
      "response",
      "english please",
      "i don't understand",
      "don't understand",
    ];

    const helpRequested = helpKeywords.some((keyword) =>
      lastUserMessage.includes(keyword),
    );

    let lastAssistantMessage = "";

    for (let i = messages.length - 2; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        lastAssistantMessage = messages[i].content;
        break;
      }
    }

    const systemPrompt = buildSystemPrompt({
      language,
      level,
      scenario,
      helpRequested,
      lastAssistantMessage,
    });

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL,

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },

        ...messages.slice(-20),
      ],

      temperature: 0.4,
      max_tokens: 350,
    });

    let reply = response.choices?.[0]?.message?.content;

    if (Array.isArray(reply)) {
      reply = reply.map((item) => item.text || "").join("");
    }

    if (!reply || !reply.trim()) {
      console.log(JSON.stringify(response, null, 2));

      reply = "Sorry, I couldn't generate a response.";
    }

    res.json({
      reply,
    });
  } catch (err) {
    console.error("AI Error:", err);

    res.status(500).json({
      error: "Something went wrong while contacting the AI service.",
    });
  }
});

/* ==========================
   FALLBACK ROUTE
========================== */

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

/* ==========================
   START SERVER
========================== */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
