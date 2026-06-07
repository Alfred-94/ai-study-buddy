import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  Brain,
  Sparkles,
  Trophy,
  Target,
  Flame,
  Star,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

export default function SmartQuizzes() {
  const { accentColor } = useApp();
  
  // Quiz parameters config states
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState("5");
  const [quizType, setQuizType] = useState("MCQ");

  // Operational State Machines
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // --- DYNAMIC DATA-DRIVEN BACKEND TRACKING SYSTEM ---
  const [historyLogs, setHistoryLogs] = useState([]);
  const [totalQuizzesCount, setTotalQuizzesCount] = useState(0);
  const [quizzesMasteredCount, setQuizzesMasteredCount] = useState(0);
  const [averageScorePercent, setAverageScorePercent] = useState(0);
  const [streakDays, setStreakDays] = useState(5);
  const [totalXp, setTotalXp] = useState(1450);

  const suggestedTopics = [
    "Photosynthesis",
    "Algebra",
    "Physics",
    "Chemistry",
    "JavaScript",
    "Human Anatomy",
  ];

  // Initialize data structures cleanly from localStorage on mount
  useEffect(() => {
    // 1. Sync global dashboard statistics metrics
    const savedXp = localStorage.getItem("studybuddy_xp") || "1450";
    const savedStreak = localStorage.getItem("studybuddy_streak") || "5";
    const savedMastered = localStorage.getItem("studybuddy_quizzes") || "12";
    
    setTotalXp(parseInt(savedXp, 10));
    setStreakDays(parseInt(savedStreak, 10));
    setQuizzesMasteredCount(parseInt(savedMastered, 10));

    // 2. Initialize default past results array matrix safely if none exists yet
    const fallbackHistory = [
      { name: "Advanced Algebra", date: "Jun 02, 2026", score: 96, total: 5, pct: 96, status: "Completed" },
      { name: "Human Anatomy Basics", date: "May 29, 2026", score: 4, total: 5, pct: 80, status: "Completed" },
      { name: "JavaScript Fundamentals", date: "May 28, 2026", score: 9, total: 10, pct: 90, status: "Completed" },
      { name: "Physics Motion Quiz", date: "May 25, 2026", score: 3, total: 5, pct: 60, status: "Needs Review" },
    ];

    const storedHistory = localStorage.getItem("studybuddy_quiz_history");
    if (storedHistory) {
      const parsed = JSON.parse(storedHistory);
      setHistoryLogs(parsed);
      calculateAnalyticsMatrix(parsed);
    } else {
      localStorage.setItem("studybuddy_quiz_history", JSON.stringify(fallbackHistory));
      setHistoryLogs(fallbackHistory);
      calculateAnalyticsMatrix(fallbackHistory);
    }
  }, []);

  // Calculate high-fidelity mathematical summaries dynamically from active user logs
  const calculateAnalyticsMatrix = (logs) => {
    setTotalQuizzesCount(logs.length);
    if (logs.length === 0) {
      setAverageScorePercent(0);
      return;
    }
    const totalPercentageSum = logs.reduce((acc, log) => acc + (log.pct || 0), 0);
    setAverageScorePercent(Math.round(totalPercentageSum / logs.length));
  };

  const generateQuiz = async (e) => {
    if (e) e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError(null);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizComplete(false);

    const promptText = `Generate a ${numQuestions}-question quiz about "${topic.trim()}" at a ${difficulty} difficulty level. The output must be a single, valid JSON array of objects. Do not wrap the JSON in markdown code blocks.
    Each object in the array must follow this exact schema: { "question": "The string text of the question?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": "The exact matching string text of the correct option from the options array" }`;

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

      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) {
        throw new Error("Empty token response payload returned from the AI framework layer.");
      }

      const cleanJsonString = rawText.replace(/`json|```/g, "").trim();
      const parsedQuiz = JSON.parse(cleanJsonString);

      if (Array.isArray(parsedQuiz) && parsedQuiz.length > 0) {
        setQuizQuestions(parsedQuiz);
      } else {
        throw new Error("Parsed data object does not match the mandatory array layout matrix.");
      }
    } catch (err) {
      console.error("Secure function proxy routing failure:", err);
      setError("The study server experienced an issue generating this specific quiz topic. Please alter your keywords or check your connection parameters and try again.");
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

  // Process completions dynamically into global analytics pipelines
  const finalizeAndLogQuizResults = () => {
    setQuizComplete(true);
    const finalScore = score;
    const totalQ = quizQuestions.length;
    const finalPercentage = Math.round((finalScore / totalQ) * 100);
    const passedMasteryThreshold = finalPercentage >= 70;

    // 1. Compile fresh history object parameters
    const dateOptions = { month: 'short', day: '2-digit', year: 'numeric' };
    const formattedDate = new Date().toLocaleDateString('en-US', dateOptions);
    
    const newQuizRecord = {
      name: topic.trim(),
      date: formattedDate,
      score: finalScore,
      total: totalQ,
      pct: finalPercentage,
      status: passedMasteryThreshold ? "Completed" : "Needs Review"
    };

    const updatedHistory = [newQuizRecord, ...historyLogs];
    setHistoryLogs(updatedHistory);
    localStorage.setItem("studybuddy_quiz_history", JSON.stringify(updatedHistory));
    calculateAnalyticsMatrix(updatedHistory);

    // 2. Award +100 XP base completion bounty points dynamically
    const dynamicNewXp = totalXp + 100;
    setTotalXp(dynamicNewXp);
    localStorage.setItem("studybuddy_xp", dynamicNewXp.toString());

    // 3. Trigger Dashboard Quizzes Mastered counter if user passes thresholds
    if (passedMasteryThreshold) {
      const advancedMasteryCount = quizzesMasteredCount + 1;
      setQuizzesMasteredCount(advancedMasteryCount);
      localStorage.setItem("studybuddy_quizzes", advancedMasteryCount.toString());
    }

    // 4. Inject execution timeline data changes directly into the dashboard chart configuration vectors
    try {const weeklyDataArray = JSON.parse(localStorage.getItem("studybuddy_weekly_progress") || "[]");
      const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const activeDayOfWeek = dayLabels[new Date().getDay()];
      
      const mutatedChartData = weeklyDataArray.map(item => {
        if (item.day === activeDayOfWeek) {
          return { ...item, value: item.value + 40 }; // Adds 40 performance chart visual tracking weight points
        }
        return item;
      });
      localStorage.setItem("studybuddy_weekly_progress", JSON.stringify(mutatedChartData));
    } catch (e) {
      console.error("Chart state vector initialization failure pipeline:", e);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Hero Header Context Banner */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-[32px] text-white p-8 md:p-10 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-5 text-xs font-semibold">
            <Sparkles size={14} />
            AI-Powered Learning
          </div>
          <h1 className="text-4xl font-black mb-4 tracking-tight">Smart Quiz Generator</h1>
          <p className="text-violet-100 text-sm md:text-base leading-relaxed font-medium">
            Generate personalized quizzes instantly from any topic, customize difficulty levels, and track your learning progress with intelligent analytics.
          </p>
        </div>
      </section>

      {/* Quiz Control Input Setup Card */}
      <section className="bg-white dark:bg-slate-900 rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="text-violet-600 dark:text-violet-400" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">Generate New Quiz</h3>
        </div>

        <form onSubmit={generateQuiz} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Topic</label>
              <input
                type="text"
                placeholder="Enter a topic..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/60 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold text-slate-700 dark:text-slate-200"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block mb-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Difficulty</label>
              <div className="relative">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/60 appearance-none focus:ring-2 focus:ring-violet-500 outline-none text-slate-700 dark:text-slate-200 font-bold bg-white"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Number of Questions</label>
              <div className="relative">
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full px-4 py-3.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/60 appearance-none focus:ring-2 focus:ring-violet-500 outline-none text-slate-700 dark:text-slate-200 font-bold bg-white"
                >
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                  <option value="15">15 Questions</option>
                  <option value="20">20 Questions</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Quiz Type</label>
              <div className="relative">
                <select
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value)}
                  className="w-full px-4 py-3.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/60 appearance-none focus:ring-2 focus:ring-violet-500 outline-none text-slate-700 dark:text-slate-200 font-bold bg-white"
                >
                  <option value="MCQ">MCQ (Multiple Choice)</option>
                  <option value="True / False">True / False Only</option>
                  <option value="Mixed">Mixed Compilation</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white px-8 py-3.5 rounded-2xl font-bold text-xs transition shadow-md"
          >
            {loading ? "Synthesizing Matrix..." : "Generate Quiz"}
          </button>
        </form>

        {error && (
          <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}
      </section>

      {/* Interactive Questionnaire Canvas */}
      {quizQuestions.length > 0 && !quizComplete && (
        <section className="bg-white dark:bg-slate-900 rounded-[32px] p-6 md:p-8 shadow-sm border border-violet-100 dark:border-slate-800 scroll-mt-6">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100 dark:border-slate-800">
            <span className="text-[10px] font-black tracking-wider uppercase bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 px-3 py-1.5 rounded-xl">
              Question {currentQuestionIndex + 1} of {quizQuestions.length}
            </span>
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500">Current Score: {score}</span>
          </div>

          <h4 className="text-slate-800 dark:text-slate-100 font-extrabold text-base leading-relaxed mb-6">
            {quizQuestions[currentQuestionIndex].question}
          </h4>

          <div className="grid gap-3">
            {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option === quizQuestions[currentQuestionIndex].correctAnswer;

              let choiceStyle = "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-300 dark:hover:border-violet-700 text-slate-700 dark:text-slate-300";
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
                  className={`w-full text-left p-4 border text-xs rounded-2xl transition-all flex items-center justify-between font-semibold ${choiceStyle}`}
                >
                  <span>{option}</span>
                  {selectedAnswer !== null && isCorrectAnswer && <span className="text-emerald-600">✅</span>}
                  {selectedAnswer !== null && isSelected && !isCorrectAnswer && <span className="text-rose-600">❌</span>}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-sm"
              >
                {currentQuestionIndex + 1 === quizQuestions.length ? "Complete Session" : "Next Question ➡️"}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Completion Score Card Dashboard & Leaderboard Sync */}
{quizComplete && (
  <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
    {/* Core Performance Matrix Card */}
    <section className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-slate-800 text-center">
      <div className="text-5xl mb-4 animate-bounce">
        {Math.round((score / quizQuestions.length) * 100) >= 80 ? "🏆" : "💪"}
      </div>
      
      <h4 className="text-slate-800 dark:text-white font-black text-2xl tracking-tight">
        {Math.round((score / quizQuestions.length) * 100) >= 80 
          ? "Mastery Achieved!" 
          : "Great Effort! Keep Pushing."}
      </h4>
      <p className="text-gray-400 dark:text-slate-400 text-xs font-medium mt-1 mb-6">
        Your diagnostic metrics have been calculated and synced to the global standings.
      </p>

      {/* Analytics Score Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/60">
          <span className="block text-2xl font-black text-violet-600 dark:text-violet-400 font-mono">
            {score} / {quizQuestions.length}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-slate-500">
            Correct Answers
          </span>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/60">
          <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            +100 XP
          </span>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-slate-500">
            Leaderboard Bounty
          </span>
        </div>
      </div>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={() => {
            // Function to push state into global leaderboard array safely
            const currentLeaderboard = JSON.parse(localStorage.getItem("studybuddy_leaderboard") || "[]");
            const updatedLeaderboard = currentLeaderboard.map(user => {
              if (user.isCurrentUser) {
                const calculatedScore = (user.score || 0) + (score * 10);
                return { ...user, score: calculatedScore, xp: (user.xp || 1450) + 100 };
              }
              return user;
            }).sort((a, b) => b.score - a.score);
            
            localStorage.setItem("studybuddy_leaderboard", JSON.stringify(updatedLeaderboard));
            
            // Clear current layout states
            setQuizQuestions([]);
            setQuizComplete(false);
            setTopic("");
          }}
          className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3.5 rounded-2xl text-xs transition-all shadow-sm shadow-violet-600/10"
        >
          Initialize New Session
        </button>
        
        <button
          onClick={() => {
            const reviewSection = document.getElementById("remediation-ledger");
            if (reviewSection) reviewSection.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-3.5 rounded-2xl text-xs transition-all"
        >
          Review Explanations
        </button>
      </div>
    </section>

    {/* Persistent Remediation Ledger */}
    <section id="remediation-ledger" className="bg-white dark:bg-slate-900 rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800 space-y-6 scroll-mt-6">
    <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
        <Brain className="text-violet-600" size={18} />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
          Session Analysis Breakdown
        </h3>
      </div>

      <div className="space-y-4">
        {quizQuestions.map((item, index) => (
          <div key={index} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800/60 text-left">
            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-3">
              {index + 1}. {item.question}
            </h5>
            
            <div className="grid gap-2">
              {item.options.map((opt, oIdx) => {
                const isCorrect = opt === item.correctAnswer;
                let cardStyle = "border-gray-200/60 dark:border-slate-800 text-gray-500 bg-white dark:bg-slate-900";
                
                if (isCorrect) {
                  cardStyle = "border-emerald-400 bg-emerald-50/40 text-emerald-800 dark:text-emerald-400 font-bold";
                }
                
                return (
                  <div key={oIdx} className={`p-3 text-[11px] rounded-xl border flex items-center justify-between ${cardStyle}`}>
                    <span>{opt}</span>
                    {isCorrect && <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Correct Answer</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
)}

      {/* Quick Suggested Recommendations Deck */}
      <section className="bg-white dark:bg-slate-900 rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6">Suggested Topics</h3>
        <div className="flex flex-wrap gap-3">
          {suggestedTopics.map((item) => (
            <button
              key={item}
              onClick={() => setTopic(item)}
              className="px-5 py-2.5 text-xs rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 font-bold transition"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* Dynamic Calculated Analytics Counters Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Quizzes", value: totalQuizzesCount, icon: Brain },
          { title: "Average Score", value: `${averageScorePercent}%`, icon: Target },
          { title: "Current Streak", value: `${streakDays} Days`, icon: Flame },
          { title: "XP Balance", value: totalXp.toLocaleString(), icon: Trophy }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="bg-white dark:bg-slate-900 rounded-[24px] p-5 shadow-sm border border-gray-100 dark:border-slate-800">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">{item.title}</p>
                  <h3 className="text-2xl font-black mt-1 text-gray-900 dark:text-white font-mono tracking-tight">{item.value}</h3>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 shrink-0 text-violet-600 dark:text-violet-400">
                  <Icon size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Live Persistent Results Log Table */}
      <section className="bg-white dark:bg-slate-900 rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Recent Quizzes</h3>
          <span className="text-gray-400 text-xs font-bold font-mono">Live Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-xs text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                <th className="pb-3 font-bold">Quiz Name</th>
                <th className="pb-3 font-bold">Date Indexed</th>
                <th className="pb-3 font-bold">Accuracy Score</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 font-bold text-right">Action Channel</th>
              </tr>
            </thead>
            <tbody>
              {historyLogs.map((quiz, index) => (
                <tr key={index} className="border-b border-gray-50 dark:border-slate-800/50 last:border-0 font-semibold text-slate-700 dark:text-slate-300">
                  <td className="py-4 font-bold text-slate-800 dark:text-white">{quiz.name}</td>
                  <td className="py-4 text-gray-400 dark:text-slate-500 font-medium">{quiz.date}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      {quiz.pct ? `${quiz.pct}%` : `${Math.round((quiz.score / quiz.total) * 100)}%`} ({quiz.score}/{quiz.total})
                    </div>
                  </td>
                  <td className="py-4">
                    <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        quiz.status === "Completed" 
                          ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400" 
                          : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {quiz.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => {
                        setTopic(quiz.name);
                        const element = document.getElementById("main");
                        if (element) element.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950 font-bold transition"
                    >
                      <RotateCcw size={12} />
                      Retake
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}