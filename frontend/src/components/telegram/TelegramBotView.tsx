import React, { useState, useEffect, useRef } from "react";
import {
  Send, Bot, CheckCircle, RefreshCw,
  Copy, Check, MessageSquare, Terminal, Zap,
} from "lucide-react";
import { api } from "../../services/api";
import type { TelegramBotInfo } from "../../types";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text?: string;
  html?: string;
  time: string;
  extractedCaseRef?: string | null;
}

export const TelegramBotView: React.FC = () => {
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      html: `<b>Namaste! 🙏</b><br/><br/>
🏛️ <b>AICTE Grievance Status Tracker Bot</b><br/>
━━━━━━━━━━━━━━━━━━━━━━<br/>
Check your grievance case status instantly without logging into any web portal.<br/><br/>
👉 <b>How to check:</b><br/>
Simply text your <b>Case Reference ID</b> to this chat.<br/><br/>
<i>Examples:</i><br/>
• <code>AIC-2026-0001</code><br/>
• <code>AIC-2026-0005</code><br/>
• <code>/status AIC-2026-0010</code><br/><br/>
🔒 <i>Note: Complainant confidential personal details are strictly masked for privacy.</i>`,
      time: "Just now",
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.getTelegramInfo();
        if (res.success && res.data) {
          setBotInfo(res.data);
        }
      } catch (e) {
        console.error("Failed to load telegram bot info:", e);
      }
    };
    fetchInfo();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: msgText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await api.simulateTelegramMessage({
        message: msgText.trim(),
        first_name: "Student",
      });

      if (res.success && res.data) {
        const botReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          html: res.data.reply_html.replace(/\n/g, "<br/>"),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          extractedCaseRef: res.data.extracted_case_ref,
        };
        setMessages((prev) => [...prev, botReply]);
      } else {
        const errorReply: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "⚠️ Sorry, unable to query grievance status right now. Please try again shortly.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorReply]);
      }
    } catch (e) {
      console.error("Failed to simulate telegram message:", e);
    } finally {
      setLoading(false);
    }
  };

  const sampleChips = [
    { label: "/start", text: "/start" },
    { label: "AIC-2026-0001", text: "AIC-2026-0001" },
    { label: "AIC-2026-0005", text: "AIC-2026-0005" },
    { label: "Status inquiry", text: "What is status of AIC-2026-0002?" },
    { label: "/help", text: "/help" },
  ];

  const fullWebhookUrl = `${window.location.origin}/api/v1/telegram/webhook`;
  const curlExample = `curl -F "url=${fullWebhookUrl}" https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook`;

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #0088CC, #29B6F6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MessageSquare size={20} color="#fff" />
            </div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
              Telegram Bot Grievance Tracker
            </h2>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            Zero-login student status lookup: Students text their Case ID to the AICTE Telegram Bot and receive real-time status in seconds.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{
            background: "rgba(16,185,129,0.15)", color: "#10B981",
            border: "1px solid rgba(16,185,129,0.3)", padding: "0.35rem 0.75rem",
            borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }} />
            Webhook Active & Ready
          </span>
        </div>
      </div>

      {/* Main Grid: Telegram Simulator + Webhook Config Card */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
        gap: "1.5rem", alignItems: "start",
      }}>
        {/* Left: Telegram Phone Mockup Simulator */}
        <div style={{
          background: "#17212B", // Telegram dark theme header
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          height: "640px",
        }}>
          {/* Telegram App Header */}
          <div style={{
            background: "#242F3D",
            padding: "0.9rem 1.25rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "linear-gradient(135deg, #0088CC, #29B6F6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: "#fff", fontSize: "1rem",
              }}>
                <Bot size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>
                    AICTE Grievance Tracker
                  </span>
                  <CheckCircle size={14} color="#29B6F6" fill="#242F3D" />
                </div>
                <div style={{ color: "#6C7883", fontSize: "0.75rem" }}>
                  bot &bull; {botInfo?.bot_username || "@aicte_grievance_bot"} &bull; instant webhook
                </div>
              </div>
            </div>

            <button
              onClick={() => setMessages([messages[0]])}
              title="Clear Chat"
              style={{
                background: "transparent", border: "none", color: "#6C7883",
                cursor: "pointer", padding: "0.4rem", borderRadius: "6px",
              }}
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div style={{
            flex: 1, padding: "1rem", overflowY: "auto",
            display: "flex", flexDirection: "column", gap: "0.75rem",
            background: "#0E1621",
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "0.75rem 1rem",
                    borderRadius: m.sender === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: m.sender === "user" ? "#2B5278" : "#182533",
                    color: "#FFFFFF",
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                    wordBreak: "break-word",
                  }}
                >
                  {m.html ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: m.html }}
                      style={{
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                      }}
                    />
                  ) : (
                    <div>{m.text}</div>
                  )}
                  <div style={{
                    textAlign: "right", fontSize: "0.65rem",
                    color: "rgba(255, 255, 255, 0.4)", marginTop: "0.3rem",
                  }}>
                    {m.time}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  background: "#182533", padding: "0.6rem 1rem", borderRadius: "12px",
                  display: "flex", alignItems: "center", gap: "0.4rem",
                }}>
                  <span style={{ fontSize: "0.75rem", color: "#6C7883" }}>bot is typing</span>
                  <div className="typing-dot" style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#29B6F6" }} />
                  <div className="typing-dot" style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#29B6F6", animationDelay: "0.2s" }} />
                  <div className="typing-dot" style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#29B6F6", animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div style={{
            background: "#17212B", padding: "0.5rem 0.75rem",
            display: "flex", gap: "0.4rem", overflowX: "auto",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          }}>
            {sampleChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleSendMessage(chip.text)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#E2E8F0", padding: "0.25rem 0.6rem", borderRadius: "12px",
                  fontSize: "0.72rem", cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#2B5278"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255, 255, 255, 0.06)"; }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
            style={{
              background: "#17212B", padding: "0.75rem 1rem",
              display: "flex", alignItems: "center", gap: "0.5rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send Case ID (e.g. AIC-2026-0001)..."
              disabled={loading}
              style={{
                flex: 1, background: "#242F3D", border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "20px", padding: "0.6rem 1rem", color: "#FFFFFF",
                fontSize: "0.85rem", outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: inputText.trim() ? "#0088CC" : "rgba(255, 255, 255, 0.1)",
                border: "none", color: "#fff", cursor: inputText.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Right: Architecture & Webhook Setup Documentation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Key Advantages Card */}
          <div className="glass-panel" style={{ borderLeft: "4px solid #0088CC", padding: "1.25rem" }}>
            <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Zap size={18} color="#0088CC" />
              <span>Why Telegram Bot Grievance Tracking?</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1rem" }}>
              Traditional grievance portals require complex OTP verification, password recovery, and multi-step navigation just to check if a complaint was resolved. The AICTE Telegram Bot webhook resolves this friction completely.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, color: "#60A5FA", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                  Zero Friction
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  No username, password, or portal login needed. Just text the reference ID.
                </div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, color: "#10B981", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                  &lt;150ms Turnaround
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Direct indexed database lookup with SLA escalation badges and timeline.
                </div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, color: "#F59E0B", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                  PII Confidentiality
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Complainant personal details remain masked; only official resolution directives are shared.
                </div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700, color: "#EC4899", fontSize: "0.82rem", marginBottom: "0.2rem" }}>
                  Master Ticket Aware
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Grouped fee/harassment complaints automatically reflect bulk resolution directives.
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Configuration & Setup Guide */}
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Terminal size={16} color="#A78BFA" />
                <span>Live Webhook Integration</span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Telegram Bot API v7.0
              </span>
            </div>

            {/* Webhook URL bar */}
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                Public Webhook URL (POST)
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(0, 0, 0, 0.3)", border: "1px solid var(--border-subtle)",
                borderRadius: "8px", padding: "0.5rem 0.75rem", marginTop: "0.3rem",
              }}>
                <code style={{ fontSize: "0.8rem", color: "#60A5FA", flex: 1, wordBreak: "break-all" }}>
                  {fullWebhookUrl}
                </code>
                <button
                  onClick={() => copyToClipboard(fullWebhookUrl, setCopiedWebhook)}
                  style={{
                    background: "none", border: "none", color: copiedWebhook ? "#10B981" : "var(--text-muted)",
                    cursor: "pointer", display: "flex", alignItems: "center", padding: "0.2rem",
                  }}
                  title="Copy Webhook URL"
                >
                  {copiedWebhook ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* One-Click setWebhook Curl Command */}
            <div>
              <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                Bind Webhook with Telegram (setWebhook)
              </label>
              <div style={{
                background: "#0F172A", border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px", padding: "0.75rem", marginTop: "0.3rem",
                position: "relative",
              }}>
                <pre style={{
                  margin: 0, fontSize: "0.75rem", color: "#94A3B8",
                  fontFamily: "var(--font-mono)", overflowX: "auto", whiteSpace: "pre-wrap",
                }}>
                  {curlExample}
                </pre>
                <button
                  onClick={() => copyToClipboard(curlExample, setCopiedCurl)}
                  style={{
                    position: "absolute", top: "0.5rem", right: "0.5rem",
                    background: "rgba(255, 255, 255, 0.08)", border: "none",
                    color: copiedCurl ? "#10B981" : "#94A3B8", padding: "0.3rem 0.5rem",
                    borderRadius: "4px", cursor: "pointer", fontSize: "0.7rem",
                    display: "flex", alignItems: "center", gap: "0.3rem",
                  }}
                >
                  {copiedCurl ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCurl ? "Copied" : "Copy Curl"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Typing animation styles */}
      <style>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot {
          animation: typing 1.4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
