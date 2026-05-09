export default function Sidebar({
  LANGUAGES,
  ttsLanguage,
  updateLanguage,
  setPdfFile,
  uploadPDF,
  loading,
  pdfStatus,
  clearChat,
  pdfFile,
}) {
  return (
    <div
      style={{
        width: "280px",
        padding: "15px",
        borderRight: "1px solid #ddd",
        background: "#fafafa",
      }}
    >
      <h3>⚙️ Sidebar</h3>

      <h4>TTS Settings</h4>
      <select
        value={ttsLanguage}
        onChange={(e) => updateLanguage(e.target.value)}
        style={{ width: "100%", padding: "8px" }}
      >
        {Object.keys(LANGUAGES).map((lang) => (
          <option value={lang} key={lang}>
            {lang}
          </option>
        ))}
      </select>

      <hr />

      <h4>Upload PDF</h4>
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setPdfFile(e.target.files[0])}
        style={{ width: "100%" }}
      />

      <button
        onClick={uploadPDF}
        disabled={loading}
        style={{
          width: "100%",
          marginTop: "10px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        {loading ? "Processing..." : "Upload PDF"}
      </button>

      <p style={{ fontSize: "14px" }}>{pdfStatus}</p>

      <hr />

      <button
        onClick={clearChat}
        style={{
          width: "100%",
          padding: "10px",
          cursor: "pointer",
          background: "#ffeded",
          border: "1px solid #ffb3b3",
        }}
      >
        🗑️ Clear Chat History
      </button>

      <hr />

      {!pdfFile && (
        <div style={{ fontSize: "14px" }}>
          <p>👈 Please upload a PDF document to get started</p>
          <b>Supported Languages:</b>
          <ul>
            {Object.keys(LANGUAGES).map((lang) => (
              <li key={lang}>{lang}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
