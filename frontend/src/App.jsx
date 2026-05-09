import { useEffect, useRef, useState } from "react";
import {
  chatApi,
  createSessionApi,
  isTtsPaused,
  isTtsSpeaking,
  pauseTts,
  resumeTts,
  stopTts,
  ttsApi,
  updateLanguageApi,
  uploadPdfApi,
} from "./api/backend";

const LANGUAGES = {
  English: { code: "en", name: "English" },
  Hindi: { code: "hi", name: "Hindi" },
  Bengali: { code: "bn", name: "Bengali" },
  Telugu: { code: "te", name: "Telugu" },
  Marathi: { code: "mr", name: "Marathi" },
  Tamil: { code: "ta", name: "Tamil" },
};

export default function App() {
  const [sessionId, setSessionId] = useState("");
  const [ttsLanguage, setTtsLanguage] = useState("English");

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfStatus, setPdfStatus] = useState("");

  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const ttsTimerRef = useRef(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    createSession();
  }, []);

  const createSession = async () => {
    try {
      const data = await createSessionApi();
      setSessionId(data.session_id);
    } catch (err) {
      console.error(err);
      setSessionId(crypto.randomUUID());
    }
  };

  const updateLanguage = async (language) => {
    setTtsLanguage(language);
    if (!sessionId) return;

    try {
      await updateLanguageApi(sessionId, language);
    } catch (err) {
      console.error("Language update error:", err);
    }
  };

  // Poll speechSynthesis state so buttons stay in sync
  const startTtsPolling = () => {
    clearInterval(ttsTimerRef.current);
    ttsTimerRef.current = setInterval(() => {
      const speaking = isTtsSpeaking();
      const paused = isTtsPaused();
      setIsSpeaking(speaking);
      setIsPaused(paused);
      if (!speaking && !paused) {
        setSpeakingIndex(null);
        clearInterval(ttsTimerRef.current);
      }
    }, 200);
  };

  const playTTS = async (text, msgIndex = null) => {
    // If same message is speaking → stop it
    if (speakingIndex === msgIndex && isTtsSpeaking()) {
      stopTts();
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingIndex(null);
      clearInterval(ttsTimerRef.current);
      return;
    }
    try {
      setSpeakingIndex(msgIndex);
      setIsSpeaking(true);
      setIsPaused(false);
      startTtsPolling();
      await ttsApi(text, ttsLanguage);
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingIndex(null);
      clearInterval(ttsTimerRef.current);
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeTts();
      setIsPaused(false);
    } else {
      pauseTts();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    stopTts();
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeakingIndex(null);
    clearInterval(ttsTimerRef.current);
  };

  const uploadPDF = async () => {
    if (!pdfFile) return alert("Please select a PDF first!");

    setUploading(true);
    setPdfStatus("Uploading & processing PDF...");

    try {
      const data = await uploadPdfApi(sessionId, pdfFile);
      setPdfStatus(`✅ Processed: ${data.file_name || pdfFile.name}`);
      setMessages([]);
      if (data.session_id) setSessionId(data.session_id);
    } catch (err) {
      setPdfStatus("❌ Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    if (!sessionId) return alert("Session not created!");
    if (!pdfFile) return alert("Please upload a PDF first!");

    const userMessage = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      const data = await chatApi(sessionId, userMessage.content);

      const assistantMsg = {
        role: "assistant",
        content: data.answer || "",
        translated_content: data.translated_answer || data.answer || "",
      };

      setMessages((prev) => [...prev, assistantMsg]);

      const speakText = assistantMsg.translated_content || assistantMsg.content;
      const newIndex = messages.length + 1; // index after push
      if (speakText) await playTTS(speakText, newIndex);
    } catch (err) {
      console.error("Chat error:", err);
      alert("Chat failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setPdfStatus("✅ Chat cleared!");
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-[320px] border-r border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">
              📄 AI Document Intelligence Platform
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Upload a PDF & chat with it.
            </p>
          </div>

          {/* Session */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
            <p className="text-xs text-slate-300">Session ID</p>
            <p className="text-sm font-mono break-all text-slate-100 mt-1">
              {sessionId || "Creating..."}
            </p>
          </div>

          {/* Language */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
            <p className="text-sm font-semibold mb-2">🔊 TTS Language</p>
            <select
              value={ttsLanguage}
              onChange={(e) => updateLanguage(e.target.value)}
              className="w-full rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.keys(LANGUAGES).map((lang) => (
                <option value={lang} key={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Upload */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
            <p className="text-sm font-semibold mb-2">📤 Upload PDF</p>

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-white file:cursor-pointer hover:file:bg-indigo-500"
            />

            <button
              onClick={uploadPDF}
              disabled={uploading}
              className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
            >
              {uploading ? "Processing..." : "Upload & Process"}
            </button>

            {pdfStatus && (
              <p className="mt-3 text-xs text-slate-300">{pdfStatus}</p>
            )}
          </div>

          {/* Clear */}
          <button
            onClick={clearChat}
            className="w-full rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm font-semibold hover:bg-red-500/30"
          >
            🗑️ Clear Chat History
          </button>

          {!pdfFile && (
            <div className="mt-6 text-sm text-slate-300">
              <p className="mb-2">👈 Upload a PDF to begin</p>
              <p className="text-xs text-slate-400">
                Supported: English, Hindi, Bengali, Telugu, Marathi, Tamil
              </p>
            </div>
          )}
        </div>

        {/* Main Chat */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl p-5">
            <h1 className="text-2xl font-bold tracking-tight">
              AI Document Intelligence Platform
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Ask anything from your document — answers + multilingual TTS.
            </p>
          </div>

          {/* Chat window */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
                <p className="text-lg font-semibold text-slate-100">
                  Welcome 👋
                </p>
                <p className="mt-2 text-sm">
                  Upload a PDF from the sidebar, then ask questions here.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 border border-white/10 text-slate-100"
                    }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {msg.content}
                  </p>

                  {msg.role === "assistant" && (
                    <button
                      onClick={() =>
                        playTTS(msg.translated_content || msg.content, index)
                      }
                      className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs border transition-all ${
                        speakingIndex === index && isSpeaking
                          ? "bg-red-500/30 border-red-400/40 hover:bg-red-500/40 text-red-200"
                          : "bg-white/10 border-white/10 hover:bg-white/15 text-slate-100"
                      }`}
                    >
                      {speakingIndex === index && isSpeaking ? "⏹ Stop" : "🔊 Speak"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-slate-300">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Floating TTS control bar */}
          {isSpeaking && (
            <div className="mx-6 mb-3 flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-600/20 backdrop-blur-xl px-5 py-3 shadow-lg">
              <span className="flex items-center gap-2 text-sm font-medium text-indigo-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                {isPaused ? "Paused" : "Speaking..."}
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handlePauseResume}
                  className="rounded-lg bg-white/10 border border-white/15 px-4 py-1.5 text-xs font-semibold hover:bg-white/20 transition-all"
                >
                  {isPaused ? "▶ Resume" : "⏸ Pause"}
                </button>
                <button
                  onClick={handleStop}
                  className="rounded-lg bg-red-500/30 border border-red-400/30 px-4 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/50 transition-all"
                >
                  ⏹ Stop
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <div className="flex gap-3">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask something about the PDF..."
                className="flex-1 rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
              >
                Send ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
