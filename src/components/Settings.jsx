import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useApp } from "../context/AppContext";
import { translations } from "../utils/translations";
import {
  User, Sliders, Bell, Eye, Shield, CreditCard, HardDrive, Link, Globe,
  Camera, CheckCircle, Loader2, Plus, Minus, ChevronRight, Download, RefreshCw, LogOut, HelpCircle, ArrowUpRight
} from "lucide-react";

export default function Settings({ forcedSection, setForcedSection, setTopbarAvatar }) {
  const { theme, setTheme, accentColor, setAccentColor, language, setLanguage, difficulty, setDifficulty } = useApp();

  // Navigation Track
  const [activeTab, setActiveTab] = useState("Profile");

  // Sync internal layout tabs when forced from top header buttons
  useEffect(() => {
    if (forcedSection) {
      setActiveTab(forcedSection);
      if (typeof setForcedSection === "function") {
        setForcedSection(null);
      }
    }
  }, [forcedSection, setForcedSection]);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80");
  const [uploading, setUploading] = useState(false);

  // Study Preference States
  const [subjects, setSubjects] = useState(["Mathematics", "Computer Science"]);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(60);

  // Notification Toggle States
  const [studyReminders, setStudyReminders] = useState(true);
  const [newFeatures, setNewFeatures] = useState(false);
  const [quizResults, setQuizResults] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);

  // Privacy and Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [twoFactor, setTwoFactor] = useState(false);

  // Linked SSO Identities State
  const [connectedProviders, setConnectedProviders] = useState([]);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "" });
  const triggerToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const t = translations[language] || translations["English (US)"];

  // Sync core profile records & configurations from Supabase auth meta-layers
  useEffect(() => {
    async function fetchUserData() {
      if (!supabase?.auth) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Core Identity Mapping
        setEmail(user.email || "");
        if (user.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
        if (user.user_metadata?.bio) setBio(user.user_metadata.bio);
        if (user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
          if (typeof setTopbarAvatar === "function") setTopbarAvatar(user.user_metadata.avatar_url);
        }

        // Load Custom Real Preferences Matrix saved in user_metadata
        if (user.user_metadata?.subjects) setSubjects(user.user_metadata.subjects);
        if (user.user_metadata?.dailyGoal) setDailyGoal(user.user_metadata.dailyGoal);
        
        // Load Live Notification Checkboxes
        if (user.user_metadata?.studyReminders !== undefined) setStudyReminders(user.user_metadata.studyReminders);
        if (user.user_metadata?.newFeatures !== undefined) setNewFeatures(user.user_metadata.newFeatures);
        if (user.user_metadata?.quizResults !== undefined) setQuizResults(user.user_metadata.quizResults);
        if (user.user_metadata?.weeklyReports !== undefined) setWeeklyReports(user.user_metadata.weeklyReports);
        if (user.user_metadata?.twoFactor !== undefined) setTwoFactor(user.user_metadata.twoFactor);

        // Map live linked provider identities dynamically (Google, GitHub, etc.)
        if (user.app_metadata?.providers) {
          setConnectedProviders(user.app_metadata.providers);
        }
      }
    }
    fetchUserData();
  }, [setTopbarAvatar]);

  // Saves General User Details
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      if (supabase?.auth) {
        const { error } = await supabase.auth.updateUser({ 
          data: { full_name: fullName, bio } 
        });
        if (error) throw error;
        triggerToast(t.toastProfile || "Profile settings saved successfully!");
      }
    } catch (err) {
      triggerToast(`Error saving profile: ${err.message}`);
    }
  };

  // Saves Preference Matrices (Subjects, Daily Goal, Difficulty)
  const savePreferences = async (updatedSubjects, updatedGoal) => {
    try {
      if (supabase?.auth) {
        await supabase.auth.updateUser({
          data: { 
            subjects: updatedSubjects || subjects, 
            dailyGoal: updatedGoal !== undefined ? updatedGoal : dailyGoal 
          }
        });
      }
    } catch (err) {
      triggerToast(`Failed to sync preferences metadata: ${err.message}`);
    }
  };

  // Toggles and Saves Notifications Variables to Metadata
  const saveNotificationToggle = async (key, value) => {
    try {
      if (supabase?.auth) {
        await supabase.auth.updateUser({
          data: { [key]: value }
        });
        triggerToast("Notification configuration updated!");
      }
    } catch (err) {
      triggerToast(`Update failed: ${err.message}`);
    }
  };

  // Handles User Password Security Changes
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      triggerToast("Please input a valid new password.");
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      triggerToast("Security password updated successfully!");
      setCurrentPassword("");
      newPassword("");
    } catch (err) {
      triggerToast(`Security change rejected: ${err.message}`);
    }
  };

  // Handles Storage Avatar Upload
  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const filePath = `avatars/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      
      if (typeof setTopbarAvatar === "function") {
        setTopbarAvatar(publicUrl);
      }
      window.dispatchEvent(new Event("storage_avatar_updated"));

      if (supabase?.auth) {
        await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      }
      triggerToast("Avatar updated successfully!");
    } catch (error) {
      triggerToast(`Upload error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSubject = () => {
    if (newSubjectInput.trim() && !subjects.includes(newSubjectInput.trim())) {
      const revised = [...subjects, newSubjectInput.trim()];
      setSubjects(revised);
      savePreferences(revised, dailyGoal);
      setNewSubjectInput("");
      setShowSubjectInput(false);
      triggerToast("Subject target appended!");
    }
  };

  const handleRemoveSubject = (target) => {
    const revised = subjects.filter(s => s !== target);
    setSubjects(revised);
    savePreferences(revised, dailyGoal);
    triggerToast("Subject target cleared.");
  };

  const handleSignOut = async () => {
    if (supabase?.auth) {
      await supabase.auth.signOut();
    }
  };const accentColors = [
    { id: "purple", class: "bg-[#7C3AED]" },
    { id: "blue", class: "bg-blue-500" },
    { id: "cyan", class: "bg-cyan-400" },
    { id: "green", class: "bg-emerald-500" },
    { id: "orange", class: "bg-orange-500" },
    { id: "pink", class: "bg-rose-500" }
  ];

  const sidebarItems = [
    { id: "Profile", label: "Profile", icon: User },
    { id: "Preferences", label: "Preferences", icon: Sliders },
    { id: "Notifications", label: "Notifications", icon: Bell },
    { id: "Appearance", label: "Appearance", icon: Eye },
    { id: "Privacy", label: "Privacy & Security", icon: Shield },
    { id: "Subscription", label: "Subscription", icon: CreditCard },
    { id: "Storage", label: "Data & Storage", icon: HardDrive },
    { id: "Connected", label: "Connected Accounts", icon: Link },
    { id: "Language", label: "Language", icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 p-4 lg:p-8">
      
      {/* Dynamic Action Toast Alerts */}
      <AnimatePresence>
        {toast.show && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold">
            <CheckCircle size={16} className="text-[#7C3AED]" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start">
        
        {/* COLUMN 1: LEFT SUB-NAVIGATION NAVIGATION */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
                  isActive 
                    ? "bg-purple-50 dark:bg-purple-950/40 text-[#7C3AED] dark:text-[#A78BFA]" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* COLUMN 2: CENTER MAIN CONFIG WORKSPACE */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          
          {/* PROFILE CARD */}
          {activeTab === "Profile" && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Profile Information</h3>
                <p className="text-xs text-slate-400 mt-0.5">Update your personal information and profile settings.</p>
              </div>

              <form onSubmit={handleProfileSave} className="flex flex-col md:flex-row items-center gap-6">
                <label htmlFor="avatar-file" className="relative group cursor-pointer shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-sm relative flex items-center justify-center">
                    {uploading ? (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"><Loader2 className="animate-spin w-5 h-5" /></div>
                      ) : (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center text-white opacity-0 group-hover:opacity-100"><Camera size={16} /></div>
                    )}
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <input type="file" id="avatar-file" accept="image/*" disabled={uploading} onChange={handleAvatarUpload} className="hidden" />
                </label>

                <div className="flex-1 w-full space-y-3.5">
                  <div className="grid grid-cols-4 items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="col-span-3 px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Address</label>
                    <input type="email" value={email} disabled className="col-span-3 px-4 py-2 text-sm bg-slate-50/60 dark:bg-slate-800/60 text-slate-400 border border-slate-100 dark:border-slate-700 rounded-xl outline-none cursor-not-allowed" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Bio</label>
                    <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} className="col-span-3 px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none" />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button type="submit" className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl shadow-sm transition">Save Changes</button>
                  </div>
                </div>
              </form>
            </section>
          )}

          {/* STUDY PREFERENCES CARD */}
          {activeTab === "Preferences" && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Study Preferences</h3>
                <p className="text-xs text-slate-400 mt-0.5">Customize your study experience and content preferences.</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Quiz Difficulty</h4>
                    <p className="text-[11px] text-slate-400">Choose your preferred difficulty level for quizzes.</p>
                  </div>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold outline-none">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-t border-slate-50 dark:border-slate-800 pt-4">
                <div className="max-w-md">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Preferred Subjects</h4>
                    <p className="text-[11px] text-slate-400">Select the specific subjects you want your study buddy to center on.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 justify-end max-w-xs">
                    {subjects.map((sub) => (
                      <span key={sub} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/30 text-[#7C3AED] dark:text-[#A78BFA] text-[11px] font-bold rounded-lg">
                        {sub}
                        <button type="button" onClick={() => handleRemoveSubject(sub)} className="hover:text-red-500 ml-0.5 text-[9px]">✕</button>
                      </span>
                    ))}
                    
                    {showSubjectInput ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={newSubjectInput} 
                          onChange={(e) => setNewSubjectInput(e.target.value)} 
                          placeholder="Subject name..." 
                          className="px-2 py-1 text-xs border border-purple-200 rounded-lg outline-none bg-white dark:bg-slate-800 w-24"
                        />
                        <button onClick={handleAddSubject} className="p-1 text-xs font-bold text-white bg-purple-600 rounded-lg">Add</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowSubjectInput(true)} className="p-1 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-400 hover:text-slate-600"><Plus size={14} /></button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-50 dark:border-slate-800 pt-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily Study Goal</h4>
                    <p className="text-[11px] text-slate-400">Set your daily study goal (in minutes).</p>
                  </div>
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-1">
                    <button onClick={() => { const val = Math.max(10, dailyGoal - 5); setDailyGoal(val); savePreferences(subjects, val); }} className="p-1 text-slate-400 hover:text-slate-600"><Minus size={14} /></button>
                    <span className="px-3 text-xs font-bold w-12 text-center">{dailyGoal}</span>
                    <button onClick={() => { const val = dailyGoal + 5; setDailyGoal(val); savePreferences(subjects, val); }} className="p-1 text-slate-400 hover:text-slate-600"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* NOTIFICATIONS CONFIG CARD */}
          {activeTab === "Notifications" && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Notifications</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage how you want to be notified.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "studyReminders", title: "Study Reminders", desc: "Get reminded to complete your daily study goals.", state: studyReminders, set: setStudyReminders },
                  { id: "quizResults", title: "Quiz Results", desc: "Receive notifications when your quizzes are graded.", state: quizResults, set: setQuizResults },
                  { id: "newFeatures", title: "New Features", desc: "Updates about new features and improvements.", state: newFeatures, set: setNewFeatures },
                  { id: "weeklyReports", title: "Weekly Reports", desc: "Receive weekly progress reports and insights.", state: weeklyReports, set: setWeeklyReports }
                ].map((notif, idx) => (
                  <div key={idx} className="flex items-start justify-between p-1">
                    <div className="max-w-[80%]">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{notif.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{notif.desc}</p>
                    </div>
                    <button 
                      onClick={() => { const next = !notif.state; notif.set(next); saveNotificationToggle(notif.id, next); }} 
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors relative duration-200 shrink-0 ${notif.state ? "bg-[#7C3AED]" : "bg-slate-200 dark:bg-slate-700"}`}
                    >
                      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notif.state ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* APPEARANCE SYSTEM CARD */}
          {activeTab === "Appearance" && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Appearance</h3>
                <p className="text-xs text-slate-400 mt-0.5">Customize how the application looks for you.</p>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Theme</h4>
                    <p className="text-[11px] text-slate-400">Choose your preferred theme.</p>
                  </div>
                  <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                    {["Light", "Dark", "System"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setTheme(m)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${theme === m ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-50 dark:border-slate-800 pt-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Accent Color</h4>
                    <p className="text-[11px] text-slate-400">Choose your favorite accent color.</p>
                  </div>
                  <div className="flex gap-2">
                    {accentColors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setAccentColor(color.id)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold transition transform active:scale-90 ${color.class}`}
                        >
                        {accentColor === color.id && "✓"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* PRIVACY & SECURITY PANEL */}
          {activeTab === "Privacy" && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Privacy & Security</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage your password, account security, and data sharing preferences.</p>
              </div>
              <form onSubmit={handlePasswordUpdate} className="space-y-4 text-sm">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="max-w-md px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="max-w-md px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none" />
                </div>
                <div className="flex justify-start">
                  <button type="submit" className="px-3.5 py-1.5 bg-[#7C3AED] text-white font-bold text-xs rounded-xl hover:bg-[#6D28D9] transition">Update Password</button>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Two-Factor Authentication</h4>
                    <p className="text-[11px] text-slate-400">Add an extra layer of security to your account.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { const next = !twoFactor; setTwoFactor(next); saveNotificationToggle("twoFactor", next); }} 
                    className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition ${twoFactor ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`}
                  >
                    {twoFactor ? "Enabled" : "Enable"}
                  </button>
                </div>
              </form>
            </motion.section>
          )}

          {/* SUBSCRIPTION PANEL */}
          {activeTab === "Subscription" && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Subscription Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5">View details regarding your plan status, billing lifecycle, and invoices.</p>
              </div>
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-[#7C3AED] dark:text-[#A78BFA] px-2.5 py-0.5 rounded-full font-bold tracking-wider uppercase">Active Plan</span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mt-1">Premium Scholar Tier</h4>
                  <p className="text-xs text-slate-400">Next billing cycle completes on June 25, 2026 ($9.99/mo).</p>
                </div>
                <button className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0">Change Plan</button>
              </div>
              <div className="border-t border-slate-50 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Payment Methods</h4>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">•••• •••• •••• 4242 (Visa)</span>
                  <button className="text-xs font-bold text-[#7C3AED] hover:underline">Edit</button>
                </div>
              </div>
            </motion.section>
          )}

          {/* DATA & STORAGE PANEL */}
          {activeTab === "Storage" && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Data & Storage</h3>
                <p className="text-xs text-slate-400 mt-0.5">Monitor space utilization from your uploaded materials and files.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Cloud Storage Allocated</span>
                    <span className="text-slate-800 dark:text-slate-200">142.5 MB / 2.0 GB</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: "7.1%" }} />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Clear Image Cache</h4>
                    <p className="text-[11px] text-slate-400">Free up local browser assets and storage metrics.</p>
                  </div>
                  <button onClick={() => triggerToast("Local storage cache optimized!")} className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:text-rose-500 transition">Clear Cache</button>
                </div>
              </div>
            </motion.section>
          )}

          {/* LANGUAGE PANEL */}
          {activeTab === "Language" && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{t.languageTitle || "System Language"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select your primary localization environment framework format.</p>
                </div>
              <select 
                value={language}
                onChange={(e) => { setLanguage(e.target.value); triggerToast(t.toastLang || "Locale switched successfully!"); }}
                className="w-full max-w-xs border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="English (US)">English (US)</option>
                <option value="Español">Español</option>
                <option value="Français">Français</option>
              </select>
            </motion.section>
          )}

          {/* CONNECTED ACCOUNTS PANEL */}
          {activeTab === "Connected" && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Connected Accounts</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage single sign-on integrations and connected third-party applications.</p>
              </div>
              
              <div className="space-y-3.5">
                {[
                  { id: "google", name: "Google Account", icon: "🌐", alternativeDesc: "Sign-in identity active" },
                  { id: "github", name: "GitHub Workspace", icon: "💻", alternativeDesc: "Developer environment link available" },
                  { id: "azure", name: "Microsoft Live ID", icon: "🪟", alternativeDesc: "Enterprise secure link available" }
                ].map((account) => {
                  const isConnected = connectedProviders.includes(account.id);
                  return (
                    <div key={account.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800 rounded-2xl">
                      <div className="flex items-center gap-3.5">
                        <span className="text-xl bg-white dark:bg-slate-700 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0">{account.icon}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{account.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {isConnected ? "Linked cleanly as current auth partner" : account.alternativeDesc}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => triggerToast(isConnected ? "SSO provider decoupling must be managed via Auth admin control panel." : "Redirecting to single sign-on security handler...")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          isConnected 
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800" 
                            : "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm"
                        }`}
                      >
                        {isConnected ? "Linked" : "Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>

        {/* COLUMN 3: RIGHT UTILITY ACCOUNT SIDEBAR */}
        <div className="lg:col-span-1 xl:col-span-1 space-y-6">
          
          {/* ACCOUNT STATS SUMMARY */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-sm">
              <User size={16} className="text-purple-500" />
              <span>Account Summary</span>
            </div>
            <div className="space-y-3 text-xs">
              {[
                { label: "Member Since", val: "May 25, 2024", highlight: false },
                { label: "Account Type", val: "Premium", highlight: true },
                { label: "Study Streak", val: "5 Days", highlight: true, color: "text-orange-500" },
                { label: "Quizzes Taken", val: "48", highlight: false },
                { label: "Total XP", val: "1,450 XP", highlight: false }
              ].map((row, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800/50 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-400 text-[11px]">{row.label}</span>
                  <span className={`font-bold ${row.highlight ? row.color || "text-[#7C3AED]" : "text-slate-700 dark:text-slate-200"}`}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PREMIUM SUBSCRIPTION CARD */}
          <div className="bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-3xl p-5 text-white shadow-md space-y-4 relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">Current Plan</span>
              <h4 className="font-bold text-base pt-1">Premium Plan</h4>
              <p className="text-[11px] text-purple-100">You have full access to all features.</p>
            </div>
            <button className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 transition px-4 py-2.5 rounded-xl text-xs font-bold backdrop-blur-md">
              <span>Manage Subscription</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* QUICK ACTIONS PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs px-1">Quick Actions</h4>
            <div className="space-y-1">
              {[
                { label: "Download My Data", icon: Download, desc: "Export your study data", action: () => triggerToast("Compiling secure data archive payload...") },
                { label: "Reset Preferences", icon: RefreshCw, desc: "Reset all settings to default", action: () => { setSubjects(["Mathematics"]); setDailyGoal(60); savePreferences(["Mathematics"], 60); triggerToast("Preferences reverted to factory baseline."); } },
                { label: "Sign Out", icon: LogOut, desc: "Sign out from your account", action: handleSignOut }
              ].map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button key={idx} onClick={action.action} className="w-full flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition group text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/30 rounded-lg text-slate-400 group-hover:text-[#7C3AED] transition">
                        <Icon size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{action.label}</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                  </button>
                );
              })}
            </div>
          </div>
          {/* NEED HELP WIDGET */}
          <div className="bg-purple-50/50 dark:bg-purple-950/10 rounded-3xl p-5 border border-purple-100/50 dark:border-purple-900/20 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#7C3AED] dark:text-[#A78BFA]">
              <HelpCircle size={15} />
              <span>Need Help?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">Visit our Help Center for guides and support or contact our team.</p>
            <button className="flex items-center gap-1.5 text-xs font-bold text-[#7C3AED] dark:text-[#A78BFA] hover:underline">
              <span>Go to Help Center</span>
              <ArrowUpRight size={12} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}