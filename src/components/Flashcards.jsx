import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { 
  Layers, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  RefreshCcw 
} from "lucide-react";

// Mock deck variations to give your UI immediate utility data layouts
const initialDecks = [
  {
    id: "deck_1",
    title: "Biology: Cellular Respiration",
    count: 5,
    cards: [
      { q: "What is the primary energy currency of the cell?", a: "ATP (Adenosine Triphosphate)" },
      { q: "Where does glycolysis take place within a cell?", a: "In the cytoplasm" },
      { q: "What stage of cellular respiration produces the most ATP?", a: "The Electron Transport Chain (ETC)" },
      { q: "Is fermentation an aerobic or anaerobic process?", a: "Anaerobic (does not require oxygen)" },
      { q: "What are the primary outputs of the Krebs Cycle?", a: "NADH, FADH2, ATP, and Carbon Dioxide (CO2)" }
    ]
  },
  {
    id: "deck_2",
    title: "Web Development: React Framework Hooks",
    count: 4,
    cards: [
      { q: "What hook would you use to perform side effects in a functional component?", a: "useEffect" },
      { q: "What rule must be followed when invoking React Hooks?", a: "They must only be called at the top level of functional components." },
      { q: "What hook returns a stateful value and a function to update it?", a: "useState" },
      { q: "What is the purpose of the useMemo hook?", a: "To memoize computed values and optimize rendering performance." }
    ]
  }
];

