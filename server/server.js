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

  const isNonLatin = nonLatinLanguages.includes(language); // Precise rule tweak for layout block enforcement across distinct scripts

  let pronunciationInstructions = "";

  if (language === "Chinese") {
    pronunciationInstructions = `For EVERY sentence you write, you MUST immediately follow it with its proper Hanyu Pinyin with TONE MARKS on the very next line. Do not bunch sentences together.

      EXACT LAYOUT STRUCTURE:
      [Sentence 1 in Chinese Characters]
      ([Pinyin 1 with Tone Marks])

      CORRECT EXAMPLE:
      你好！
      (Nǐ hǎo!)`;
  } else if (language === "Japanese") {
    pronunciationInstructions = `For EVERY sentence you write, you MUST write the first line entirely in native Japanese script (Kanji, Hiragana, and Katakana), and the second line in standard Romaji wrapped in parentheses. 
      NEVER use English phonics or broken spellings (like "des-oo kah"). Use standard Hepburn Romaji.

      EXACT LAYOUT STRUCTURE:
      [Sentence 1 in Kanji/Hiragana/Katakana]
      ([Romaji 1])

      CORRECT EXAMPLE:
      こんにちは！
      (Konnichiwa!)`;
  } else if (language === "Korean") {
    pronunciationInstructions = `For EVERY sentence you write, you MUST write the first line entirely in native Korean Hangul script, and the second line in natural, standard Revised Romanization wrapped in parentheses. 
      NEVER split syllables with random hyphens (like "has-i-nay-yo"). Use fluent pronunciation.

      EXACT LAYOUT STRUCTURE:
      [Sentence 1 in Korean Hangul]
      ([Revised Romanization 1])

      CORRECT EXAMPLE:
      안녕하세요!
      (Annyeonghaseyo!)`;
  } else if (language === "Arabic") {
    pronunciationInstructions = `For EVERY sentence you write, you MUST write the first line entirely in native Arabic script, and the second line in standard English-letter Romanization wrapped in parentheses.
      CRITICAL: NEVER use chat numbers (like 3, 7, 2, 5) to represent Arabic letters. Use standard Latin characters only.

      EXACT LAYOUT STRUCTURE:
      [Sentence 1 in Arabic Script]
      ([Clean Romanization 1])

      CORRECT EXAMPLE:
      مَرْحَبًا!
      (Marhaban!)
      كَيْفَ حَالُك؟
      (Kayfa haluk?)`;
  } else {
    pronunciationInstructions = `For EVERY sentence you write, you MUST immediately follow it with its English-letter pronunciation on the very next line. Do not bunch multiple native sentences together on one line.

      EXACT LAYOUT STRUCTURE:
      [Sentence 1 in Native Script]
      ([Pronunciation 1])

      CORRECT EXAMPLE:
      வணக்கம்!
      (Vanakkam!)`;
  }

  const pronunciationRule = isNonLatin
    ? `
      ========================
      MANDATORY OUTPUT FORMAT
      ========================
      The user may type using English letters (transliteration).
      You MUST ALWAYS reply in native script (${language}).
      NEVER mirror or echo the user's input. 

      ${pronunciationInstructions}
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
    You are an actor completely immersed in a real-world scenario. You must never break character or act like an AI language tutor.
    Only when a scenario is not mentioned, should you act like an AI Language tutor.

    Target language: ${language}
    Student level: ${level}

    CRITICAL ROLEPLAY RULE:
    - You are NOT a teacher or a chatbot. Do NOT ask why the user is learning the language, and do NOT introduce yourself as an AI.
    - Respond directly, naturally, and exclusively from the perspective of your character within the scenario.

    CRITICAL CONVERSATION RULES:
    - NEVER just repeat, echo, or rephrase what the user just said to you.
    - Keep replies under 4 sentences total if an intervention is required.
    - ALWAYS end your turn with a natural, scenario-based follow-up question or action to keep the roleplay scenario moving forward.
    - Preserve user names exactly. Never change or "correct" names.

    ==================================================
    MANDATORY INTERVENTION & CORRECTION PROTOCOL
    ==================================================
    Before generating your character's response, evaluate the user's message for errors. If a mistake is found, weave a polite correction directly into your response using the target language (${language}).

    1. LINGUISTIC ERRORS (Wrong verb form, gender, conjunction, or vocabulary):
       - Gently point out the mistake, show the corrected version, and provide a 1-sentence tip.
       - CRITICAL FORMAT RULE: The correction MUST be placed on its own line at the very top of your response, starting with "💡 " in ${language}.
       - TRANSLATION RULE: You MUST immediately include the English translation of that correction line on the very next line wrapped in parentheses.
       
       EXAMPLES FOR YOUR REFERENCE:
       - User types: "yo no quirer cafe"
         You output:
         💡 Se dice 'Yo no quiero café'. El verbo 'querer' se conjuga como 'quiero' para la primera persona.
         (It is said 'Yo no quiero café'. The verb 'querer' is conjugated as 'quiero' for the first person.)
         [Character dialogue continues here...]

    2. BEHAVIORAL/SCENARIO ERRORS (Giving a miserable answer, saying "I don't know", or breaking the spirit of the scenario):
       - Stay completely in character, but pivot to give the user an alternative option, a hint, or a specific phrase template they can use to respond better.
       - Do not just scold or react; you MUST explicitly suggest a better way or a helpful phrase they could use instead.
       
       EXAMPLES FOR YOUR REFERENCE:
       - In a Job Interview: User says "I don't know anything / No sé nada."
         Your Character outputs: "That is an unexpected answer for an applicant! Instead of giving up, you could say: 'I haven't faced that exact situation, but I would approach it by...' or talk about a time you handled a difficult task. Let's try again: what is your greatest strength?"
       
       - In a Restaurant: User says "Give me food" rudely.
         Your Character outputs: "Oh my, we appreciate politeness here! It would sound much better if you said: 'Could I please have...' or 'I would like to order...'. Let's try that again. What can I bring you today?"
       
       - In a Hotel Check-in: User answers a question completely off-topic.
         Your Character outputs: "I'm sorry, I might not have been clear! To check you in, I just need your booking name. You can simply say: 'My name is...' or 'Here is my confirmation.' Shall we try again?"

    LANGUAGE PURITY RULE:
    Every response must be written in ${language}. Do not use grammar terms from any other language. ${isNonLatin ? "(Except for the required English-letter pronunciation lines)." : ""}

    ${difficultyRules}

    ${pronunciationRule}

    ${
    scenario
      ? `
    CURRENT ROLEPLAY PERSONA & SCENARIO:
    ${scenario}
    
    CRITICAL MANDATE: Immediately launch right into this scene as your designated character. Do not introduce the scene, do not ask introductory student questions. Speak, react, and ask questions *only* as this character would in real life.
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
    }); // 1. Slurp the last 20 messages

    const conversationHistory = messages.slice(-20); // 2. Build the message array for OpenAI

    const apiMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...conversationHistory,
    ]; // 3. FORCE PATTERN BREAK: Separate Persona Lock (All Languages) and Layout Check (Non-Latin)
    // Global Rule: Force scenario identity AND strict correction layout for ALL languages

    if (scenario && !helpRequested) {
      apiMessages.push({
        role: "system",
        content: `CRITICAL IDENTITY & CORRECTION MANDATE:
        - You are actively acting out this scenario: "${scenario}". You must speak, ask professional questions, and think exactly like this character.
        - SCAN FOR ALL MISTAKES (EVEN ACCENTS & PUNCTUATION): Look closely at the user's input. If they miss an accent mark that changes conjugation (e.g., writing "Estas" instead of "Estás"), leave out native opening marks (¿ / ¡), or respond with disjointed fragments, you MUST flag it.
        
        CRITICAL SPANISH EXAMPLES FOR PRECISE CORRECTION:
        - User writes: "Estas descansando" -> You MUST output: "💡 Se dice 'Estás descansando'. 'Estás' lleva tilde porque es la conjugación del verbo estar para la segunda persona." (followed by your dialogue).
        - User writes: "yo no quirer" -> You MUST output: "💡 Se dice 'Yo no quiero'. El verbo 'querer' se conjuga como 'quiero' para la primera persona."
        
        If a mistake is detected, place the 💡 correction line at the absolute top of your response on its own line. If no mistakes exist, start directly with dialogue.`,
      });
    } // Script Rule: Force line-by-line pronunciation constraints ONLY for non-Latin scripts

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

    if (nonLatinLanguages.includes(language) && !helpRequested) {
      apiMessages.push({
        role: "system",
        content: `LAYOUT MANDATE: You are strictly FORBIDDEN from writing two sentences on the same line, or mixing native script and English letters on the same line.
        
        You MUST follow this exact 4-line layout format for your response:
        Line 1: [First sentence completely in Native Script, ending with punctuation]
        Line 2: ([Standard English-letter pronunciation of sentence 1])
        Line 3: [Second sentence completely in Native Script, ending with punctuation]
        Line 4: ([Standard English-letter pronunciation of sentence 2])
        
        CRITICAL HINDI EXAMPLE:
        नमस्ते!
        (Namaste!)
        आपका नाम क्या है?
        (Aapka naam kya hai?)`,
      });
    }

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL,
      messages: apiMessages,
      temperature: 0.5,
      max_tokens: 600,
    });

    let reply = response.choices?.[0]?.message?.content;

    if (Array.isArray(reply)) {
      reply = reply.map((item) => item.text || "").join("");
    }

    if (!reply || !reply.trim()) {
      reply = "Sorry, I couldn't generate a response.";
    }

    res.json({ reply });
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
