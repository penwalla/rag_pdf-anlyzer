export default function ChatHeader({ sessionId }) {
  return (
    <div style={{ padding: "20px", borderBottom: "1px solid #ddd" }}>
      <h2>📄🤖AI Document Intelligence Platform </h2>
      <p>Upload a PDF and chat with it using Google Gemini.</p>
      <p style={{ fontSize: "13px", color: "#555" }}>
        Session: <b>{sessionId}</b>
      </p>
    </div>
  );
}
