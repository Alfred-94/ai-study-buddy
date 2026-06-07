import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  Trophy, 
  Flame, 
  Zap, 
  Search, 
  Crown, 
  Medal, 
  ArrowUp, 
  User,
  Sparkles,
  Award
} from "lucide-react";

export default function Leaderboard() {
  const { accentColor } = useApp();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All-Time");

  useEffect(() => {
    // Read the primary global user metrics
    const activeUserXp = parseInt(localStorage.getItem("studybuddy_xp") || "1450", 10);
    const activeUserStreak = parseInt(localStorage.getItem("studybuddy_streak") || "5", 10);

    // Initial pool of peer contestants
    const fallbackStandings = [
      { id: "u1", name: "Sofia Rodriguez", xp: 2850, streak: 24, avatar: "SR", isCurrentUser: false },
      { id: "u2", name: "Ethan Chen", xp: 2100, streak: 14, avatar: "EC", isCurrentUser: false },
      { id: "u3", name: "Alex Morgan", xp: 1950, streak: 19, avatar: "AM", isCurrentUser: false },
      { id: "current_user", name: "You (Study Buddy)", xp: activeUserXp, streak: activeUserStreak, avatar: "ME", isCurrentUser: true },
      { id: "u4", name: "Liam Dubois", xp: 1280, streak: 3, avatar: "LD", isCurrentUser: false },
      { id: "u5", name: "Emma Watson", xp: 950, streak: 8, avatar: "EW", isCurrentUser: false },
    ];

    const storedStandings = localStorage.getItem("studybuddy_leaderboard");
    
    if (storedStandings) {
      try {
        const parsed = JSON.parse(storedStandings);
        
        // Ensure your row element stays absolutely synchronized with active dashboard states
        const updatedStandings = parsed.map(player => {
          if (player.isCurrentUser) {
            return { ...player, xp: activeUserXp, streak: activeUserStreak };
          }
          return player;
        });

        // Sort data based on XP in descending order
        const sortedData = updatedStandings.sort((a, b) => b.xp - a.xp);
        setLeaderboardData(sortedData);
        localStorage.setItem("studybuddy_leaderboard", JSON.stringify(sortedData));
      } catch (err) {
        console.error("Leaderboard context buffer exception:", err);
      }
    } else {
      const sortedFallback = fallbackStandings.sort((a, b) => b.xp - a.xp);
      setLeaderboardData(sortedFallback);
      localStorage.setItem("studybuddy_leaderboard", JSON.stringify(sortedFallback));
    }
  }, []);

  // Filter out profiles dynamically via user search query strings
  const filteredLeaderboard = leaderboardData.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Extract Top 3 podium items cleanly
  const podiumWinners = leaderboardData.slice(0, 3);

  // Helper styles to render placement tiers
  const getRankBadge = (index) => {
    if (index === 0) return <Crown className="text-amber-500 fill-amber-400 w-5 h-5 animate-pulse" />;
    if (index === 1) return <Medal className="text-slate-400 fill-slate-300 w-5 h-5" />;
    if (index === 2) return <Medal className="text-amber-700 fill-amber-600 w-5 h-5" />;
    return <span className="font-mono font-bold text-xs text-gray-400 dark:text-slate-500 w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Title Header Matching App Branding */}
      <div className="border-b border-gray-200/50 dark:border-slate-800/60 pb-6">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          Global Standings <Trophy className="text-amber-500 dark:text-amber-400 w-8 h-8" />
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
          Compete with fellow scholars globally. Complete focus timers and master quizzes to claim the crown.
        </p>
      </div>{/* Podium Top 3 Grid Display */}
      {podiumWinners.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
          
          {/* Rank 2 Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-6 text-center shadow-sm relative order-2 md:order-1 md:h-[220px] flex flex-col justify-center items-center">
            <div className="absolute top-4 left-4 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase">
              Rank 2
            </div>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 text-sm border-2 border-slate-300 mb-3 shadow-inner">
              {podiumWinners[1].avatar}
            </div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white truncate max-w-[160px]">{podiumWinners[1].name}</h3>
            <div className="text-xs font-mono font-black text-purple-600 dark:text-purple-400 mt-1">{podiumWinners[1].xp.toLocaleString()} XP</div>
          </div>

          {/* Rank 1 Card (The Apex Winner) */}
          <div className="bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-400/60 rounded-[32px] p-8 text-center shadow-md relative order-1 md:order-2 md:h-[260px] flex flex-col justify-center items-center overflow-hidden">
            <div className="absolute -right-4 -top-4 text-amber-500/10 pointer-events-none">
              <Crown size={120} />
            </div>
            <div className="absolute top-4 bg-amber-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Crown size={10} fill="currentColor" /> Leader
            </div>
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg border-2 border-amber-300 mb-3 shadow-md shadow-amber-500/10 mt-2">
              {podiumWinners[0].avatar}
            </div>
            <h3 className="font-black text-base text-slate-800 dark:text-white truncate max-w-[180px]">{podiumWinners[0].name}</h3>
            <div className="text-sm font-mono font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
              <Zap size={14} className="fill-amber-500 text-amber-500" />
              {podiumWinners[0].xp.toLocaleString()} XP
            </div>
          </div>

          {/* Rank 3 Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-6 text-center shadow-sm relative order-3 md:h-[200px] flex flex-col justify-center items-center">
            <div className="absolute top-4 left-4 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-1 rounded-full text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase">
              Rank 3
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center font-black text-amber-700 dark:text-amber-500 text-sm border-2 border-amber-600/40 mb-3 shadow-inner">
              {podiumWinners[2].avatar}
            </div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white truncate max-w-[160px]">{podiumWinners[2].name}</h3>
            <div className="text-xs font-mono font-black text-purple-600 dark:text-purple-400 mt-1">{podiumWinners[2].xp.toLocaleString()} XP</div>
          </div>

        </div>
      )}

      {/* Input Filtering & Scope Control Header Strip */}
      <section className="bg-white dark:bg-slate-900 rounded-[28px] p-4 shadow-sm border border-gray-100 dark:border-slate-800/80 flex flex-col md:flex-row items-center gap-4 justify-between">
      {/* Search Bar Element */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search classmate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-xs bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500 font-bold transition text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Sorting Window Filter Toggles */}
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/40 w-full md:w-auto">
          {["Weekly Focus", "All-Time"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-[11px] font-black tracking-wide rounded-lg transition-all w-full md:w-auto ${
                activeFilter === filter
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-slate-300"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

      </section>

      {/* Main Leaderboard Rankings Ledger Container */}
      <section className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-xs text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-gray-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                <th className="pb-3 pl-4 w-20">Rank</th>
                <th className="pb-3">Scholar Student</th>
                <th className="pb-3">Weekly Streak</th>
                <th className="pb-3 text-right pr-4">Total Experience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/60 dark:divide-slate-800/40">
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400 font-bold">
                    No matching competitors found.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((user, index) => {
                  const truePlacementIndex = leaderboardData.findIndex(item => item.id === user.id);
                  
                  return (
                    <tr 
                      key={user.id} 
                      className={`transition-all font-semibold text-slate-700 dark:text-slate-300 ${
                        user.isCurrentUser 
                          ? "bg-violet-50/50 dark:bg-purple-950/20 border-l-4 border-l-purple-600" 
                          : "hover:bg-slate-50/40 dark:hover:bg-slate-800/20"
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="py-4 pl-4 font-bold">
                        <div className="flex items-center">
                          {getRankBadge(truePlacementIndex)}
                        </div>
                      </td>

                      {/* Profile Metadata */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner shrink-0 ${user.isCurrentUser 
                              ? "bg-purple-600 text-white" 
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}>
                            {user.avatar}
                          </div>
                          <div>
                            <span className={`font-bold block text-sm ${user.isCurrentUser ? "text-purple-700 dark:text-purple-400 font-black" : "text-slate-800 dark:text-slate-200"}`}>
                              {user.name}
                            </span>
                            {user.isCurrentUser && (
                              <span className="text-[9px] bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                Active Profile
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Streak Counters */}
                      <td className="py-4 font-mono">
                        <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold">
                          <Flame size={14} className="text-orange-500 fill-orange-500" />
                          <span>{user.streak} Days</span>
                        </div>
                      </td>

                      {/* XP Values */}
                      <td className="py-4 text-right pr-4 font-mono font-black text-slate-900 dark:text-white text-sm">
                        <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/40 px-3 py-1 rounded-xl border border-gray-100 dark:border-slate-800">
                          <Award size={13} className="text-purple-500" />
                          <span>{user.xp.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}