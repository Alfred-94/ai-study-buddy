import React, { useState, useMemo } from "react";
import { 
  ArrowLeft, RotateCcw, CheckCircle2, AlertTriangle, 
  FileText, Video, BrainCircuit, Layers, Sparkles, Lightbulb, 
  ChevronRight, ArrowRight, BookOpen, Calendar, ShieldCheck,
  Check, Play
} from "lucide-react";

export default function WeakTopicTracker({ 
  topicsData, 
  onUpdateTopic, 
  setActiveTab, 
  userMetrics = { quizAverage: 0, flashcardPerformance: 0, studyCompletionRate: 0, practiceExercises: 0 },
  materialsData = [],
  onUpdateMetrics,
  onUpdateTopics,
  onAddToPlanner 
}) {
  // Now all your states and return statement belong to this function

  // 1. State for the AI loading button and the generated plan
  const [isGenerating, setIsGenerating] = useState(false);
  const [recoveryPlan, setRecoveryPlan] = useState(null);

  // 2. The function to handle the AI generation
  const handleGenerateRecoveryPlan = async (topicName) => {
    setIsGenerating(true);
    
    try {
      console.log(`Sending ${topicName} to AI for analysis...`);
      
      // Simulating a 2-second delay for the AI response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data representing the AI's response
      const mockAiResponse = {
        topic: topicName,
        plan: "Review Supabase RLS policies for 20 minutes, then attempt 5 practice queries."
      };
      
      setRecoveryPlan(mockAiResponse);
      
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Local reactive states for interactive functionality
  const [recommendationTab, setRecommendationTab] = useState("All Recommendations");
  const [activeRecoveryTopic, setActiveRecoveryTopic] = useState(null);
  const [aiNotesSummaries, setAiNotesSummaries] = useState({}); 
  const [videoProgressState, setVideoProgressState] = useState({}); 
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [completedQuizIds, setCompletedQuizIds] = useState({});
  const [flashcardScores, setFlashcardScores] = useState({}); 

  // Dynamic calculation metrics
  const overallMasteryIndex = useMemo(() => {
    const wQuiz = (userMetrics.quizAverage || 0) * 0.50;
    const wFlash = (userMetrics.flashcardPerformance || 0) * 0.20;
    const wStudy = (userMetrics.studyCompletionRate || 0) * 0.20;
    const wPractice = (userMetrics.practiceExercises || 0) * 0.10;
    return Math.round(wQuiz + wFlash + wStudy + wPractice);
  }, [userMetrics]);

  <button onClick={() => onUpdateTopic(topic.id, { 
    quiz_score: 95, 
    repeated_failures: false 
})}>
    Mark as Mastered
</button>

  const strongTopicsList = useMemo(() => {
    return topicsData
      .filter(topic => (topic.quizScore || 0) > 75 && (topic.practiceCount || 0) >= 2)
      .sort((a, b) => b.quizScore - a.quizScore);
  }, [topicsData]);

  const weakTopicsList = useMemo(() => {
    return topicsData
      .filter(topic => (topic.quizScore || 0) <= 65 || topic.repeatedFailures)
      .sort((a, b) => a.quizScore - b.quizScore);
  }, [topicsData]);

  const criticalFocusTopic = useMemo(() => {
    return weakTopicsList[0] || topicsData.sort((a,b) => a.quizScore - b.quizScore)[0] || { name: "General Topics", quizScore: 0 };
  }, [weakTopicsList, topicsData]);

  const automatedRecommendations = useMemo(() => {
    const weakNames = weakTopicsList.map(w => w.name.toLowerCase());
    let targetedPool = materialsData.filter(material => 
      weakNames.length === 0 ? true : weakNames.includes(material.topic?.toLowerCase())
    );

    if (recommendationTab !== "All Recommendations") {
      targetedPool = targetedPool.filter(item => item.type?.toLowerCase() === recommendationTab.toLowerCase());
    }
    return targetedPool;
  }, [materialsData, weakTopicsList, recommendationTab]);

  

  const handleTriggerAiSummary = (resourceId, topicName) => {
    setAiNotesSummaries(prev => ({
      ...prev,
      [resourceId]: `🤖 AI Summary for ${topicName}: Key conceptual patterns discovered. Focus on biochemical cycles, regulatory loops, and transition step kinetics.`
    }));
    if (onUpdateMetrics) {
      onUpdateMetrics({ ...userMetrics, studyCompletionRate: Math.min((userMetrics.studyCompletionRate || 0) + 2, 100) });
    }
  };

  const handleSimulateWatchVideo = (resourceId) => {
    setVideoProgressState(prev => ({ ...prev, [resourceId]: 100 }));
    if (onUpdateMetrics) {
      onUpdateMetrics({
        ...userMetrics,
        studyCompletionRate: Math.min((userMetrics.studyCompletionRate || 0) + 8, 100)
      });
    }
  };

  const handleCompleteTargetedQuiz = (id, topicName) => {
    setActiveQuizId(null);
    setCompletedQuizIds(prev => ({ ...prev, [id]: true }));
    if (onUpdateTopics) {
      const updatedTopics = topicsData.map(t => {
        if (t.name.toLowerCase() === topicName.toLowerCase()) {
          const newScore = Math.min((t.quizScore || 0) + 20, 100); 
          return { ...t, quizScore: newScore, practiceCount: (t.practiceCount || 0) + 1, repeatedFailures: newScore < 65 };
        }
        return t;
      });
      onUpdateTopics(updatedTopics);
    }

    if (onUpdateMetrics) {
      onUpdateMetrics({
        ...userMetrics,
        quizAverage: Math.min((userMetrics.quizAverage || 0) + 3, 100),
        practiceExercises: Math.min((userMetrics.practiceExercises || 0) + 12, 100)
      });
    }
  };

  const handleUpdateCardStat = (resourceId, bucket) => {
    setFlashcardScores(prev => {
      const current = prev[resourceId] || { mastered: 0, learning: 10, difficult: 5 };
      if (bucket === "mastered" && current.learning > 0) {
        return { ...prev, [resourceId]: { ...current, learning: current.learning - 1, mastered: current.mastered + 1 } };
      }
      return prev;
    });
    if (onUpdateMetrics) {
      onUpdateMetrics({ ...userMetrics, flashcardPerformance: Math.min((userMetrics.flashcardPerformance || 0) + 2, 100) });
    }
  };

  const handleExecuteFullSystemRetake = () => {
    if (onUpdateTopics) {
      const savedTopics = topicsData.map(t => ({
        ...t,
        quizScore: Math.max(t.quizScore || 0, 78),
        practiceCount: (t.practiceCount || 0) + 1,
        repeatedFailures: false
      }));
      onUpdateTopics(savedTopics);
    }
    if (onUpdateMetrics) {
      onUpdateMetrics({
        quizAverage: Math.max(userMetrics.quizAverage || 0, 80),
        flashcardPerformance: Math.max(userMetrics.flashcardPerformance || 0, 85),
        studyCompletionRate: Math.max(userMetrics.studyCompletionRate || 0, 90),
        practiceExercises: Math.max(userMetrics.practiceExercises || 0, 85)
      });
    }
    setActiveRecoveryTopic(null);
  };

  return (
    <div className="w-full space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Top Header Return Context Controller */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab("Smart Quizzes")}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-purple-600 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> <span>Back to Smart Quizzes</span>
        </button>
      </div>

      {/* 1. Overall Mastery Summary Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Metrics Monitor</div>
          <h2 className="text-xl font-extrabold">Current Exam Readiness Index</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5">
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center">
              <div className="text-[10px] font-bold text-slate-400">Quiz (50%)</div>
              <div className="text-xs font-black">{userMetrics.quizAverage || 0}%</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center">
              <div className="text-[10px] font-bold text-slate-400">Cards (20%)</div>
              <div className="text-xs font-black">{userMetrics.flashcardPerformance || 0}%</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center">
              <div className="text-[10px] font-bold text-slate-400">Completion (20%)</div>
              <div className="text-xs font-black">{userMetrics.studyCompletionRate || 0}%</div>
              </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center">
              <div className="text-[10px] font-bold text-slate-400">Practice (10%)</div>
              <div className="text-xs font-black">{userMetrics.practiceExercises || 0}%</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 px-6 py-4 rounded-[20px] shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Readiness</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400">{overallMasteryIndex}%</span>
          </div>
        </div>
      </section>

      {/* 2 & 3. Strong vs Weak Topic Matrices */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
              <CheckCircle2 className="text-emerald-500" size={18} />
              <h3 className="text-sm font-black">Strong Topics</h3>
            </div>
            <div className="mt-4 space-y-3">
              {strongTopicsList.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{item.name}</span>
                    <span className="text-emerald-500">{item.quizScore}%</span>
                  </div>
                </div>
              ))}
              {strongTopicsList.length === 0 && <p className="text-xs italic text-slate-400 py-2">No strong topics tracked yet.</p>}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
              <AlertTriangle className="text-orange-500" size={18} />
              <h3 className="text-sm font-black">Needs Improvement</h3>
            </div>

{/* Render the AI plan once it exists */}
      {recoveryPlan && (
        <div className="mt-4 p-4 border rounded bg-purple-50 text-left">
          <h4 className="font-bold text-purple-700 mb-2">Your Custom AI Study Plan</h4>
          <p className="text-sm text-gray-700">{recoveryPlan.plan}</p>
        </div>
      )}

            <div className="mt-4 space-y-3">
              {weakTopicsList.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{item.name}</span>
                    <span className="text-orange-500">{item.quizScore}%</span>
                  </div>
                </div>
              ))}
              {weakTopicsList.length === 0 && <p className="text-xs italic text-emerald-500 py-2">All areas cleared above baseline targets!</p>}
            </div>
          </div>
          <div className="mt-6">
            <button 
  onClick={() => handleGenerateRecoveryPlan("Live Supabase Test")}
  disabled={isGenerating}
  className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50 mt-4 w-full"
>
  {isGenerating ? "Generating Plan..." : 'Generate Recovery Plan for "Live Supabase Test"'}
</button>
          </div>
        </div>
      </section>

      {/* Recovery Roadmap Timeline Section */}
      {activeRecoveryTopic && (
        <section className="bg-slate-900 text-white p-5 rounded-[24px] space-y-3">
          <h4 className="text-xs font-black tracking-wider uppercase text-orange-400">Active Recovery Schedule: {activeRecoveryTopic}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800 p-2.5 rounded-xl">Day 1: Read Notes</div>
            <div className="bg-slate-800 p-2.5 rounded-xl">Day 2: Watch Video</div>
            <div className="bg-slate-800 p-2.5 rounded-xl">Day 3: Cards Track</div>
            <div className="bg-slate-800 p-2.5 rounded-xl">Day 4: Retake Quiz</div>
          </div>
        </section>
      )}

      {/* 5. Recommended Adaptive Study Resources Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[24px] space-y-4">
        <h3 className="text-sm font-black flex items-center gap-1.5"><Sparkles size={15} className="text-purple-500"/> AI Adaptive Recommendations</h3>
        <div className="flex gap-4 border-b dark:border-slate-800 text-xs font-bold pb-2">
          {["All Recommendations", "Notes", "Videos", "Quizzes", "Flashcards"].map(t => (
            <button key={t} onClick={() => setRecommendationTab(t)} className={`pb-1 cursor-pointer ${recommendationTab === t ? "text-purple-500 border-b-2 border-purple-500" : "text-slate-400"}`}>
              {t}</button>
          ))}
        </div>

        <div className="space-y-3">
          {automatedRecommendations.map((rec) => (
            <div key={rec.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 block">{rec.title}</span>
                  <span className="text-[10px] text-slate-400">{rec.metadata} • Topic: {rec.topic}</span>
                </div>
                
                {rec.type?.toLowerCase() === "notes" && (
                  <button onClick={() => handleTriggerAiSummary(rec.id, rec.topic)} className="bg-white dark:bg-slate-700 border border-purple-200 px-2.5 py-1 rounded-lg text-purple-600 font-bold cursor-pointer">Summarize</button>
                )}
                {rec.type?.toLowerCase() === "videos" && (
                  <button onClick={() => handleSimulateWatchVideo(rec.id)} className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer">Watch</button>
                )}
                {rec.type?.toLowerCase() === "quizzes" && !completedQuizIds[rec.id] && (
                  <button onClick={() => setActiveQuizId(rec.id)} className="bg-purple-600 text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer">Launch</button>
                )}
                {rec.type?.toLowerCase() === "flashcards" && (
                  <button onClick={() => handleUpdateCardStat(rec.id, "mastered")} className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer">Mark Mastered</button>
                )}
              </div>
              
              {aiNotesSummaries[rec.id] && <p className="mt-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded border text-purple-900 dark:text-purple-300 text-[11px]">{aiNotesSummaries[rec.id]}</p>}
              {activeQuizId === rec.id && (
                <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-purple-300 rounded-xl space-y-2">
                  <p className="italic text-slate-600 dark:text-slate-400">"Targeting core concepts: Identify the main velocity decay limiter under standard metabolic respiratory states."</p>
                  <button onClick={() => handleCompleteTargetedQuiz(rec.id, rec.topic)} className="w-full py-1 bg-emerald-600 text-white font-bold rounded cursor-pointer">Submit and Sync Parameters</button>
                </div>
              )}
            </div>
          ))}
          {automatedRecommendations.length === 0 && (
            <p className="text-xs italic text-slate-400 text-center py-4">No recommendations matching this section at the moment.</p>
          )}
        </div>
      </section>
      {/* 10 & 11. Custom System Insights and Master Matrix Retake */}
      <footer className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/70 p-5 rounded-[24px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 block">System Suggestion</span>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {weakTopicsList.length > 0 ? `Focus next session entirely on "${criticalFocusTopic.name}".` : "All areas look solid! Maintain your active study streaks."}
          </p>
        </div>
        <button onClick={handleExecuteFullSystemRetake} className="px-4 h-10 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0 cursor-pointer">
          <RotateCcw size={13}/> Retake Weak Quiz Matrix
        </button>
      </footer>
    </div>
  );
}