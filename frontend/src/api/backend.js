
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const createSessionApi = async () => {
  const res = await fetch(`${BACKEND_URL}/create_session`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
};

export const updateLanguageApi = async (sessionId, language) => {
  const res = await fetch(
    `${BACKEND_URL}/update_tts_language?session_id=${sessionId}&language=${language}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error("Failed to update language");
  return res.json();
};

export const uploadPdfApi = async (sessionId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BACKEND_URL}/upload_pdf?session_id=${sessionId}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }

  return res.json();
};

export const chatApi = async (sessionId, question) => {
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      question,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText);
  }

  return res.json();
};

// Language name → BCP-47 code for Web Speech API
const LANG_CODES = {
  English: "en-US",
  Hindi: "hi-IN",
  Bengali: "bn-IN",
  Telugu: "te-IN",
  Marathi: "mr-IN",
  Tamil: "ta-IN",
};

/**
 * Strip markdown, symbols, and punctuation noise so TTS only reads natural prose.
 */
const cleanTextForTts = (text) => {
  return text
    // Remove markdown headings (## Heading)
    .replace(/#{1,6}\s*/g, "")
    // Remove bold/italic (**, *, __, _)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove inline code (`code`)
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    // Remove blockquotes (> text)
    .replace(/^\s*>\s*/gm, "")
    // Remove horizontal rules (---, ___, ***)
    .replace(/^[-_*]{3,}\s*$/gm, "")
    // Remove bullet / numbered list markers (-, *, •, 1.)
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    // Remove URLs
    .replace(/https?:\/\/\S+/g, "")
    // Remove emojis
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    // Remove leftover special characters (except sentence punctuation)
    .replace(/[|\\^~<>{}[\]]/g, "")
    // Collapse multiple punctuation (e.g. "!!" → "!")
    .replace(/([.!?,;:]){2,}/g, "$1")
    // Collapse multiple spaces / newlines into a single space
    .replace(/\s+/g, " ")
    .trim();
};

export const ttsApi = (text, language) => {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Web Speech API not supported in this browser"));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForTts(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);

    utterance.lang = LANG_CODES[language] || "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onend = () => resolve(true);
    utterance.onerror = (e) => reject(new Error("TTS failed: " + e.error));

    window.speechSynthesis.speak(utterance);
  });
};

export const stopTts = () => {
  window.speechSynthesis?.cancel();
};

export const pauseTts = () => {
  if (window.speechSynthesis?.speaking) window.speechSynthesis.pause();
};

export const resumeTts = () => {
  if (window.speechSynthesis?.paused) window.speechSynthesis.resume();
};

export const isTtsSpeaking = () => !!window.speechSynthesis?.speaking;
export const isTtsPaused = () => !!window.speechSynthesis?.paused;

