import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import "./styles.css";

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      role: "assistant",
      content:
        "👋Assalamualaikum! Hello Student, I am your Teacher. You can type or ask your question by speaking..",
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lang, setLang] = useState("ur-PK"); // default Urdu for TTS/ASR if available
  const messagesRef = useRef(null);
  const recognitionRef = useRef(null);

  // Scroll to bottom on messages change
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = lang === "ur-PK" ? "ur-PK" : "en-US";
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognitionRef.current.onend = () => {
      setListening(false);
    };
    recognitionRef.current.onerror = (e) => {
      console.error("SpeechRecognition error", e);
      setListening(false);
      alert("Voice recognition error. Try again or use text input.");
    };
  }, [lang]);

  // Toggle voice recording
  const handleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    if (!listening) {
      setListening(true);
      recognitionRef.current.start();
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  // Send message to backend
  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg = {
      id: Date.now() + Math.random(),
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      // Call your backend (adjust URL/port if needed)
      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      // Expect backend to return: { reply: "..." } or { message: "..." }
      const replyText =
        data.reply ??
        data.message ??
        "Something went wrong, please try again..";

      const botMsg = {
        id: Date.now() + Math.random(),
        role: "assistant",
        content: replyText,
        time: new Date().toLocaleTimeString(),
      };

      setMessages((m) => [...m, botMsg]);
      speak(replyText); // TTS
    } catch (err) {
      console.error("API error:", err);
      const errMsg = {
        id: Date.now() + Math.random(),
        role: "assistant",
        content:
          "No response from the server. Please check your internet connection or try again..",
        time: new Date().toLocaleTimeString(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setTyping(false);
    }
  };

  // Press Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Text-to-speech
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    // prefer Urdu voice if selected else english
    utter.lang = lang === "ur-PK" ? "ur-PK" : "en-US";
    // Optionally pick a voice that matches language
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((vx) => vx.lang.startsWith(utter.lang.split("-")[0]));
    if (v) utter.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content:
          "👋Assalamualaikum! Hello Student, I am your Teacher. You can type or ask your question by speaking..",
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  return (
    <>
      <div className="layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="brand">
            <div className="logo">👨‍🎓</div>
            <div>
              <div className="brand-title">AI Teacher</div>
              <div className="brand-sub">AI Chatbot</div>
            </div>
          </div>

          <nav className="menu">
            <button className="menu-item" onClick={() => clearChat()}>
              🧾 New Chat
            </button>
            <button
              className="menu-item"
              onClick={() =>
                Swal.fire({
                  title: "⚠️ Medical Disclaimer",
                  html: `
      <p>
        This AI Teacher Chatbot is designed for educational assistance and general guidance.
        It should <b>not</b> be used as a substitute for a qualified teacher or medical expert.
      </p>
      <p>
        For accurate information or diagnosis, please consult a professional.
      </p>
    `,
                  icon: "warning",
                  confirmButtonText: "I Understand",
                })
              }
            >
              ⚠️ Disclaimer
            </button>
            <button
              className="menu-item"
              onClick={() =>
                Swal.fire({
                  title: "ℹ️ About AI Teacher Chatbot",
                  html: `
        <p>
        <b>AI Teacher Chatbot</b> is an interactive educational assistant that helps students
        learn using natural conversation — either by typing or speaking.
      </p>
      <p>
        Developed using <b>React.js</b>, <b>Node.js</b>, and <b>Speech APIs</b>,
        this system can understand Urdu, English, and Sindhi.
      </p>
      <p style="font-size:13px;color:gray;">
        Created by <b>Farman Hyder</b> <b>Shahzad Ashraf</b> <b>Shaiza Ghulam Hussain</b> — Full Stack / MERN Developer.
      </p>
    `,
                  icon: "info",
                  confirmButtonText: "Close",
                })
              }
            >
              ℹ️ About
            </button>
          </nav>

          <div className="sidebar-bottom">
            <label className="lang-label">Voice / Text Language</label>
            <select
              value={lang}
              onChange={(e) => {
                setLang(e.target.value);
                // re-init recognition language if available
                if (recognitionRef.current)
                  recognitionRef.current.lang = e.target.value;
              }}
            >
              <option value="ur-PK">Urdu (Pakistan)</option>
              <option value="en-US">English</option>
              <option value="sd-PK">Sindhi (if supported)</option>
            </select>

            <div className="small-note">
              Voice: Web Speech API (browser support varies)
            </div>
            <button
              className="theme-toggle"
              onClick={() => {
                document.body.classList.toggle("dark");
              }}
            >
              🌙 / ☀️ Toggle Theme
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="main">
          <header className="topbar">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <div className="top-title">Parsanal Teacher Chatbot</div>
          </header>

          <section className="chat-panel">
            <div className="messages" ref={messagesRef}>
              {messages.map((m) => (
                <div key={m.id} className={`msg ${m.role}`}>
                  <div className="msg-content">{m.content}</div>
                  <div className="msg-time">{m.time}</div>
                </div>
              ))}

              {typing && (
                <div className="msg assistant">
                  <div className="msg-content typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              )}
            </div>

            <div className="composer">
              <textarea
                className="input"
                placeholder="Type your question... (Press Enter to send)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="controls">
                <button
                  className={`mic ${listening ? "listening" : ""}`}
                  onClick={handleVoice}
                  title="Voice input"
                >
                  {listening ? "🔴 Recording" : "🎤"}
                </button>
                <button className="send" onClick={sendMessage} title="Send">
                  ➤ Send
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
