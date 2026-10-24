import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  CheckCircle,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  Terminal,
  Zap,
  ShieldCheck,
  ExternalLink,
  Code2,
} from "lucide-react";
import { getTelegramBotInfo, simulateTelegramChat } from "@/api/index";
import type { TelegramBotInfo } from "@/types/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text?: string;
  html?: string;
  time: string;
  extractedCaseRef?: string | null;
}

export function TelegramBotView() {
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      html: `<b>Namaste! 🙏</b><br/><br/>
🏛️ <b>AICTE Grievance Status Tracker Bot (@aictesih_bot)</b><br/>
━━━━━━━━━━━━━━━━━━━━━━<br/>
Check your grievance case or master ticket status instantly without logging into any web portal.<br/><br/>
👉 <b>How to check:</b><br/>
Simply text your <b>Case Reference ID</b> or <b>Master Ticket ID</b> to this chat.<br/><br/>
<i>Try typing:</i><br/>
• <code>AICTE-2026-1001</code><br/>
• <code>AICTE-2026-1003</code><br/>
• <code>MT-DD4A3444</code><br/>
• <i>&quot;What is the status of AICTE-2026-1002?&quot;</i><br/><br/>
🔒 <i>Note: Complainant confidential personal details are strictly masked for student privacy.</i>`,
      time: "Just now",
    },
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const info = await getTelegramBotInfo();
        setBotInfo(info);
      } catch (e: any) {
        console.error("Failed to load Telegram info:", e);
      }
    };
    fetchInfo();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || inputText).trim();
    if (!msg || loading) return;

    const userMsgId = Date.now().toString();
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: "user",
        text: msg,
        time: nowTime,
      },
    ]);
    setInputText("");
    setLoading(true);

    try {
      const res = await simulateTelegramChat(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          html: res.reply_html,
          extractedCaseRef: res.extracted_case_ref,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "⚠️ Server connectivity error. Please ensure FastAPI backend is running on port 8001.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText("https://your-domain.gov.in/api/v1/telegram/webhook");
    setCopiedWebhook(true);
    toast.success("Webhook URL copied to clipboard");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Bot className="h-6 w-6" />
            </span>
            <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
              Zero-Login Telegram Status Bot Tracker
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-3xl">
            Public Omnichannel Interface (@aictesih_bot). Complainants text their Case Reference ID or Master Ticket ID 
            to receive instant real-time progress updates with PII confidentiality redaction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600 text-white gap-1 text-xs py-1 px-2.5">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Bot Active &amp; Polling
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Chat Sandbox (7 cols) */}
        <div className="lg:col-span-7 bg-white/85 dark:bg-[#0B0813]/85 backdrop-blur-md border border-rule rounded-2xl shadow-xs flex flex-col h-[640px] overflow-hidden">
          {/* Telegram-style Top Bar */}
          <div className="px-5 py-3.5 bg-sky-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                🤖
              </div>
              <div>
                <div className="font-semibold text-sm leading-tight">
                  {botInfo?.bot_name || "AICTE Grievance Status Tracker Bot"}
                </div>
                <div className="text-[11px] text-sky-100 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>@aictesih_bot • Online</span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setMessages([
                  {
                    id: "1",
                    sender: "bot",
                    html: `<b>Namaste! 🙏</b><br/>Chat cleared. Send any Case Reference ID (e.g. <code>AICTE-2026-00001</code>) to check live status.`,
                    time: "Just now",
                  },
                ])
              }
              className="text-white hover:bg-white/20 text-xs h-7 px-2"
            >
              Clear Chat
            </Button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-[#06040C]/60 text-xs">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs space-y-1.5 ${
                      isUser
                        ? "bg-sky-600 text-white rounded-br-none"
                        : "bg-white dark:bg-[#140E24] text-ink border border-rule/80 rounded-bl-none"
                    }`}
                  >
                    {m.html ? (
                      <div
                        className="leading-relaxed whitespace-pre-wrap font-sans"
                        dangerouslySetInnerHTML={{ __html: m.html }}
                      />
                    ) : (
                      <div className="leading-relaxed whitespace-pre-wrap">{m.text}</div>
                    )}
                    <div
                      className={`text-[9px] text-right font-mono ${
                        isUser ? "text-sky-200" : "text-text-secondary"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-[#140E24] border border-rule/80 rounded-2xl rounded-bl-none px-4 py-2 text-xs text-text-secondary flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-sky-500" />
                  <span>AICTE Bot is typing...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2 bg-slate-100/70 dark:bg-[#090710] border-t border-rule/60 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0">
            <span className="text-text-secondary shrink-0 font-medium">Quick Test:</span>
            <button
              onClick={() => handleSendMessage("AICTE-2026-1001")}
              className="px-2 py-0.5 rounded bg-white dark:bg-[#151026] border border-rule text-sky-600 dark:text-sky-400 font-mono hover:bg-sky-50 shrink-0"
            >
              AICTE-2026-1001
            </button>
            <button
              onClick={() => handleSendMessage("AICTE-2026-1003")}
              className="px-2 py-0.5 rounded bg-white dark:bg-[#151026] border border-rule text-sky-600 dark:text-sky-400 font-mono hover:bg-sky-50 shrink-0"
            >
              AICTE-2026-1003
            </button>
            <button
              onClick={() => handleSendMessage("MT-DD4A3444")}
              className="px-2 py-0.5 rounded bg-white dark:bg-[#151026] border border-rule text-purple-600 dark:text-purple-400 font-mono hover:bg-purple-50 shrink-0"
            >
              MT-DD4A3444 (Master Ticket)
            </button>
            <button
              onClick={() => handleSendMessage("What is the status of AICTE-2026-1002?")}
              className="px-2 py-0.5 rounded bg-white dark:bg-[#151026] border border-rule text-text-secondary hover:text-ink hover:bg-white shrink-0"
            >
              &quot;Status of 1002?&quot;
            </button>
            <button
              onClick={() => handleSendMessage("/help")}
              className="px-2 py-0.5 rounded bg-white dark:bg-[#151026] border border-rule text-text-secondary hover:text-ink hover:bg-white shrink-0"
            >
              /help
            </button>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-[#0B0813] border-t border-rule flex items-center gap-2 shrink-0"
          >
            <Input
              placeholder="Type case ID or question (e.g. AICTE-2026-00001)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 h-9 text-xs border-rule"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="bg-sky-600 hover:bg-sky-700 text-white h-9 px-4 text-xs gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send</span>
            </Button>
          </form>
        </div>

        {/* Right Column: Architecture & Integration Specs (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Bot Card */}
          <div className="bg-white/85 dark:bg-[#0B0813]/85 backdrop-blur-md border border-rule p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-serif text-base font-semibold text-ink flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Official Channel Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface border border-rule space-y-1">
                <div className="text-[11px] text-text-secondary font-medium">Telegram Handle</div>
                <div className="font-mono text-sm font-semibold text-sky-600 dark:text-sky-400 flex items-center justify-between">
                  <span>@aictesih_bot</span>
                  <a
                    href="https://t.me/aictesih_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-sans text-sky-600 flex items-center gap-1 hover:underline"
                  >
                    Open in App <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-rule space-y-1">
                <div className="text-[11px] text-text-secondary font-medium">Zero-Login Lookup Algorithm</div>
                <p className="text-text-secondary leading-relaxed">
                  Regex engine extracts token patterns matching <code className="font-mono text-purple-600">AICTE-\d&#123;4&#125;-[A-Za-z0-9]+</code> from 
                  natural language sentences without forcing strict commands.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-rule space-y-1">
                <div className="text-[11px] text-text-secondary font-medium">PII Confidentiality Shield</div>
                <p className="text-text-secondary leading-relaxed">
                  Student phone numbers, email addresses, and confidential complainant statements are 
                  strictly stripped from bot payloads before dispatch to protect privacy on mobile screens.
                </p>
              </div>
            </div>
          </div>

          {/* Webhook Configuration HUD */}
          <div className="bg-white/85 dark:bg-[#0B0813]/85 backdrop-blur-md border border-rule p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-purple-500" />
                Backend Webhook Endpoint
              </h4>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
                POST Ready
              </Badge>
            </div>

            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] flex items-center justify-between">
              <span className="truncate">/api/v1/telegram/webhook</span>
              <button onClick={copyWebhookUrl} className="text-slate-400 hover:text-white ml-2">
                {copiedWebhook ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-text-secondary leading-relaxed">
              FastAPI async router handles incoming Webhook updates from Telegram MTProto servers and routes status queries in &lt;15ms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
