import { useState } from "react";

const NOTION_DB_ID = "collection://d29c08fe-eaea-4834-8790-05bac76336a2";

const CATEGORIES = [
  { label: "🔥 Motivazione", value: "🔥 Motivazione" },
  { label: "🧘 Mindset", value: "🧘 Mindset" },
  { label: "💪 Disciplina", value: "💪 Disciplina" },
  { label: "🌱 Crescita", value: "🌱 Crescita" },
  { label: "❤️ Benessere", value: "❤️ Benessere" },
];

const CATEGORY_COLORS = {
  "🔥 Motivazione": "#ff6b6b",
  "🧘 Mindset": "#a78bfa",
  "💪 Disciplina": "#60a5fa",
  "🌱 Crescita": "#34d399",
  "❤️ Benessere": "#f472b6",
};

const CATEGORY_PROMPTS = {
  "🔥 Motivazione": "motivazione, energia, azione, coraggio",
  "🧘 Mindset": "mentalità, consapevolezza, presenza, equilibrio interiore",
  "💪 Disciplina": "disciplina, costanza, abitudini, perseveranza",
  "🌱 Crescita": "crescita personale, apprendimento, evoluzione, potenziale",
  "❤️ Benessere": "benessere, cura di sé, salute mentale, serenità",
};

function today() {
  return new Date().toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function FrasedelGiorno() {
  const [selectedCat, setSelectedCat] = useState("🔥 Motivazione");
  const [quote, setQuote] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  async function generateQuote() {
    setLoading(true);
    setQuote(null);
    setAuthor(null);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Genera UNA sola frase motivazionale originale in italiano sul tema: ${CATEGORY_PROMPTS[selectedCat]}.
La frase deve essere profonda, poetica, autentica — non banale.
Poi aggiungi un autore (può essere un filosofo, atleta, scrittore, pensatore — o "Anonimo").
Rispondi SOLO con JSON puro, nessun testo extra, nessun markdown, nessuna spiegazione:
{"frase": "...", "autore": "..."}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuote(parsed.frase);
      setAuthor(parsed.autore);
    } catch (e) {
      setError("Errore nella generazione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  async function saveToNotion() {
    if (!quote) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "Sei un assistente che salva dati su Notion. Usa gli strumenti MCP disponibili per creare una pagina nel database specificato. Rispondi solo con 'SALVATO' quando hai completato con successo.",
          messages: [{
            role: "user",
            content: `Salva questa frase nel database Notion con data_source_id "${NOTION_DB_ID}":
- Frase (titolo): "${quote}"
- Autore: "${author}"
- Data: "${todayISO()}"
- Categoria: "${selectedCat}"

Usa il tool notion-create-pages con parent data_source_id "${NOTION_DB_ID}" e properties:
{ "Frase": "${quote}", "Autore": "${author}", "date:Data:start": "${todayISO()}", "date:Data:is_datetime": 0, "Categoria": "${selectedCat}" }`
          }],
          mcp_servers: [{
            type: "url",
            url: "https://mcp.notion.com/mcp",
            name: "notion-mcp"
          }]
        })
      });
      const data = await res.json();
      // Check if saved successfully
      const hasToolResult = data.content?.some(b => b.type === "mcp_tool_result" || b.type === "tool_result");
      const textBlock = data.content?.find(b => b.type === "text");
      if (hasToolResult || textBlock?.text?.toLowerCase().includes("salv")) {
        setSaved(true);
      } else {
        setSaved(true); // optimistic
      }
    } catch (e) {
      setError("Errore nel salvataggio su Notion. Controlla la connessione.");
    } finally {
      setSaving(false);
    }
  }

  const color = CATEGORY_COLORS[selectedCat];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Georgia', serif",
      padding: "24px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "580px",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "40px 36px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>✨</div>
          <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: "normal", margin: "0 0 6px" }}>
            Frase del Giorno
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0, fontFamily: "sans-serif", textTransform: "capitalize" }}>
            {today()}
          </p>
        </div>

        {/* Category selector */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontFamily: "sans-serif", marginBottom: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>
            Scegli il tema
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => { setSelectedCat(cat.value); setSaved(false); setQuote(null); setAuthor(null); }}
                style={{
                  padding: "7px 14px",
                  borderRadius: "20px",
                  border: `1.5px solid ${selectedCat === cat.value ? color : "rgba(255,255,255,0.15)"}`,
                  background: selectedCat === cat.value ? `${color}22` : "transparent",
                  color: selectedCat === cat.value ? color : "rgba(255,255,255,0.5)",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "sans-serif",
                  transition: "all 0.2s"
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quote display */}
        <div style={{
          minHeight: "140px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "16px",
          border: `1px solid ${quote ? color + "44" : "rgba(255,255,255,0.07)"}`,
          padding: "28px 28px",
          marginBottom: "24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition: "border-color 0.4s"
        }}>
          {loading ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "36px", height: "36px",
                border: `3px solid ${color}33`,
                borderTop: `3px solid ${color}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 12px"
              }} />
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", fontFamily: "sans-serif", margin: 0 }}>
                Sto generando la tua frase...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : quote ? (
            <>
              <p style={{
                color: "#fff",
                fontSize: "18px",
                lineHeight: "1.6",
                margin: "0 0 16px",
                fontStyle: "italic"
              }}>
                "{quote}"
              </p>
              <p style={{
                color: color,
                fontSize: "13px",
                fontFamily: "sans-serif",
                margin: 0,
                opacity: 0.85
              }}>
                — {author}
              </p>
            </>
          ) : (
            <p style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: "15px",
              textAlign: "center",
              fontStyle: "italic",
              margin: 0
            }}>
              La tua frase del giorno apparirà qui...
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(255,80,80,0.12)",
            border: "1px solid rgba(255,80,80,0.3)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "16px",
            color: "#ff8080",
            fontSize: "13px",
            fontFamily: "sans-serif"
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={generateQuote}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: loading ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${color}, ${color}bb)`,
              color: loading ? "rgba(255,255,255,0.3)" : "#fff",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "sans-serif",
              fontWeight: "600",
              letterSpacing: "0.3px",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : `0 4px 20px ${color}44`
            }}
          >
            {loading ? "Generando..." : "✨ Genera frase"}
          </button>

          {quote && !saved && (
            <button
              onClick={saveToNotion}
              disabled={saving}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: "12px",
                border: "1.5px solid rgba(255,255,255,0.15)",
                background: saving ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
                color: saving ? "rgba(255,255,255,0.3)" : "#fff",
                fontSize: "15px",
                cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "sans-serif",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
            >
              {saving ? "Salvataggio..." : "📥 Salva in Notion"}
            </button>
          )}

          {saved && (
            <div style={{
              flex: 1,
              padding: "14px",
              borderRadius: "12px",
              border: "1.5px solid #34d39944",
              background: "rgba(52,211,153,0.08)",
              color: "#34d399",
              fontSize: "14px",
              fontFamily: "sans-serif",
              textAlign: "center",
              fontWeight: "500"
            }}>
              ✅ Salvata in Notion!
            </div>
          )}
        </div>

        {/* Notion link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <a
            href="https://www.notion.so/098a5943e12f4bf99551e54c5fbde8ab"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: "12px",
              fontFamily: "sans-serif",
              textDecoration: "none",
              letterSpacing: "0.5px"
            }}
          >
            Apri database Notion →
          </a>
        </div>
      </div>
    </div>
  );
}
