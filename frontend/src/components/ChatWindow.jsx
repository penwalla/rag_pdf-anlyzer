export default function ChatWindow({ messages, playTTS, chatEndRef }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "20px",
        overflowY: "auto",
        background: "#ffffff",
      }}
    >
      {messages.map((msg, index) => (
        <div
          key={index}
          style={{
            marginBottom: "15px",
            textAlign: msg.role === "user" ? "right" : "left",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "12px",
              borderRadius: "10px",
              background: msg.role === "user" ? "#dff1ff" : "#f1f1f1",
              maxWidth: "75%",
              whiteSpace: "pre-wrap",
            }}
          >
            {msg.content}
          </div>

          {msg.role === "assistant" && (
            <div style={{ marginTop: "6px" }}>
              <button
                onClick={() => playTTS(msg.translated_content || msg.content)}
                style={{ padding: "6px 10px", cursor: "pointer" }}
              >
                🔊 Speak Response {index + 1}
              </button>
            </div>
          )}
        </div>
      ))}

      <div ref={chatEndRef} />
    </div>
  );
}
