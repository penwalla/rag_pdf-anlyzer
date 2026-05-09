export default function ChatInput({ prompt, setPrompt, sendMessage, loading }) {
  return (
    <div
      style={{
        padding: "15px",
        borderTop: "1px solid #ddd",
        display: "flex",
        gap: "10px",
      }}
    >
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask something about the PDF..."
        style={{ flex: 1, padding: "10px" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendMessage();
        }}
      />

      <button
        onClick={sendMessage}
        disabled={loading}
        style={{ padding: "10px 15px", cursor: "pointer" }}
      >
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
}
