import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { motion } from "framer-motion";
import MaterialManager from "./MaterialManager"; 
import { useApp } from "../context/AppContext";
import {
  Brain,
  FileText,
  BarChart3,
  Sparkles,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Send,
  MessageSquare,
  Plus,
  Mic,
  MicOff,
  Paperclip,
  X,
  FileUp
} from "lucide-react";

const quickActions = [
  { title: "Explain Concept", desc: "Get detailed explanations for any topic.", icon: Brain, color: "from-violet-500 to-purple-600" },
  { title: "Generate Quiz", desc: "Create quizzes from any topic instantly.", icon: Sparkles, color: "from-purple-500 to-fuchsia-500" },
  { title: "Summarize Notes", desc: "Convert long notes into concise summaries.", icon: FileText, color: "from-pink-500 to-rose-500" },
  { title: "Study Tips", desc: "Receive personalized learning advice.", icon: Lightbulb, color: "from-amber-400 to-orange-500" },
  { title: "Create Flashcards", desc: "Generate flashcards automatically.", icon: BookOpen, color: "from-green-500 to-emerald-500" },
  { title: "Homework Help", desc: "Get guided solutions and explanations.", icon: GraduationCap, color: "from-blue-500 to-indigo-500" },
];

export default function AiCoach() {
  const { activePreview, setActivePreview, awardXp, setMaterials } = useApp();

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // Non-hardcoded Local Upload/Insert states
  const [insertedFile, setInsertedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Voice Recognition states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Dynamic Insights State
  const [dynamicInsights, setDynamicInsights] = useState([
    { title: "Study Recommendation", text: "Ready to study. Link a file or select an action above to start.", icon: Sparkles },
    { title: "Weak Topics Identified", text: "No weak topics logged yet. Complete quizzes to populate analytics.", icon: BarChart3 },
    { title: "Personalized Learning Plan", text: "Unlock custom schedules by interacting with your AI Coach.", icon: BookOpen },
  ]);

  // Flashcards state
  const [generatedCards, setGeneratedCards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Primary messages stream setup
  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: "Hello Scholar! 👋 I am your dedicated AI Study Coach. Select a quick action card above, click 'Link to Coach' on your vault documents on the right, upload/insert a file, or dictate a prompt via microphone!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Local Storage Session sync
  const [sessions, setSessions] = useState(() => {
    const stored = localStorage.getItem("studybuddy_chat_sessions");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return [
      { id: "sess_default_1", title: "Welcome Orientation", subtitle: "General Study Q&A", time: "Just Now", messages: [] }
    ];
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setInputMessage((prev) => (prev ? prev + " " + transcript : transcript));
      };
      rec.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Voice recording toggle engine
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported on your current browser engine layout. Try Google Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle local composer file injection (Insertion)
  const handleFileInsertion = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Build functional dynamic mock URL for simulation preview mapping
    const filePayload = {
      id: `inserted_${Date.now()}`,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      url: URL.createObjectURL(file), 
      type: file.type
    };

    setInsertedFile(filePayload);
    
    // Automatically inject into Vault state array asynchronously so it registers globally
    if (setMaterials) {
      setMaterials((prev) => [filePayload, ...prev]);
    }
  };

  const getMimeType = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    const mimeMap = { 'pdf': 'application/pdf', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'txt': 'text/plain' };
    return mimeMap[ext] || 'application/octet-stream';
  };

  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    if (session.messages && session.messages.length > 0) {
      setMessages(session.messages);
    } else {
      setMessages([
        { type: "ai", text: `Switched to session: **${session.title}**. Let's continue!`, time: session.time }
      ]);
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setGeneratedCards([]);
    setInsertedFile(null);
    setMessages([
      {
        type: "ai",
        text: "Started a fresh workspace session timeline! Link a note or insert a file layout.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = async (e, customPrompt = null) => {
    if (e) e.preventDefault();
    
    const targetPrompt = customPrompt || inputMessage;
    if (!targetPrompt.trim() && !insertedFile && loading) return;

    // Use either composer inserted file context or general right-sidebar linked activePreview context
    const functionalContext = insertedFile || activePreview;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userDisplayPayload = functionalContext?.name 
      ? `📎 *[Context Document: \`${functionalContext.name}\`]*\n\n${targetPrompt.trim()}`
      : targetPrompt.trim();

    const updatedUserMessages = [...messages, { type: "user", text: userDisplayPayload, time: currentTime }];
    setMessages(updatedUserMessages);
    
    // Reset inputs immediately
    if (!customPrompt) setInputMessage("");
    setInsertedFile(null); 
    setLoading(true);

    try {
      const response = await fetch('https://sbeqgxubhzijmotxdinh.supabase.co/functions/v1/gemini-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          prompt: targetPrompt.trim() || "Analyze this inserted file layout material details.",
          fileUrl: functionalContext ? functionalContext.url : null,
          mimeType: functionalContext ? getMimeType(functionalContext.name) : null
        })
      });
      if (!response.ok) throw new Error(`Server status returned: ${response.status}`);
      
      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Empty interpretation generated.";
      const finalMessageHistory = [...updatedUserMessages, { type: "ai", text: replyText, time: currentTime }];

      setMessages(finalMessageHistory);
      awardXp(15);

      // Session Memory Sync
      let sessionId = currentSessionId;
      let updatedSessions = [...sessions];

      if (!sessionId) {
        sessionId = `session_${Date.now()}`;
        setCurrentSessionId(sessionId);
        const newSessionNode = {
          id: sessionId,
          title: targetPrompt ? targetPrompt.substring(0, 22).trim() + "..." : "File Analysis Session",
          subtitle: functionalContext ? `Analyzed ${functionalContext.name}` : "General Study Q&A",
          time: currentTime,
          messages: finalMessageHistory
        };
        updatedSessions = [newSessionNode, ...updatedSessions.filter(s => s.id !== "sess_default_1")];
      } else {
        updatedSessions = updatedSessions.map(s => s.id === sessionId ? { ...s, messages: finalMessageHistory } : s);
      }

      setSessions(updatedSessions);
      localStorage.setItem("studybuddy_chat_sessions", JSON.stringify(updatedSessions));

    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { type: "ai", text: `⚠️ **System Error:** ${err.message || "Failed to query server."}`, time: currentTime }]);
    } finally {
      setLoading(false);
    }
  };

  const executeQuickAction = (actionTitle) => {
    let macroPrompt = "";
    const activeContext = insertedFile || activePreview;
    const contextDoc = activeContext?.name ?  `inside the connected document "${activeContext.name}"` : "";

    if (actionTitle === "Create Flashcards") {
      setGeneratedCards([
        { q: `What is the primary theme discussed in this context session?`, a: "The core foundational headings and structured formulas." },
        { q: "How should you study this layout?", a: "By running active recall cycles matching these coach flashcards." }
      ]);
      setActiveCardIndex(0);
      setIsCardFlipped(false);
      return;
    }

    switch(actionTitle) {
      case "Explain Concept": macroPrompt = `Provide a comprehensive academic breakdown step-by-step${contextDoc}.`; break;
      case "Generate Quiz": macroPrompt = `Generate an interactive multiple choice quiz covering vital concepts found${contextDoc}.`; break;
      case "Summarize Notes": macroPrompt = `Transform key parameters and items${contextDoc} into a clear bulleted summary.`; break;
      case "Study Tips": macroPrompt = `Draft a tactical learning roadmap spacing technique targeting information${contextDoc || " of my active subjects"}.`; break;
      case "Homework Help": macroPrompt = `Act as an expert tutor. Solve, clarify, and guide me through practice problems${contextDoc}.`; break;
      default: macroPrompt = `Deep conceptual analysis for: ${actionTitle}`;
    }
    handleSendMessage(null, macroPrompt);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & Quick Actions Grid Viewport */}
      <div className="grid xl:grid-cols-[1fr_300px] gap-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">AI Study Coach Channels</h1>
          <p className="text-gray-500 text-lg mt-2 leading-relaxed">
            Your learning companion is loaded with voice dictation and instant drag-and-drop file processing features.
          </p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
            {quickActions.map((item) => (
              <motion.div
                key={item.title}
                whileHover={{ y: -4 }}onClick={() => executeQuickAction(item.title)}
                className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-md p-5 cursor-pointer hover:border-purple-200 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white shadow-sm`}>
                  <item.icon size={20} />
                </div>
                <h3 className="font-bold text-base mt-4 text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="hidden xl:flex items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center shadow-inner">
            <Brain className="w-20 h-20 text-violet-600 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Core Resizable Chat Workspace Card Panel */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-6 flex flex-col justify-between overflow-hidden resize-y min-h-[580px]"
          style={{ height: "660px" }}
        >
          <div className="flex flex-wrap gap-3 justify-between items-center border-b border-gray-100 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">Workspace Coach Engine</h2>
              <button onClick={startNewSession} className="p-1.5 bg-slate-50 hover:bg-violet-50 text-slate-500 hover:text-violet-600 border border-slate-100 rounded-lg 
              transition-all flex items-center gap-1 text-xs font-bold">
                <Plus className="w-3.5 h-3.5" /> Fresh Chat
              </button>
            </div>
            {activePreview?.name && !insertedFile && (
              <div className="bg-violet-50 border border-violet-200 text-violet-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
                <span>🔗 Vault Linked: {activePreview.name}</span>
                <button onClick={() => setActivePreview(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
              </div>
            )}
          </div>

          {/* Messages Main Field Frame Stream */}
          <div className="flex-1 space-y-6 mt-6 overflow-y-auto pr-2 bg-slate-50/30 rounded-2xl p-4">
            {/* Flashcards Viewport Anchor */}
            {generatedCards.length > 0 && (
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-2xl border border-violet-100 my-2 space-y-4 shadow-inner">
                <div className="flex justify-between items-center text-xs text-violet-700 font-bold uppercase tracking-wider">
                  <span>✨ AI Generated Practice Cards</span>
                  <span>{activeCardIndex + 1} / {generatedCards.length}</span>
                </div>
                <div className="w-full h-32 cursor-pointer [perspective:1000px]" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                  <div className={`w-full h-full relative transition-transform duration-500 [transform-style:preserve-3d] ${isCardFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                    <div className="absolute inset-0 w-full h-full bg-white rounded-xl border border-slate-100 flex flex-col justify-center items-center p-4 text-center [backface-visibility:hidden]">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Question</span>
                      <p className="text-sm font-semibold text-gray-800">{generatedCards[activeCardIndex]?.q}</p>
                    </div>
                    <div className="absolute inset-0 w-full h-full bg-violet-600 text-white rounded-xl flex flex-col justify-center items-center p-4 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-violet-200 mb-1">Answer</span>
                      <p className="text-sm font-medium">{generatedCards[activeCardIndex]?.a}</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <button type="button" disabled={activeCardIndex === 0} onClick={(e) => { e.stopPropagation(); setActiveCardIndex(p => p - 1); setIsCardFlipped(false); }} className="text-xs font-bold text-slate-500 disabled:opacity-30">← Prev</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setGeneratedCards([]); }} className="text-xs font-bold text-red-500 hover:underline">Clear Deck</button>
                  <button type="button" disabled={activeCardIndex === generatedCards.length - 1} onClick={(e) => { e.stopPropagation(); setActiveCardIndex(p => p + 1); setIsCardFlipped(false); }} className="text-xs font-bold text-slate-500 disabled:opacity-30">Next →</button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={msg.type === "user" ? "max-w-xl" : "flex gap-3 max-w-2xl"}>
                  {msg.type !== "user" && <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">🤖</div>}
                  <div>
                    <div className={`rounded-3xl px-5 py-3 text-sm shadow-sm ${msg.type === "user" ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-tr-md font-medium whitespace-pre-wrap" : "bg-white border border-gray-100 rounded-tl-md prose prose-sm text-slate-700"}`}>
                      {msg.type === "user" ? msg.text : <Markdown>{msg.text}</Markdown>}
                    </div>
                    <p className={`text-[10px] text-gray-400 mt-1 ${msg.type === "user" ? "text-right" : ""}`}>{msg.time}</p>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4 items-center pl-1 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shadow-sm">🤖</div>
                <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => <motion.div key={i} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} className="w-2 h-2 rounded-full bg-violet-500" />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ACTIVE COMPOSER WRAPPER WITH VOICE & DYNAMIC FILE INSERT CAPABILITIES */}
          <div className="mt-4 space-y-2 flex-shrink-0">
            {/* Real-time file upload banner indicator block */}
            {insertedFile && (
              <div className="flex items-center justify-between bg-slate-100 rounded-xl px-4 py-2 border border-slate-200 animate-fade-in text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2 truncate">
                  <FileUp className="w-4 h-4 text-violet-600 flex-shrink-0" /><span className="truncate">Inserted Context: {insertedFile.name} ({insertedFile.size})</span>
                </div>
                <button type="button" onClick={() => setInsertedFile(null)} className="p-1 hover:bg-slate-200 rounded-md text-red-500">
                  <X size={14} />
                </button>
              </div>
            )}

            <form 
              onSubmit={handleSendMessage} 
              className={`border rounded-2xl p-2 flex items-start gap-2 bg-white shadow-sm transition-all ${isListening ? "border-red-500 ring-2 ring-red-100" : "border-gray-200 focus-within:border-violet-500"}`}
            >
              {/* Invisible file input trigger */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInsertion} 
                className="hidden" 
              />

              {/* Action Button 1: Insert Local File Material */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-slate-50 transition-colors mt-0.5"
                title="Insert file reference onto prompt context"
              >
                <Paperclip size={18} />
              </button>

              {/* Core Text Input Node Area */}
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder={isListening ? "Listening... Speak clearly to dictate note strings." : "Ask a study question or upload a document asset..."}
                className="flex-1 outline-none p-2 text-sm bg-transparent placeholder-gray-400 resize-y min-h-[44px] max-h-[140px] font-sans leading-relaxed"
                disabled={loading}
                rows={1}
              />

              {/* Action Button 2: Audio Voice Dictation Toggler */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all mt-0.5 ${isListening ? "bg-red-50 text-red-500 animate-pulse" : "text-slate-400 hover:text-purple-600 hover:bg-slate-50"}`}
                title={isListening ? "Stop Audio Dictation Stream" : "Dictate Prompt via Voice Input"}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Submit Message Execution Anchor */}
              <button 
                type="submit" 
                disabled={loading || (!inputMessage.trim() && !insertedFile)} 
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 flex items-center justify-center text-white disabled:opacity-30 self-end mb-1"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </motion.div>

        {/* Side Panel Sections Wrapper */}
        <div className="space-y-6">
          <MaterialManager />

          {/* AI Insights Matrix */}
          <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-gray-900 tracking-tight">AI Insights</h3>
              <button onClick={() => alert("Insight vectors are updated dynamically based on file inputs.")} className="text-violet-600 font-bold text-xs hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {dynamicInsights.map((item) => (
                <div key={item.title} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3.5 items-start">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 flex-shrink-0 shadow-sm"><item.icon size={16} /></div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed font-medium">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Workspace Sessions Channels */}
          <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-gray-900 tracking-tight">Recent Sessions</h3>
              <button onClick={() => alert("Recent historical profiles are active and fully persistent.")} className="text-violet-600 font-bold text-xs hover:underline">View All</button>
            </div>
            <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
              {sessions.map((chat) => (
                <div 
                  key={chat.id} 
                  onClick={() => handleSelectSession(chat)}
                  className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all border group ${currentSessionId === chat.id ? "bg-violet-50 border-violet-200" : "bg-white border-transparent hover:bg-slate-50"}`}
                >
                  <div className="flex gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${currentSessionId === chat.id ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600"}`}>
                      <MessageSquare size={14} />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`font-bold text-xs text-gray-900 truncate 
                        group-hover:text-violet-600 transition-colors ${currentSessionId === chat.id ? "text-violet-700" : ""}`}>{chat.title}</h4>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{chat.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold tracking-wide whitespace-nowrap ml-2">{chat.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}