export default function Flashcards() {
  const { awardXp } = useApp();
  
  const [decks, setDecks] = useState(initialDecks);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Tracking structural score array stats
  const [knownCards, setKnownCards] = useState([]);
  const [studyingCards, setStudyingCards] = useState([]);
  const [deckFinished, setDeckFinished] = useState(false);

  const startDeck = (deck) => {
    setSelectedDeck(deck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards([]);
    setStudyingCards([]);
    setDeckFinished(false);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < selectedDeck.cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setDeckFinished(true);
        // 🎁 Gamification: Award 75 XP for finishing an entire deck review session
        awardXp(75);
      }
    }, 150);
  };

  const markCardStatus = (status) => {
    if (status === "known") {
      setKnownCards((prev) => [...prev, currentIndex]);
    } else {
      setStudyingCards((prev) => [...prev, currentIndex]);
    }
    handleNext();
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards([]);
    setStudyingCards([]);
    setDeckFinished(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER SECTION BLOCK */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Active Flashcard Decks</h1>
        <p className="text-gray-500 text-lg mt-2 leading-relaxed">
          Flip, review, and organize core conceptual flashcards to supercharge your active memory retrieval pipelines.
        </p>
      </div>

      {!selectedDeck ? (
        /* DECK CHOOSER ROW DISPLAY MODES */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {decks.map((deck) => (
            <motion.div
              key={deck.id}
              whileHover={{ y: -5 }}
              onClick={() => startDeck(deck)}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md cursor-pointer hover:border-violet-200 transition-all flex flex-col justify-between"
              >
              <div>
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 mb-4">
                  <Layers size={22} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 leading-snug">{deck.title}</h3>
                <p className="text-gray-400 text-xs font-semibold mt-1 tracking-wide uppercase">
                  {deck.cards.length} Interactive Cards
                </p>
              </div>
              <button className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-violet-600 text-slate-700 hover:text-white rounded-xl font-bold text-xs transition-colors">
                Practice Deck
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        /* INTERACTIVE DECK VIEWER WORKSPACE FRAME */
        <div className="max-w-2xl mx-auto bg-white rounded-[32px] border border-gray-100 shadow-xl p-6 md:p-8">
          
          {/* Workspace Controls Header */}
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-8">
            <div>
              <button 
                onClick={() => setSelectedDeck(null)}
                className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
              >
                ← Back to Vault
              </button>
              <h2 className="font-bold text-gray-900 mt-1 truncate max-w-sm md:max-w-md">{selectedDeck.title}</h2>
            </div>
            {!deckFinished && (
              <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                {currentIndex + 1} / {selectedDeck.cards.length}
              </span>
            )}
          </div>

          {!deckFinished ? (
            <div className="space-y-8">
              {/* CARD FLIP FLUID COMPONENT CONTROLLER */}
              <div 
                className="w-full h-72 cursor-pointer [perspective:1000px]"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full h-full relative [transform-style:preserve-3d] duration-500"
                >
                  {/* Front Side Card Text Face */}
                  <div className="absolute inset-0 h-full w-full rounded-2xl bg-slate-50 border border-slate-200/60 shadow-inner flex flex-col justify-center items-center p-6 text-center backface-hidden">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Question</p>
                    <p className="text-lg md:text-xl font-semibold text-gray-800 leading-relaxed max-w-md">
                      {selectedDeck.cards[currentIndex].q}
                    </p>
                    <div className="absolute bottom-4 flex items-center gap-1.5 text-xs text-violet-500 font-bold bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
                      <RotateCw size={12} className="animate-spin-slow" /> Click to Flip Card
                    </div>
                  </div>

                  {/* Back Side Card Text Face */}
                  <div className="absolute inset-0 h-full w-full rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-md flex flex-col justify-center items-center p-6 text-center [transform:rotateY(180deg)] backface-hidden text-white">
                    <p className="text-xs font-bold uppercase tracking-widest text-violet-200 mb-3">Answer Key</p>
                    <p className="text-lg md:text-xl font-medium leading-relaxed max-w-md px-2">
                      {selectedDeck.cards[currentIndex].a}
                      </p>
                    <div className="absolute bottom-4 text-xs text-violet-200 font-bold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl">
                      Click to flip back
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* RETRIEVAL RATING BUTTON CONTROLS */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => markCardStatus("study")}
                  className="p-4 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <XCircle size={18} /> Still Learning
                </button>
                <button
                  onClick={() => markCardStatus("known")}
                  className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle2 size={18} /> I Know This!
                </button>
              </div>

              {/* BOTTOM NAVIGATION TRACKBAR STEPPERS */}
              <div className="flex justify-between items-center pt-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => { setCurrentIndex((p) => p - 1); setIsFlipped(false); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 disabled:opacity-30 flex items-center gap-1"
                >
                  <ChevronLeft size={16} /> Previous Card
                </button>
                <button
                  onClick={handleNext}
                  className="text-xs font-bold text-slate-500 hover:text-violet-600 flex items-center gap-1"
                >
                  Skip Card <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* COMPLETION LEDGER DASHBOARD SCREEN STATE */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <Sparkles size={32} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Deck Session Completed!</h3>
                <p className="text-slate-400 text-sm mt-1">Excellent focus session. Here is your memory metrics readout:</p>
              </div>

              {/* PERFORMANCE STATISTICS RINGS SUMMARY STRIPS */}
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
                <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-emerald-700">{knownCards.length}</span>
                  <span className="text-xs font-bold text-emerald-600/80">Mastered Concepts</span>
                </div>
                <div className="bg-rose-50/60 border border-rose-100 p-4 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-rose-700">{studyingCards.length}</span>
                  <span className="text-xs font-bold text-rose-600/80">Needs Review</span>
                </div>
              </div>

              <div className="bg-violet-50 text-violet-700 font-bold text-xs px-4 py-2.5 rounded-xl max-w-xs mx-auto">
                🎁 Gamification Reward: +75 XP claim locked!
              </div>
              {/* DECK ACTIONS FOOTER BUTTON ACTIONS */}
              <div className="flex gap-4 max-w-md mx-auto pt-4">
                <button
                  onClick={resetSession}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={16} /> Re-Practice Deck
                </button>
                <button
                  onClick={() => setSelectedDeck(null)}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-violet-500/10"
                >
                  Done Reviewing
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}