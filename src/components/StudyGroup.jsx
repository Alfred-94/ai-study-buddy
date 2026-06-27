import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Users2, Send, Shield, Copy, Check, Trash2, Save } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useEffect } from "react";

export default function StudyGroup() {
  const { 
    awardXp, 
    studyGroups = [], 
    joinRoom, 
    createNewStudyRoom,
    deleteStudyRoom,
    fetchStudyGroups,
    currentRoomCode,
    currentUserEmail,
    currentUserUserName,
    groupMessages,
    broadcastGroupMessage,
    timerSeconds,
    isTimerRunning,
    controlRoomTimer,
    activePeers
  } = useApp();

  // ⏱️ Formats countdown string cleanly
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const chatBottomRef =useRef(null);

  const [newRoomName, setNewRoomName] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // 🟢 AUTOMATIC STICKY SCROLL CONTROLLER
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]); // Fires instantly every single time a new message drops into the array

  // Identify the metadata profile of the room the client is currently inside of
  const activeRoom = studyGroups.find(r => r.code === currentRoomCode);

  // Evaluate whether the logged-in client matches the host_email row in the database
  const isRoomCreator = currentUserEmail && activeRoom?.host_email && 
    currentUserEmail.toLowerCase().trim() === activeRoom.host_email.toLowerCase().trim();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const generatedCode = await createNewStudyRoom(newRoomName.trim());
    if (generatedCode) {
      setNewRoomName("");
      if (joinRoom) await joinRoom(generatedCode);
      if (awardXp) awardXp(25);
    }
  };

  const handleSendGroupMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    broadcastGroupMessage(chatInput.trim());
    setChatInput("");
  };

  const copyRoomCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight dark:text-white">Collaborative Study Hub</h1>
        <p className="text-gray-500 dark:text-slate-400 text-lg mt-2 leading-relaxed">
          Create shared virtual workspaces to drill flashcards, debate notes, and build team learning milestones.
        </p>
      </div>

      {/* --- DASHBOARD VIEW LAYER (NOT CONNECTED TO A SESSION) --- */}
      {!currentRoomCode ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start w-full">
          
          {/* Active Rooms Listing Display Dashboard */}
<div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-gray-100 dark:border-slate-800 p-6 space-y-6">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
    <Users2 className="text-violet-600" /> Available Workspaces ({studyGroups.length})
  </h2>

  <div className="grid md:grid-cols-2 gap-4">
    {studyGroups.map((room) => {
      const isRoomCreator = currentUserEmail && room.host_email && 
        currentUserEmail.toLowerCase().trim() === room.host_email.toLowerCase().trim();
        
      // Dynamic active vs saved verification parameter flag
      const isLiveNow = room.room_status === 'live';

      return (
        <div
          key={room.id}
          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group relative ${
            isLiveNow 
              ? "border-red-100 bg-gradient-to-br from-red-50/20 to-white dark:from-slate-950/20 dark:border-red-950/30" 
              : "border-slate-100 bg-slate-50/50 dark:bg-slate-950/40 dark:border-slate-800"
          }`}
        >
          {/* Main Card Content */}
          <div onClick={async () => { if (joinRoom) await joinRoom(room.code); }} className="cursor-pointer flex-1">
            <div className="flex justify-between items-start">
              <span className="bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">
                Code: {room.code}
              </span>
              
              {/* Dynamic Status Pill */}
              {isLiveNow ? (
                <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-0.5 font-bold rounded-full flex items-center gap-1 animate-pulse">
                  ● Live Class
                </span>
              ) : (
                <span className="text-[10px] bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 font-medium rounded-full">
                  📁 Saved Room
                </span>
              )}
            </div>

            <h3 className="font-bold text-base text-gray-900 dark:text-white mt-3">{room.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Shield size={12} className="text-slate-400" /> Host: {room.host_email?.split('@')[0] || "Student"}
            </p>
          </div>

          {/* Action Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span onClick={async () => { if (joinRoom) await joinRoom(room.code); }} className="flex items-center gap-1 font-medium text-violet-600 dark:text-violet-400 cursor-pointer">
              <Users size={14} /> Open Workspace Panel
            </span>
            
            <span className="font-semibold text-slate-400 group-hover:text-violet-600 cursor-pointer">Enter →</span>
          </div>
        </div>
      );
    })}
    
    {studyGroups.length === 0 && (
      <p className="text-slate-400 dark:text-slate-500 text-xs italic p-4 col-span-2 text-center">
        No active workspaces deployed yet. Deploy a class on the right to start!
      </p>
    )}
  </div>
</div>

          {/* Controls Sidebar Container */}
          <div className="space-y-6">
            {/* Join Room Form Deck */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-xl border border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight flex items-center gap-2 mb-3">
                <span>→ Join via Invite Code</span>
              </h3>
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  placeholder="e.g. MATH-772" 
                  id="inviteCodeInput"
                  className="w-full text-sm outline-none border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-950 rounded-xl px-4 py-2.5 uppercase text-slate-800 dark:text-slate-200 focus:border-violet-500 transition-colors"
                />
                <button 
                  onClick={async () => {
                    const el = document.getElementById('inviteCodeInput');
                    const code = el.value.trim().toUpperCase();
                    if (code && joinRoom) {
                      const success = await joinRoom(code);
                      if (success) el.value = "";
                    }
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold rounded-xl text-xs hover:opacity-90 shadow-sm transition-opacity"
                >
                  Enter Active Workspace
                </button>
              </div>
            </div>

            {/* Create Group Form Deck */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-gray-100 dark:border-slate-800 p-6">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white tracking-tight flex items-center gap-2 mb-4">
                <Plus className="text-violet-600" size={18} /> Spawn New Team Room
              </h3>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Group Title / Subject Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Physics Midterm Study Group"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full text-sm outline-none border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-950 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-200 focus:border-violet-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold rounded-xl text-xs hover:opacity-90 shadow-sm transition-opacity"
                >
                  Create Room & Generate Invite Link
                </button>
              </form>
            </div>
          </div>

        </div>
      ) : (
        
        /* --- REAL-TIME ACTIVE LIVE ROOM INTERFACE --- */
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start w-full">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-gray-100 dark:border-slate-800 p-6 flex flex-col justify-between" style={{ height: "600px" }}>
            
            {/* Active Multiplayer Header Frame */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeRoom?.name || "Shared Workspace"}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Channel Code: <strong className="text-purple-600 dark:text-purple-400">{currentRoomCode}</strong></span>
                  <button 
                    onClick={() => copyRoomCode(currentRoomCode)} 
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-violet-600 transition-colors flex items-center gap-0.5 text-[10px] font-bold"
                  >
                    {copiedCode ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} {copiedCode ? "Copied" : "Copy Code"}
                  </button>
                </div>
              </div>

              {/* 🛠️ AUTHORIZED CONTROLS: DYNAMIC SAVE / DELETE ACTIONS */}
              <div className="flex items-center gap-2">
                {isRoomCreator ? (
                  <>
                    {/* Save & Leave (Retains Room Row in Database for Later Sessions) */}
                    <button 
                      onClick={async () => {
                        if (joinRoom) await joinRoom(null);
                        if (fetchStudyGroups) fetchStudyGroups();
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-100 dark:border-emerald-900/40 transition-colors flex items-center gap-1"
                      title="Saves history and returns to lobby"
                    >
                      <Save size={14} /> Save & Leave
                    </button>

                    {/* Delete Permanently (Wipes completely from cloud and runs cascade rule) */}
                    <button 
                      onClick={async () => {
                        if (confirm(`⚠️ Permantly drop "${activeRoom?.name}"? This closes the room and wipes all history.`)) {
                          const wiped = await deleteStudyRoom(currentRoomCode);
                          if (wiped && joinRoom) await joinRoom(null);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 text-red-500 font-bold text-xs rounded-xl border border-red-100 dark:border-red-900/40 transition-colors flex items-center gap-1"
                      >
                      <Trash2 size={14} /> Delete Room
                    </button>
                  </>
                ) : (
                  /* Standard member disconnect button */
                  <button 
                    onClick={async () => { if (joinRoom) await joinRoom(null); }}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-red-50 text-slate-500 hover:text-red-500 font-bold text-xs rounded-xl border border-slate-100 dark:border-slate-800 transition-colors"
                  >
                    Leave Workspace
                  </button>
                )}
              </div>
            </div>

            {/* Chat Stream Panel Frame */}
            <div className="flex-1 overflow-y-auto space-y-4 my-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl">
              {groupMessages.map((msg, idx) => {
                const isMe = msg.sender?.toLowerCase().trim() === currentUserUserName?.toLowerCase().trim();
                
                return msg.type === "system" ? (
                  <div key={idx} className="text-center text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50/70 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 py-1.5 px-3 rounded-lg">
                    {msg.text}
                  </div>
                ) : (
                  <div key={msg.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-md">
                      <p className={`text-[10px] font-bold mb-0.5 ${isMe ? "text-right text-purple-600 dark:text-purple-400" : "text-slate-500"}`}>{msg.sender}</p>
                      <div className={`px-4 py-2.5 rounded-2xl text-xs shadow-sm ${isMe ? "bg-violet-600 text-white rounded-tr-none" : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none"}`}>
                        {msg.text}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 text-right">{msg.time}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Prompt Composer Message Footer Form */}
            <form onSubmit={handleSendGroupMessage} className="border border-slate-200 dark:border-slate-800 focus-within:border-violet-500 rounded-xl p-1.5 flex gap-2 bg-white dark:bg-slate-950 transition-colors">
              <input 
                type="text"
                placeholder="Message your study group peers..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 outline-none px-3 py-1.5 text-xs bg-transparent text-slate-800 dark:text-slate-200"
              />
              <button type="submit" className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                <Send size={14} />
              </button>
            </form>
          </div>

          {/* Sidebar Area: Timer & Active Peer Roster */}
          <div className="space-y-6">

            {/* SYNCHRONIZED POMODORO TIMER PANEL */}
            <div className="bg-gradient-to-br from-slate-900 to-violet-950 text-white rounded-[24px] p-5 shadow-lg border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h4 className="font-bold text-[10px] uppercase tracking-wider text-violet-300">Room Focus Sync</h4>
                  <span className="text-[9px] text-slate-400 font-semibold">
                    {isRoomCreator ? "👑 Room Owner Authority" : "🔒 Timer Locked View Only"}
                  </span>
                  </div>
                <span className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
              </div>
              
              <div className="text-center py-1">
                <span className="text-4xl font-black font-mono tracking-tight text-white drop-shadow">
                  {formatTime(timerSeconds)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => controlRoomTimer(isTimerRunning ? "PAUSE" : "START", timerSeconds)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    !isRoomCreator 
                      ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                      : isTimerRunning 
                        ? "bg-amber-500 hover:bg-amber-600 text-white" 
                        : "bg-violet-600 hover:bg-violet-500 text-white"
                  }`}
                >
                  {isTimerRunning ? "Pause" : "Start Focus"}
                </button>
                <button
                  onClick={() => controlRoomTimer("RESET", 1500)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    !isRoomCreator
                      ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  }`}
                >
                  Reset (25m)
                </button>
              </div>
            </div>

            {/* DYNAMIC REAL-TIME ONLINE ROSTER */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Active Session Peers ({activePeers.length})
              </h4>
              
              <div className="space-y-2.5">
                {activePeers.map((peer) => (
                  <div key={peer.presenceId} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs uppercase ${
                      peer.avatarColor === "emerald" ? "bg-emerald-600" : "bg-purple-600"
                    }`}>
                      {peer.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs">
                      <h5 className="font-bold text-slate-900 dark:text-white">
                        {peer.name} {peer.name?.toLowerCase().trim() === currentUserUserName?.toLowerCase().trim() ? "(You)" : ""}
                      </h5>
                      <p className="text-[10px] text-green-500 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Connected
                      </p>
                    </div>
                  </div>
                ))}

                {activePeers.length === 0 && (
                  <p className="text-center text-[11px] text-gray-400 py-2 italic">Syncing active peers...</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div> 
  );
}