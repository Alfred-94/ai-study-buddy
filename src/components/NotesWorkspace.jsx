import React, { useState, useEffect } from "react";
import { 
  UploadCloud, Search, Star, Sparkles, HelpCircle, Layers, 
  MessageSquare, Volume2, Share2, MoreHorizontal, Bold, Italic, 
  Underline, Link2, Image as ImageIcon, Code, Target, X, PenTool, FileText, Trash2, Video
} from "lucide-react";
// Safely import your global database context
import { useApp } from "../context/AppContext";
// Safely import your cloud database client instance
import { supabase } from "../supabaseClient";

export default function NotesWorkspace() {
  // --- 1. GLOBAL CONTEXT STORAGE CONNECTIVITY ---
  const { materials, addMaterial } = useApp();

  // --- 2. INTERACTIVE COMPONENT STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [activeWorkspaceMode, setActiveWorkspaceMode] = useState("viewer"); 
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [customWrittenNotes, setCustomWrittenNotes] = useState("");

  // --- AI MODAL ENGINE STATE MATRIX ---
  const [aiOutputTitle, setAiOutputTitle] = useState("");
  const [aiOutputContent, setAiOutputContent] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- AUDIO SYNTHESIS TRACKING STATE ---
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- 3. HARDENED ANTI-CRASH DATA GUARD MATRICES ---
  const materialsArray = React.useMemo(() => {
    if (!materials) return [];
    if (Array.isArray(materials)) return materials;
    if (typeof materials === 'object') {
      const embeddedArray = Object.values(materials).find(Array.isArray);
      if (embeddedArray) return embeddedArray;
      if (materials.id || materials.title || materials.name) return [materials];
    }
    return [];
  }, [materials]);

  const activeFile = React.useMemo(() => {
    if (materialsArray.length === 0) return null;
    return materialsArray.find(f => f && f.id === selectedFileId) || materialsArray[0] || null;
  }, [materialsArray, selectedFileId]);

  // Synchronize base navigation target file selections safely without infinite loops
  useEffect(() => {
    if (activeFile && !selectedFileId) {
      setSelectedFileId(activeFile.id);
    }
  }, [activeFile, selectedFileId]);

  // --- FETCH PERSISTENT BUCKET DATA ON REFRESH ---
  const fetchStorageMaterials = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("study_materials")
        .list("user_uploaded", {
          limit: 100,
          sortBy: { column: "name", order: "desc" }
        });

      if (error) throw error;

      if (data && typeof addMaterial === "function") {
        data
          .filter(item => item.name !== ".emptyFolderPlaceholder")
          .forEach(file => {
            const pathString = `user_uploaded/${file.name}`;
            const matchesExisting = materialsArray.some(m => m.storage_path === pathString);
            
            if (!matchesExisting) {
              addMaterial({
                id: file.id || crypto.randomUUID(),
                title: file.name,
                name: file.name,
                date: new Date(file.created_at).toLocaleDateString() || "Recent",
                type: file.name.split(".").pop() || "pdf",
                storage_path: pathString,
                content: `📄 Content cache ready.\n\nClick any tool layer above to start analyzing text streams dynamically.`
              });
            }
          });
      }
    } catch (err) {
      console.error("Storage lookup failure:", err);
    }
  };

  useEffect(() => {
    fetchStorageMaterials();
  }, [materialsArray.length]);

  // Auto-terminate any ongoing speech synthesis channels if the user changes files mid-session
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedFileId]);
 // --- 4. BACKEND & ACCESSIBILITY PIPELINE OPERATIONS ---
  
  const handleReadAloud = () => {
    if (!activeFile) {
      alert("Please select or upload a document first!");
      return;
    }

    const textToSpeak = activeFile.content || activeFile.extractedText || "This document has no readable text content layer.";

    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Your browser does not support speech synthesis audio features.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(textToSpeak.substring(0, 4000));
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleAiAction = async (actionName, promptInstruction) => {
    if (!activeFile) {
      alert("Please select a study document from your sidebar first!");
      return;
    }

    try {
      setAiOutputTitle(actionName);
      setAiOutputContent("");
      setIsAiModalOpen(true);
      setIsAiLoading(true);

      // Check if text content layer needs initialization from database pipelines
      let currentContextText = activeFile.content || "";
      if (currentContextText.includes("Content cache ready.") && activeFile.storage_path) {
        const { data: parseData, error: parseError } = await supabase.functions.invoke("process-document", {
          body: { storagePath: activeFile.storage_path, bucketName: "study_materials" }
        });
        if (!parseError && parseData?.text) {
          currentContextText = parseData.text;
          activeFile.content = parseData.text; 
        }
      }

      const targetFunction = actionName.includes("Quiz") ? "generate-quiz" : "ai-coach";
      
      const { data, error } = await supabase.functions.invoke(targetFunction, {
        body: {
          instruction: promptInstruction,
          storagePath: activeFile.storage_path || null, 
          bucketName: "study_materials",
          documentContent: currentContextText
        },
      });

      if (error) throw error;
      setAiOutputContent(data.result || "AI completed processing with an empty response.");

    } catch (err) {
      console.error("AI execution error:", err);
      if (err.message?.includes("quota") || JSON.stringify(err).includes("quota")) {
        setAiOutputContent("⚠️ [Gemini API Rate Limit Reached]\n\nYou have temporarily exceeded the free tier request limits. Please wait 60 seconds and try again!");
      } else {
        setAiOutputContent(`[Connection Note]\nYour frontend called the Edge Function successfully, but encountered an error: ${err.message}`);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileUploadTrigger = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const fileId = crypto.randomUUID();
      const fileExtension = file.name.split('.').pop() || "txt";
      const filePath = `user_uploaded/${fileId}.${fileExtension}`;

      try {
        setIsAiLoading(true);

        const { error: storageError } = await supabase.storage
          .from("study_materials")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (storageError) throw storageError;

        const { data: processingData, error: processingError } = await supabase.functions.invoke("process-document", {
          body: {
            storagePath: filePath,
            bucketName: "study_materials"
          }
        });

        if (processingError) throw processingError;

        const completeFileNode = {
         id: fileId,
          title: file.name,
          name: file.name, 
          date: "Just now",
          type: fileExtension,
          storage_path: filePath,
          content: processingData.text || "No printable content extracted.",
          words: processingData.text ? processingData.text.split(/\s+/).length : 0
        };
        
        if (typeof addMaterial === "function") {
          addMaterial(completeFileNode);
        }
        
        setSelectedFileId(fileId);
        setActiveWorkspaceMode("viewer");

      } catch (err) {
        console.error("Document pipeline failure:", err);
        alert(`Failed to upload and parse file: ${err.message || err}`);
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  const handleDeleteFile = async (e, fileNode) => {
    e.stopPropagation();
    const confirmation = window.confirm(`Are you sure you want to permanently delete "${fileNode.title || fileNode.name}"?`);
    if (!confirmation) return;

    try {
      setIsAiLoading(true);
      if (fileNode.storage_path) {
        await supabase.storage.from("study_materials").remove([fileNode.storage_path]);
      }
      
      // Clear out references instantly inside frontend layouts
      if (typeof materials === "object" && !Array.isArray(materials)) {
        // If wrapped in custom store wrappers, handle soft delete flags
        fileNode.content = "[Deleted Assets Bucket Stream]";
      }
      
      // Reload lists or fallbacks gracefully
      setSelectedFileId(prev => prev === fileNode.id ? null : prev);
      window.location.reload(); 

    } catch (err) {
      console.error("Deletion error logs:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-purple-500/20">
      
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUMN 1: LEFT DIRECTORY DRAWER */}
        {!isFocusMode && (
          <aside className="w-64 border-r border-slate-200 dark:border-[#1a1d2d] bg-white dark:bg-[#0c0d14] flex flex-col p-4 space-y-5 overflow-y-auto shrink-0 select-none">
            
            <label className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md shadow-purple-600/10 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]">
              <UploadCloud size={16} className="stroke-[3]" />
              <span>Upload File</span>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileUploadTrigger} 
                accept=".pdf,.docx,.doc,.txt,.pptx,.ppt,.png,.jpg,.jpeg" 
              />
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search materials..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#141622] text-xs font-medium rounded-xl border border-slate-200 dark:border-[#22263b] focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Uploaded Assets</span>
              <div className="space-y-1 overflow-y-auto pr-1 flex-1">
                {materialsArray
                  .filter(f => f && (f.title || f.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((file) => (
                    <div 
                      key={file.id}
                      onClick={() => {
                        setSelectedFileId(file.id);
                        setActiveWorkspaceMode("viewer"); 
                      }}
                      className={`p-3 rounded-xl cursor-pointer border transition-all relative group flex items-center justify-between ${
                        activeFile && activeFile.id === file.id && activeWorkspaceMode === "viewer"
                          ? "bg-purple-50/60 dark:bg-purple-950/10 border-purple-200 dark:border-purple-500/30"
                          : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-[#141622]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <FileText size={14} className={activeFile && activeFile.id === file.id && activeWorkspaceMode === "viewer" ? "text-purple-500" : "text-slate-400"} />
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold truncate ${activeFile && activeFile.id === file.id && activeWorkspaceMode === "viewer" ? "text-purple-900 dark:text-purple-300" : "text-slate-700 dark:text-slate-300"}`}>
                            {file.title || file.name || "Untitled Resource"}
                          </h4>
                          <span className="text-[10px] text-slate-400 block font-medium mt-0.5">{file.date || "Just now"}</span>
                        </div>
                      </div>

                      {/* 🗑️ INLINE TRASH REMOVAL CONTROLLER LAYER */}
                      <button 
                        onClick={(e) => handleDeleteFile(e, file)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded-lg transition-all ml-1"
                        title="Delete asset folder permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                {materialsArray.length === 0 && (
                  <div className="text-center py-6 px-2 text-slate-400 text-xs font-medium">
                    No documents found. Drop a new file to populate your drive context workspace.
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* COLUMN 2: CORE DOCUMENT CONTAINER VIEW SHEET */}
        <main className="flex-1 bg-white dark:bg-[#090a0f] flex flex-col min-w-0 overflow-y-auto">
          
          <div className="px-6 py-3 border-b border-slate-200 dark:border-[#1a1d2d] flex items-center justify-between gap-4 overflow-x-auto shrink-0 bg-slate-50/40 dark:bg-transparent select-none">
            <div className="flex items-center gap-1.5">
              {[
                { name: "AI Summary", icon: <Sparkles size={13} />, action: () => handleAiAction("Summary", "Create a concise, structured summary highlighting the key concepts, main arguments, and takeaways."), style: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20" },
                { name: "AI Quiz", icon: <HelpCircle size={13} />, action: () => handleAiAction("Quiz Generation", "Generate 3 challenging multiple choice questions based on this text with explanations for the correct answers."), style: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-500/20" },
                { name: "Flashcards", icon: <Layers size={13} />, action: () => handleAiAction("Flashcards Stacks", "Extract the top 4 critical terms or definitions from this text and format them as Front / Back flashcard concepts."), style: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-500/20" },
                { name: "Ask AI", icon: <MessageSquare size={13} />, action: () => setIsAiPanelOpen(prev => !prev), style: `transition-all ${isAiPanelOpen ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-500/20'}` },
                { name: "Explain", icon: <Sparkles size={13} />, action: () => handleAiAction("Deep Explanation", "Explain the core thesis and difficult terms of this document using a simple, easy-to-understand analogy."), style: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20" },
                { name: "Video Overview", icon: <Video size={13} />, action: () => handleAiAction("Video Overview Script", "Formulate an architectural script overview breakdown analyzing this document as a video lecture production blueprint."), style: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200/60 dark:border-cyan-500/20" },
                { name: isSpeaking ? "Stop Reading" : "Read Aloud", icon: <Volume2 size={13} className={isSpeaking ? "animate-bounce" : ""} />, action: handleReadAloud, style: isSpeaking ? "bg-red-600 text-white border-red-600 shadow-sm" : "bg-slate-100 dark:bg-[#141622] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#22263b]" },
              ].map((pill, idx) => (
                <button key={idx} onClick={pill.action} className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold rounded-xl hover:brightness-95 active:scale-[0.97] shrink-0 transition-all ${pill.style}`}>
                  {pill.icon}
                  <span>{pill.name}</span>
                </button>
              ))}

              <span className="h-4 w-px bg-slate-200 dark:bg-[#1a1d2d] mx-2" />
              <button 
                onClick={() => setActiveWorkspaceMode(activeWorkspaceMode === "writer" ? "viewer" : "writer")}
                className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold rounded-xl transition-all active:scale-[0.97] shrink-0 ${
                  activeWorkspaceMode === "writer"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/10"
                    : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20 hover:bg-purple-100"
                }`}
              >
                <PenTool size={13} />
                <span>{activeWorkspaceMode === "writer" ? "Viewing Document" : "Write Custom Notes"}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-1 shrink-0 text-slate-400">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-[#141622] rounded-xl transition-colors hover:text-slate-700 dark:hover:text-white"><Share2 size={15} /></button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-[#141622] rounded-xl transition-colors hover:text-slate-700 dark:hover:text-white"><MoreHorizontal size={15} /></button>
            </div>
          </div>

          <div className="p-8 max-w-3xl w-full mx-auto space-y-6 flex-1 flex flex-col">
            
            {activeWorkspaceMode === "writer" ? (
              /* NOTE WRITER ENGINE CANVAS */
              <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Workspace Note Canvas</h2>
                  <p className="text-xs text-slate-400 font-medium">Type, edit, and keep track of thoughts alongside materials inside this custom interface.</p>
                </div>
                   <div className="w-full flex items-center gap-1 p-1 bg-slate-50 dark:bg-[#0e1017] border border-slate-200 dark:border-[#1a1d2d] rounded-xl text-slate-500 select-none">
                  <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-[#22263b]">
                    <button className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg"><Bold size={14} /></button>
                    <button className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg"><Italic size={14} /></button>
                    <button className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg"><Underline size={14} /></button>
                  </div>
                  <div className="flex items-center gap-0.5 px-1">
                    <button className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg"><Link2 size={14} /></button>
                    <button className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg"><ImageIcon size={14} /></button>
                    <button className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg"><Code size={14} /></button>
                  </div>
                </div>

                <textarea 
                  value={customWrittenNotes}
                  onChange={(e) => setCustomWrittenNotes(e.target.value)}
                  placeholder="Type your notes right here..." 
                  className="w-full flex-1 min-h-[350px] bg-transparent text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal border-none p-0 focus:ring-0 focus:outline-none resize-none select-text"
                />
              </div>
            ) : (
              /* DYNAMIC UPLOADED MATERIAL VIEW DISPLAY SHEET */
              <div className="space-y-5 flex-1 select-text animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                      {activeFile ? (activeFile.title || activeFile.name) : "No Document Selected"}
                    </h1>
                    <Star size={18} className="text-slate-300 dark:text-slate-700 cursor-pointer hover:text-yellow-400 transition-colors" />
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-400 select-none">
                    <span>{activeFile?.date || "Just now"}</span>
                    <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                    <span className="text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Unified Storage Matrix Active
                    </span>
                  </div>
                </div>

                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal space-y-4 pt-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Document Stream Content</h3>
                  <p className="bg-slate-50/50 dark:bg-[#0c0d14]/60 p-5 rounded-2xl border border-slate-200/60 dark:border-[#1a1d2d] shadow-inner whitespace-pre-wrap">
                    {activeFile ? (activeFile.content || activeFile.extractedText) : "Upload your resource assets using the sidebar controller to activate this canvas interface."}
                  </p>
                </div>
              </div>
            )}

          </div>
          <footer className="w-full border-t border-slate-200 dark:border-[#1a1d2d] bg-white dark:bg-[#0c0d14] px-6 py-3 flex items-center justify-end shrink-0 text-xs select-none">
             <button 
              onClick={() => setIsFocusMode(prev => !prev)}
              className={`flex items-center gap-2 px-4 py-2 border font-extrabold rounded-xl shadow-sm transition-all active:scale-[0.98] ${
                isFocusMode 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-purple-600/20' 
                  : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 border-purple-200/60 dark:border-purple-500/20 text-purple-600 dark:text-purple-400'
              }`}
            >
              <Target size={14} />
              <span>{isFocusMode ? "Exit Focus Mode" : "Focus Mode"}</span>
            </button>
          </footer>
        </main>

        {/* COLUMN 3: RIGHT COLLAPSIBLE AI SIDEBAR DRAWER */}
        {isAiPanelOpen && !isFocusMode && (
          <aside className="w-80 border-l border-slate-200 dark:border-[#1a1d2d] bg-white dark:bg-[#0c0d14] flex flex-col p-4 space-y-4 overflow-y-auto shrink-0 select-none animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1a1d2d] pb-2">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-900 dark:text-white">
                <Sparkles size={14} className="text-purple-500" />
                <span>AI Study Assistant</span>
              </div>
              <button 
                onClick={() => setIsAiPanelOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#141622]"
              >
                <X size={14} />
              </button>
            </div>

            <div className="relative">
              <textarea 
                rows={4} 
                placeholder={`Ask anything about ${activeFile ? (activeFile.title || activeFile.name) : "this file"}...`}
                className="w-full p-3 bg-slate-50 dark:bg-[#141622] text-xs font-medium rounded-xl border border-slate-200 dark:border-[#22263b] placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none transition-colors select-text"
              />
              <button className="absolute right-2.5 bottom-2.5 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md shadow-purple-600/10">
                <Sparkles size={11} fill="currentColor" />
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Suggested Prompts</p>
              {[
                "Summarize the file content core vectors", 
                "Identify foundational definitions", 
                "Generate custom flashcard answers", 
                "Explain the engineering principles simply"
              ].map((chip, index) => (
                <button key={index} className="w-full p-2.5 text-xs text-left font-bold bg-slate-50 dark:bg-[#141622] text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white border border-slate-200/60 dark:border-[#22263b] rounded-xl transition-all">
                  {chip}
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* AI RESPONSIVE POPUP MODAL SCREEN */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-text animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0c0d14] w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1a1d2d] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden transform scale-100 transition-all">
         <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1a1d2d] flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
              <div className="flex items-center gap-2 text-sm font-black text-purple-600 dark:text-purple-400">
                <Sparkles size={15} fill="currentColor" />
                <span>{aiOutputTitle} Engine</span>
              </div>
              <button 
                onClick={() => setIsAiModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#141622]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-400 animate-pulse">Running advanced document mapping context layers...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-medium bg-slate-50/50 dark:bg-[#090a0f]/40 p-4 rounded-xl border border-slate-200/50 dark:border-[#1a1d2d]">
                  {aiOutputContent}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 dark:border-[#1a1d2d] bg-slate-50/30 dark:bg-transparent flex justify-end">
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}