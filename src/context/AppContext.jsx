import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../supabaseClient";

const AppContext = createContext();

export function AppProvider({ children }) {
  // 🛠 Room and Active User Tracking State Layouts
  const [currentRoomCode, setCurrentRoomCode] = useState(null);
  const [currentRoomHostEmail, setCurrentRoomHostEmail] = useState(null);
  
  // 🌟 Secure Authentication State Connections
  const [currentUserId, setCurrentUserId] = useState(null); 
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserUserName, setCurrentUserUserName] = useState("");
  const [currentUserAvatar, setCurrentUserAvatar] = useState(""); 
  const [studyGroups, setStudyGroups] = useState([]);
  const [activePeers, setActivePeers] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // 🏆 Gamification profiles (Initialized to defaults, synced via Cloud Sync Engine)
  const [xp, setXp] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [quizzesMastered, setQuizzesMastered] = useState(0);
  const [studyDays, setStudyDays] = useState(1);
  
 //  With this persistent storage line:
const [materials, setMaterials] = useState([]);
  
  const [timerSeconds, setTimerSeconds] = useState(1500); 
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const addNotification = (text) => {
    setNotifications((prev) => [
      { id: Date.now(), text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) },
      ...prev
    ]);
  };

  const timerStateRef = useRef({ timerSeconds: 1500, isTimerRunning: false });
  useEffect(() => {
    timerStateRef.current = { timerSeconds, isTimerRunning };
  }, [timerSeconds, isTimerRunning]);

  // 👤 AUTH SYNC ENGINE: Listens to explicit sessions transitions instantly
  useEffect(() => {
    const getProfileData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setCurrentUserEmail(user.email || "");
        const metaName = user.user_metadata?.username || user.user_metadata?.full_name;
        const emailFallback = user.email ? user.email.split("@")[0] : "User";
        setCurrentUserUserName(metaName || emailFallback);
        setCurrentUserAvatar(user.user_metadata?.avatar_url || ""); 
      }
    };
    getProfileData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        setCurrentUserEmail(session.user.email || "");
        const metaName = session.user.user_metadata?.username || session.user.user_metadata?.full_name;
        const emailFallback = session.user.email ? session.user.email.split("@")[0] : "User";
        setCurrentUserUserName(metaName || emailFallback);
        setCurrentUserAvatar(session.user.user_metadata?.avatar_url || "");
      } else {
        setCurrentUserId(null);
        setCurrentUserEmail("");
        setCurrentUserUserName("");
        setCurrentUserAvatar("");
        setMaterials([]); // Clear materials upon sign out
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ☁️ CLOUD SYNC ENGINE - PART A: FETCH DATA ON LOGIN (XP, Streaks, and Files)
  useEffect(() => {
    const fetchAllCloudUserData = async () => {
      if (!currentUserId) return;
      
      // 1. Pull user profile parameters from user_metrics
      const { data: metricsData } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (metricsData) {
        if (metricsData.xp !== undefined) setXp(metricsData.xp);
        if (metricsData.streak !== undefined) setStreakCount(metricsData.streak);
      }
       // 2. Pull user materials from study_materials database mapping table securely
      const { data: materialsData, error: materialsErr } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', currentUserId);

      if (!materialsErr && materialsData) {
  console.log('Materials from DB:', materialsData);
  setMaterials(materialsData);
    }
    };

    fetchAllCloudUserData();
  }, [currentUserId]);

  // ☁️ CLOUD SYNC ENGINE - PART B: DISPATCH GAMIFICATION SCORE DATA TO BACKEND
  useEffect(() => {
    const syncGamificationToCloud = async () => {
      if (!currentUserId) return;

      await supabase
        .from('user_metrics')
        .upsert({ 
          user_id: currentUserId,
          xp: xp,
          streak: streakCount 
        }, { onConflict: 'user_id' });
    };

    syncGamificationToCloud();
  }, [xp, streakCount, currentUserId]);


  // 📁 Sync local study rooms registry tracking parameters from cloud engine
  const fetchGlobalRoomsList = async () => {
    const { data, error } = await supabase.from("study_group").select("*");
    if (!error && data) setStudyGroups(data);
  };

  useEffect(() => { fetchGlobalRoomsList(); }, [currentRoomCode]);

  // 📡 MASTER REAL-TIME DATASTREAM PIPELINE CONTAINER
  useEffect(() => {
    if (!currentRoomCode) return;

    const fetchChatHistory = async () => {
      const { data, error } = await supabase
        .from("study_group_messages")
        .select("*")
        .eq("room_code", currentRoomCode)
        .order("created_at", { ascending: true });
        if (!error && data) {
        setGroupMessages(data.map(msg => ({
          id: msg.id, sender: msg.sender, text: msg.text,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })));
      }
    };

    fetchChatHistory();

    const studyRoomChannel = supabase.channel(`room_channel_${currentRoomCode}`, {
      config: { broadcast: { self: false }, presence: { key: currentRoomCode } },
    });

    studyRoomChannel
      .on("broadcast", { event: "sync_timer" }, ({ payload }) => {
        if (payload.action === "START") { setIsTimerRunning(true); setTimerSeconds(payload.seconds); }
        else if (payload.action === "PAUSE") { setIsTimerRunning(false); }
        else if (payload.action === "RESET") { setIsTimerRunning(false); setTimerSeconds(payload.seconds); }
      })
      .on("broadcast", { event: "request_timer_state" }, () => {
        const isCurrentHost = currentUserEmail && currentRoomHostEmail && 
          currentUserEmail.toLowerCase().trim() === currentRoomHostEmail.toLowerCase().trim();
        if (isCurrentHost) {
          studyRoomChannel.send({
            type: "broadcast", event: "respond_timer_state",
            payload: { seconds: timerStateRef.current.timerSeconds, running: timerStateRef.current.isTimerRunning }
          });
        }
      })
      .on("broadcast", { event: "respond_timer_state" }, ({ payload }) => {
        setTimerSeconds(payload.seconds); setIsTimerRunning(payload.running);
      })
      .on("presence", { event: "sync" }, () => {
        const state = studyRoomChannel.presenceState();
        const flattenedPeers = Object.values(state).flatMap((presencePresences) => 
          presencePresences.map((p) => ({
            presenceId: p.presence_ref, name: p.username || "Anonymous Peer", avatarColor: p.color || "violet"
          }))
        );
        setActivePeers(flattenedPeers);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "study_group_messages" }, (payload) => {
          const newRow = payload.new;
          if (newRow && String(newRow.room_code).trim() === String(currentRoomCode).trim()) {
            const formattedIncoming = {
              id: newRow.id, sender: newRow.sender, text: newRow.text,
             time: new Date(newRow.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setGroupMessages((prev) => {
              if (prev.some(m => m.id === formattedIncoming.id)) return prev;
              return [...prev, formattedIncoming];
            });
          }
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setTimeout(() => { studyRoomChannel.send({ type: "broadcast", event: "request_timer_state", payload: {} }); }, 600);
          const randomColor = Math.random() > 0.5 ? "emerald" : "violet";
          await studyRoomChannel.track({ username: currentUserUserName, color: randomColor });
        }
      });

    return () => { supabase.removeChannel(studyRoomChannel); };
  }, [currentRoomCode, currentUserUserName, currentRoomHostEmail, currentUserEmail]);
  
  const broadcastGroupMessage = async (msgText) => {
    if (!currentRoomCode) return;
    const { error } = await supabase.from("study_group_messages").insert([{ room_code: currentRoomCode, sender: currentUserUserName, text: msgText.trim() }]);
    if (error) console.error("Error logging message into database:", error.message);
  };

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        const isCurrentHost = currentUserEmail && currentRoomHostEmail && 
          currentUserEmail.toLowerCase().trim() === currentRoomHostEmail.toLowerCase().trim();
        setTimerSeconds((prev) => {
          const nextSecond = prev - 1;
          if (isCurrentHost && nextSecond % 3 === 0 && currentRoomCode) {
            supabase.channel(`room_channel_${currentRoomCode}`).send({
              type: "broadcast", event: "sync_timer", payload: { action: "START", seconds: nextSecond }
            });
          }
          return nextSecond;
        });
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentRoomCode, currentUserEmail, currentRoomHostEmail]);

  const controlRoomTimer = async (action, explicitSeconds = 1500) => {
    if (!currentRoomCode) return;
    const isCurrentHost = currentUserEmail && currentRoomHostEmail && currentUserEmail.toLowerCase().trim() === currentRoomHostEmail.toLowerCase().trim();
    if (!isCurrentHost) { alert("❌ Access Denied: Only host can control timer!"); return; }

    let targetedSeconds = timerSeconds;
    if (action === "RESET" || action === "START") targetedSeconds = explicitSeconds;

    if (action === "START") setIsTimerRunning(true);
    if (action === "PAUSE") setIsTimerRunning(false);
    if (action === "RESET") { setIsTimerRunning(false); setTimerSeconds(explicitSeconds); }

    await supabase.channel(`room_channel_${currentRoomCode}`).send({
      type: "broadcast", event: "sync_timer", payload: { action, seconds: targetedSeconds }
    });
  };

  const deleteStudyRoom = async (roomCode) => {
    if (!roomCode) return false;
    try {
      const { error } = await supabase.from('study_group').delete().eq('code', roomCode);
      if (error) return false;
      setCurrentRoomCode(null);
      setGroupMessages([]);
      await fetchGlobalRoomsList();
      return true;
    } catch (err) { return false; }
  };

  const joinRoom = async (roomIdentifier) => {
    if (!roomIdentifier || roomIdentifier.trim() === "") {
      if (currentRoomCode) await supabase.from('study_group').update({ room_status: 'saved' }).eq('code', currentRoomCode);
      setCurrentRoomCode(null); setGroupMessages([]); await fetchGlobalRoomsList(); return true;
    }
    const targetCode = roomIdentifier.trim();
    const { data: room, error } = await supabase.from("study_group").select("*").eq("code", targetCode).maybeSingle();

    if (error || !room) { alert(`🚨 Invalid Invite Code (${targetCode}).`); return false; }
    await supabase.from('study_group').update({ room_status: 'live' }).eq('code', targetCode);
    setCurrentRoomHostEmail(room.host_email); setCurrentRoomCode(room.code); await fetchGlobalRoomsList(); return true;
  };

  const createNewStudyRoom = async (roomName, customCode) => {
    if (!currentUserEmail) { alert("You must be authenticated."); return null; }
    const generatedCode = customCode || `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await supabase.from("study_group").insert([{ name: roomName, code: generatedCode, host_email: currentUserEmail, room_status: 'saved' }]).select().single();
    if (error) { alert(`Error establishing session: ${error.message}`); return null; }
    await fetchGlobalRoomsList(); return data.code;
  };

  // ☁️ CLOUD SYNC PIPELINE: ADD UPLOADED FILE RESOURCE RECORD INTO BACKEND
  const addFileToBank = async (fileObj) => {
    if (!currentUserId) {
      alert("❌ Authentication Required: Login to save dynamic assets.");
      return;
    }

    const newCloudFile = {
      id: fileObj.id || crypto.randomUUID(),
      user_id: currentUserId, // 🌟 Securely linked!
      title: fileObj.title || "Untitled Document",
      type: fileObj.type || "text",
      topic: fileObj.topic || "General Study",
      progress: fileObj.progress || 0,
      metadata: fileObj.metadata || ""
    };

    const { data, error } = await supabase
      .from('study_materials')
      .insert([newCloudFile])
      .select()
      .single();

    if (!error && data) {
      setMaterials(prev => [data, ...prev]); // Instantly updates local runtime array state
    } else {
      console.error("Error inserting file properties record into Supabase:", error?.message);
    }
  };

  // Remaining secondary UI operations (Can remain local or added to tracking configurations later)
  const [quizHistory, setQuizHistory] = useState(() => { const savedHistory = localStorage.getItem("studybuddy_quiz_history"); return savedHistory ? JSON.parse(savedHistory) : []; });
  useEffect(() => { localStorage.setItem("studybuddy_quiz_history", JSON.stringify(quizHistory)); }, [quizHistory]);

  const quizzesMasteredCount = useMemo(() => {
    if (!quizHistory || !Array.isArray(quizHistory)) return 0;
    return quizHistory.filter(quiz => quiz.status === "Completed" || quiz.pct >= 70).length;
  }, [quizHistory]);

  const trackQuizActivity = () => {
    const today = new Date().toDateString();
    if (localStorage.getItem("last_active_date") !== today) localStorage.setItem("last_active_date", today);
  };

  const addQuizRecord = (newRecord) => { setQuizHistory(prev => [newRecord, ...prev]); };
  const clearQuizHistory = () => setQuizHistory([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) root.classList.add('dark'); else root.classList.remove('dark');
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const [accentColor, setAccentColor] = useState(() => localStorage.getItem("studybuddy_accent") || "purple");
  const [theme, setTheme] = useState(() => localStorage.getItem("studybuddy_theme") || "light");
  const [language, setLanguage] = useState(() => localStorage.getItem("studybuddy_language") || "English (US)");

  const [activePreview, setActivePreview] = useState(null);
  const [isStrictModeActive, setIsStrictModeActive] = useState(false);
  const [activeFocusFile, setActiveFocusFile] = useState(null);
  const [aiChatHistory, setAiChatHistory] = useState(() => { const stored = localStorage.getItem("studybuddy_ai_chats"); return stored ? JSON.parse(stored) : []; });
  
  const [weeklyProgress, setWeeklyProgress] = useState(() => {
    const defaultData = [{ day: "Sun", value: 0 }, { day: "Mon", value: 0 }, { day: "Tue", value: 0 }, { day: "Wed", value: 0 }, { day: "Thu", value: 0 }, { day: "Fri", value: 0 }, { day: "Sat", value: 0 }];
    const stored = localStorage.getItem("studybuddy_weekly_progress"); return stored ? JSON.parse(stored) : defaultData;
  });
  useEffect(() => { localStorage.setItem("studybuddy_quizzes", quizzesMastered.toString()); }, [quizzesMastered]);
  useEffect(() => { localStorage.setItem("studybuddy_studydays", studyDays.toString()); }, [studyDays]);
  useEffect(() => { localStorage.setItem("studybuddy_accent", accentColor); }, [accentColor]);
  useEffect(() => { localStorage.setItem("studybuddy_theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("studybuddy_language", language); }, [language]);
  useEffect(() => { localStorage.setItem("studybuddy_ai_chats", JSON.stringify(aiChatHistory)); }, [aiChatHistory]);
  useEffect(() => { localStorage.setItem("studybuddy_weekly_progress", JSON.stringify(weeklyProgress)); }, [weeklyProgress]);
  
// 🌟 Add this block to save your files automatically whenever the array changes
useEffect(() => {
  localStorage.setItem("studybuddy_materials", JSON.stringify(materials));
}, [materials]);

  const awardXp = (amount) => { 
    setXp(prev => prev + amount); 
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; 
    const activeDay = dayLabels[new Date().getDay()]; 
    setWeeklyProgress(prev => prev.map(item => item.day === activeDay ? { ...item, value: Math.min(item.value + amount, 2000) } : item )); 
  };

  const toggleFileDestination = (fileId, destKey) => setMaterials(prev => prev.map(f => f.id === fileId ? { ...f, [destKey]: !f[destKey] } : f));
  
  const logQuizAttempt = (title, score, total, bwn) => { 
    if ((score/total) >= 0.7) setQuizzesMastered(p => p + 1); 
    const rec = { id: crypto.randomUUID(), title, score, totalQuestions: total, date: new Date().toLocaleDateString(), breakdown: bwn }; 
    setQuizHistory(p => [rec, ...p]); 
    awardXp(score * 15); 
  };

  const saveAiDialogue = (ctx, type = "General Coach") => { 
    const newCh = { id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), preview: ctx.substring(0,60) + "...", agent: type }; 
    setAiChatHistory(p => [newCh, ...p]); 
  };

  return (
    <AppContext.Provider
      value={{
        xp, streak: streakCount, quizzesMastered, studyDays, weeklyProgress, accentColor, setAccentColor, theme, setTheme, language, setLanguage,
        materials, setMaterials, addFileToBank, toggleFileDestination, activePreview, setActivePreview, isStrictModeActive, setIsStrictModeActive,
        activeFocusFile, setActiveFocusFile, quizHistory, addQuizRecord, clearQuizHistory, logQuizAttempt, aiChatHistory, saveAiDialogue,
        darkMode, toggleTheme, streakCount, trackQuizActivity, quizzesMasteredCount, currentRoomCode, studyGroups, joinRoom,
        createNewStudyRoom, deleteStudyRoom, fetchStudyGroups: fetchGlobalRoomsList, groupMessages, setGroupMessages, broadcastGroupMessage, timerSeconds, isTimerRunning, controlRoomTimer,
        currentUserUserName, setCurrentUserUserName, currentUserAvatar, currentUserEmail, activePeers, notifications, setNotifications, addNotification, awardXp
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be utilized safely inside an AppProvider framework wrapper.");
  return context;
}