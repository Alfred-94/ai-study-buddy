import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import WeakTopicTracker from "./WeakTopicTracker";
import {
  Brain, Sparkles, Trophy, Target, Flame, Star, RotateCcw, ChevronDown,
  FileText, HardDrive, AlertTriangle, CheckCircle2, RefreshCw, BarChart3, X, ArrowRight
} from "lucide-react";

export default function SmartQuizzes({setActiveTab}) {
  const { 
    accentColor, 
    materials, 
    awardXp, 
    quizHistory, 
    addQuizRecord, 
    clearQuizHistory,
    leaderboard = [], // Fallback initialization array to safeguard rendering updates
    updateUserLeaderboardScore 
  } = useApp();
  
  // Quiz parameters config states
  const [topic, setTopic] = useState("");
  const [selectedFileId, setSelectedFileId] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState("5");
  const [quizType, setQuizType] = useState("MCQ");

  // Operational State Machines
  const [loading, setLoading] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [error, setError] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [reviewBackup, setReviewBackup] = useState([]);

  // Analytical Matrices (Calculated on-the-fly dynamically from AppContext state logs)
  const [analytics, setAnalytics] = useState({
    totalCount: 0,
    masteredCount: 0,
    averagePercent: 0
  });

  const suggestedTopics = [
    "Photosynthesis",
    "Linear Algebra",
    "Quantum Physics",
    "Organic Chemistry",
    "JavaScript Async Engine",
    "Human Cardio Anatomy",
  ];

  // Dynamically calculate and synchronize historical performance trends safely
  useEffect(() => {
    if (!quizHistory) return;
    const totalCount = quizHistory.length;
    const masteredCount = quizHistory.filter(log => log.pct >= 70).length;
    const averagePercent = totalCount > 0 
      ? Math.round(quizHistory.reduce((acc, log) => acc + (log.pct || 0), 0) / totalCount) 
      : 0;

    setAnalytics({ totalCount, masteredCount, averagePercent });
  }, [quizHistory]);

  const generateQuiz = async (e) => {
    if (e) e.preventDefault();
    
    // Determine context reference source
    let referenceContext = "";
    let finalTopicName = topic.trim();

    if (selectedFileId) {
      const targetedFile = materials?.find(f => f.id === selectedFileId);
      if (targetedFile) {
        finalTopicName = `Document: ${targetedFile.name}`;
        referenceContext = `Base all questions exclusively on the content/context parameters of this resource artifact metadata name: "${targetedFile.name}".`;
      }
    }

    if (!finalTopicName && !selectedFileId) {
      setError("Please input an instructional keyword topic or choose an active repository file resource.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizComplete(false);

    // --- LINE 79 ---
    const promptText = `Generate a ${numQuestions}-question quiz about "${finalTopicName}" at a ${difficulty} difficulty level. Quiz formatting style target configuration parameters: ${quizType}. ${referenceContext} 
    The output must be a single, valid JSON array of objects. Do not wrap the JSON in markdown code blocks. 
    
    CRITICAL STRUCTURE RULES:
    1. If you use any quotes or code snippets inside a question, option, or correctAnswer string, you MUST escape them with a backslash (e.g., \\"like this\\").
    2. Do not include any trailing commas after the last item in arrays or objects.
    3. Output raw JSON only. No chat prefix, no conversational disclaimer suffix, and no markdown wrapping.

    Each object in the array must follow this exact schema: 
    { 
      "question": "The string text of the question?", 
      "options": ["Option A", "Option B", "Option C", "Option D"], 
      "correctAnswer": "The exact matching string text of the correct option from the options array" 
    }`;

    try {
      const response = await fetch('https://sbeqgxubhzijmotxdinh.supabase.co/functions/v1/gemini-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ prompt: promptText })
      });
      if (!response.ok) {
        throw new Error(`Edge Function returned error status code: ${response.status}`);
      }
      
      // --- LINE 99 ---
      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) {
        throw new Error("Empty token response payload returned from AI runtime.");
      }

      // 🛠️ FIX: Robust JSON extraction that locates the boundaries of the true array matrix
      let cleanJsonString = rawText.trim();
      
      const firstBracket = cleanJsonString.indexOf('[');
      const lastBracket = cleanJsonString.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleanJsonString = cleanJsonString.substring(firstBracket, lastBracket + 1);
      } else {
        // Fallback cleanup if brackets aren't standard
        cleanJsonString = cleanJsonString.replace(/`json|```/g, "").trim();
      }

      const parsedQuiz = JSON.parse(cleanJsonString);

      if (Array.isArray(parsedQuiz) && parsedQuiz.length > 0) {
        setQuizQuestions(parsedQuiz);
        setReviewBackup(parsedQuiz); 
      } else {
        throw new Error("Parsed object structure does not conform to standard array matrix criteria.");
      }

    } catch (err) {
      console.error("Secure prompt orchestration error stream:", err);
      setError("Network Error, Please Try Again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (option) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);

    const isCorrect = option === quizQuestions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finalizeAndLogQuizResults();
    }
  };

  const finalizeAndLogQuizResults = () => {
    setQuizComplete(true);
    const totalQ = quizQuestions.length;
    const finalPercentage = Math.round((score / totalQ) * 100);
    const passedMasteryThreshold = finalPercentage >= 70;

    let finalQuizName = topic.trim();
    if (selectedFileId) {
      const targetedFile = materials?.find(f => f.id === selectedFileId);
      if (targetedFile) finalQuizName = `Doc Sprints: ${targetedFile.name}`;
    }

    const formattedDate = new Date().toLocaleDateString('en-US', { 
      month: 'short', day: '2-digit', year: 'numeric' 
    });

    const { quizHistory, addQuizRecord, trackQuizActivity } = useApp();
    
    // 1. Dispatch directly into AppContext unified persistent array vector structures
    addQuizRecord({
      name: finalQuizName || "Dynamic General Evaluation",
      date: formattedDate,
      score: score,
      total: totalQ,
      pct: finalPercentage,
      status: passedMasteryThreshold ? "Completed" : "Needs Review"
    });

    // 2. Award live performance XP rewards into dynamic app context state tracking matrices
  awardXp(100);

  // 3. Update active user score vectors in the Shared Global Leaderboard
  updateUserLeaderboardScore(score * 10, 100);
  
  // 🌟 ADD THIS NEW TRIGGER ON LINE 211:
  trackQuizActivity();
  
} // 👈 This closing brace is on line 212 nows

  // Safe user leaderboard tracking extraction calculations logic
  const derivedUserIndex = leaderboard && Array.isArray(leaderboard) 
    ? leaderboard.findIndex(u => u.isCurrentUser) 
    : -1;
  const leaderboardDisplayRank = derivedUserIndex !== -1 ? `#${derivedUserIndex + 1}` : "N/A";

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Hero Banner Header Container */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-[32px] text-white p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 text-white/5 pointer-events-none">
          <Brain size={240} />
        </div>
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3.5 py-1.5 rounded-full mb-4 text-xs font-bold tracking-wide">
            <Sparkles size={13} className="text-amber-300 fill-amber-300" />
            AI Adaptive Synthesis Core
          </div>
          <h1 className="text-4xl font-black mb-3 tracking-tight">Smart Quiz Matrix</h1>
          <p className="text-violet-100 text-xs md:text-sm leading-relaxed font-medium">
            Generate complex evaluations dynamically from arbitrary topics or query structures loaded straight out of your connected file vaults.
          </p>
        </div>
      </section>
      {/* Analytical Counter Summary Boards Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Evaluations Ran", value: analytics.totalCount, icon: Brain, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
          { title: "Sprints Mastered", value: analytics.masteredCount, icon: Trophy, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
          { title: "Average Score", value: `${analytics.averagePercent}%`, icon: Target, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
          { title: "Leaderboard Rank", value: leaderboardDisplayRank, icon: Star, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20" }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">{item.title}</p>
                  <h3 className="text-xl font-black mt-1 text-gray-900 dark:text-white font-mono tracking-tight">{item.value}</h3>
                </div>
                <div className={`p-2.5 rounded-xl shrink-0 ${item.color}`}>
                  <Icon size={15} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Orchestrator Dashboard Layout Block Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Interactive Control Panel: Generator Form Parameter matrices */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Brain size={16} className="text-violet-600" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Evaluation Config</h3>
          </div>

          <form onSubmit={generateQuiz} className="space-y-4">
            {/* SOURCE ATTACHMENT TYPE TOGGLE SELECTION ENGINE */}
            <div>
              <label className="block mb-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Context Reference File</label>
              <div className="relative">
                <select
                  value={selectedFileId}
                  onChange={(e) => {
                    setSelectedFileId(e.target.value);
                    if (e.target.value) setTopic(""); 
                  }}
                  className="w-full px-3 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50 appearance-none outline-none focus:ring-2 focus:ring-violet-500 font-bold text-slate-700 dark:text-slate-300"
                >
                  <option value="">-- Use Text Topic Prompt Instead --</option>
                  {materials?.map(file => (
                    <option key={file.id} value={file.id}>📄 {file.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {!selectedFileId && (
              <div>
                <label className="block mb-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Custom Topic Keywords</label>
                <input
                  type="text"
                  placeholder="e.g. Krebs Cycle Metabolism"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50 outline-none focus:ring-2 focus:ring-violet-500 font-bold text-slate-700 dark:text-slate-300"
                  disabled={loading}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Difficulty</label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50 appearance-none outline-none text-slate-700 dark:text-slate-300 font-bold"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Length</label>
                <div className="relative">
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(e.target.value)}
                    className="w-full px-3 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50 appearance-none outline-none text-slate-700 dark:text-slate-300 font-bold"
                  >
                    <option value="5">5 Questions</option>
                    <option value="10">10 Questions</option>
                    <option value="15">15 Questions</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">Quiz Type</label>
              <div className="relative">
                <select
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value)}
                  className="w-full px-3 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50 appearance-none outline-none text-slate-700 dark:text-slate-300 font-bold"
                >
                  <option value="MCQ (Multiple Choice Options)">Multiple Choice (MCQ)</option>
                  <option value="True / False Statements Only">True / False Arrays</option>
                  <option value="Conceptual Analytical Questions">Deep Conceptual Checks</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (!topic.trim() && !selectedFileId)}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white py-3 rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Parsing Artifact Text...</span>
                </>
              ) : (
                <span>Generate Quiz</span>
              )}
            </button>
          </form>
          {error && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 p-3 rounded-xl text-[11px] font-semibold flex gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!selectedFileId && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Suggested Vectors</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTopics.map((item) => (
                  <button
                    key={item}
                    onClick={() => setTopic(item)}
                    className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-50 hover:bg-violet-50 text-slate-600 hover:text-violet-700 dark:bg-slate-800/50 dark:text-slate-300 font-bold transition"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Active Workspace: Active Session Interface Container Blocks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. QUIZ RUNNING CONTEXT VIEW PANEL */}
          {quizQuestions.length > 0 && !quizComplete && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-purple-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100 dark:border-slate-800">
                <span className="text-[10px] font-black tracking-wider uppercase bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 px-3 py-1 rounded-lg">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <span className="text-xs font-bold text-gray-400 dark:text-slate-500 font-mono">Current Hits: {score}</span>
              </div>

              <h4 className="text-slate-800 dark:text-slate-100 font-black text-sm md:text-base leading-relaxed mb-5">
                {quizQuestions[currentQuestionIndex].question}
              </h4>

              <div className="grid gap-2.5">
                {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === quizQuestions[currentQuestionIndex].correctAnswer;

                  let choiceStyle = "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-300 text-slate-700 dark:text-slate-300";
                  if (selectedAnswer !== null) {
                    if (isCorrectAnswer) {
                      choiceStyle = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm";
                    } else if (isSelected) {
                      choiceStyle = "bg-rose-50 dark:bg-rose-950/20 border-rose-400 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold shadow-sm";
                    } else {
                      choiceStyle = "border-gray-50 dark:border-slate-800/40 opacity-40 text-gray-400 cursor-not-allowed";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(option)}
                      disabled={selectedAnswer !== null}
                      className={`w-full text-left p-3.5 border text-xs rounded-xl transition-all flex items-center justify-between font-semibold ${choiceStyle}`}
                      >
                      <span>{option}</span>
                      {selectedAnswer !== null && isCorrectAnswer && <span className="text-emerald-600">✅</span>}
                      {selectedAnswer !== null && isSelected && !isCorrectAnswer && <span className="text-rose-600">❌</span>}
                    </button>
                  );
                })}
              </div>
              {selectedAnswer !== null && (
                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={handleNextQuestion}
                    className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
                  >
                    {currentQuestionIndex + 1 === quizQuestions.length ? "Finalize Score" : "Next Segment ➡️"}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* 2. COMPLETION BREAKDOWN ANALYSIS PANELS */}
          {quizComplete && (
            <div className="space-y-6">
              <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 text-center">
                <div className="text-4xl mb-2">
                  {Math.round((score / quizQuestions.length) * 100) >= 70 ? "🎯" : "⚡️"}
                </div>
                <h4 className="text-slate-800 dark:text-white font-black text-lg tracking-tight">
                  {Math.round((score / quizQuestions.length) * 100) >= 70 ? "Mastery Threshold Passed" : "Sprint Complete"}
                </h4>
                <p className="text-gray-400 text-[11px] font-medium mt-0.5 mb-5">Metrics securely submitted to system indexes.</p>

                <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-5">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-gray-100 dark:border-slate-800/60">
                    <span className="block text-lg font-black text-violet-600 font-mono">{score} / {quizQuestions.length}</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400">Accuracy Score</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-gray-100 dark:border-slate-800/60">
                    <span className="block text-lg font-black text-emerald-600 font-mono">+100 XP</span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400">Global Bounty</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setQuizQuestions([]);
                    setReviewBackup([]);
                    setQuizComplete(false);
                    setTopic("");
                    setSelectedFileId("");
                  }}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  Clear Evaluation Matrix
                </button>
              </section>

              {/* Remediation Explanatory Ledger Cards */}
              <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-800">
                  <BarChart3 className="text-violet-600" size={15} />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Itemized Review Grid</h3>
                </div>
                <div className="space-y-3">
                  {/* Update this mapping array below to look like this line */}
                  {(reviewBackup.length > 0 ? reviewBackup : quizQuestions).map((item, index) => (
                    <div key={index} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800/60 text-left">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-2">{index + 1}. {item.question}</p>
                      <div className="p-2.5 text-[11px] rounded-lg border border-emerald-200 bg-emerald-50/30 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-400 font-medium flex justify-between items-center">
                        {/* Update this solution text node fallback below */}
                        <span>Target Node Solution: {item.correctAnswer || item.correct_answer || item.answer}</span>
                        <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* 3. DEFAULT PLACEHOLDER: PAST COMPLETED SESSIONS SUMMARY LOG MATRIX */}
          {quizQuestions.length === 0 &&
           (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800">
              
              {/* --- UPDATED HEADER CONTAINER BLOCK --- */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Historical Evaluation Stream</h3>
                  <span className="text-[10px] font-mono text-gray-400">Live Context Matrix</span>
                </div>
                
                {/* 🗑️ Clear History Interactive Button */}
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to permanently delete all evaluation history records?")) {
                      if (typeof clearQuizHistory === "function") {
                        clearQuizHistory();
                      } else {
                        alert("clearQuizHistory was not passed correctly through context value providers.");
                      }
                    }
                  }}
                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition"
                >
                  Clear History
                </button>

              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-xs text-left">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                      <th className="pb-2">Evaluation Label</th>
                      <th className="pb-2">Date Frame</th>
                      <th className="pb-2">Accuracy Matrix</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  {/* --- LINE 353 --- */}
                  <tbody>
                    {quizHistory && quizHistory.map((quiz, index) => (
                      <tr key={index} className="border-b border-gray-50 dark:border-slate-800/40 last:border-0 font-semibold text-slate-600 dark:text-slate-400">
                        
                        {/* --- LINE 356 --- */}
                        <td className="py-3 font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                          {quiz.name || quiz.title || "Dynamic General Evaluation"}
                        </td>
                        
                        {/* --- LINE 360 --- */}
                        <td className="py-3 text-gray-400 font-medium">{quiz.date}</td>
                        
                        {/* --- LINE 363 --- */}
                        <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                          {(quiz.pct || 0)}% ({(quiz.score || 0)}/{(quiz.total || 0)})
                        </td>
                        
                        {/* --- LINE 367 --- */}
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            quiz.status === "Completed"
                              ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                          }`}>
                            {quiz.status || "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
         </section>
          )}

          <div className="bg-gradient-to-br from-[#F8F5FF] via-white to-[#FAFAFC] dark:from-slate-900 dark:to-slate-900 border border-purple-100 dark:border-purple-900/40 p-5 rounded-[20px] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:shadow-xs duration-300">
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center shrink-0 shadow-3xs">
      <BarChart3 size={18} className="animate-pulse" />
    </div>
    <div className="space-y-0.5">
      <h4 className="text-xs font-black text-[#111827] dark:text-white uppercase tracking-wider flex items-center gap-1">
        <Sparkles size={12} className="text-purple-500" /> AI Insights Enabled
      </h4>
      <p className="text-xs text-slate-700 dark:text-slate-200 font-bold">
       Weak Topic Tracker
      </p>
      <p className="text-[11px] text-slate-400">
        Review specific concept block drops gathered from your historical evaluation stream.
      </p>
    </div>
  </div>

  <button
    onClick={() => {
      if (typeof setActiveTab === "function") {
        setActiveTab("Weak Topic Tracker Page");
      }
    }}
    className="w-full sm:w-auto h-10 px-5 bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-200 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer group shrink-0"
  >
    <span>Open Diagnostics Matrix</span>
    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
  </button>
</div>

        </div>
      </div>
{/* ==================== WEAK TOPIC DIAGNOSTIC MODAL CONTAINER ==================== */}
{showTrackerModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 transition-opacity duration-200 animate-fadeIn">
    
    {/* Modal Frame Window */}
    <div className="bg-[#FAFAFC] dark:bg-slate-950 w-full max-w-5xl h-[85vh] rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative animate-slideUp">
      
      {/* Absolute Close Controls Track Header */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setShowTrackerModal(false)}
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition duration-150 shadow-xs cursor-pointer active:scale-95"
          title="Close Overlay Matrix"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Document Target Insertion Layer */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <WeakTopicTracker />
      </div>

    </div>
  </div>
)}

    </div>
  );
}
                