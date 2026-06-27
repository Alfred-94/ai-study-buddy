import React, { useState, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  Trash2,
  ChevronRight,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FolderHeart,
  Layers
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useApp } from "../context/AppContext";

export default function MaterialUpload({ userId }) {
  const { materials, setMaterials, setActivePreview } = useApp();
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
  if (!userId) return;
  const load = async () => {
    const { data } = await supabase
      .from('study_materials')
      .select('*')
      .eq('user_id', userId);
    if (data && data.length > 0) setMaterials(data);
   };
   load();
   }, 
   [userId]);

  // Helper utility to style file icons individually by type extension
  const getFileIconStyles = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { bg: 'bg-rose-50 dark:bg-rose-950/20', text: 'text-rose-500' };
    if (ext === 'docx' || ext === 'doc') return { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-500' };
    if (ext === 'pptx' || ext === 'ppt') return { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-500' };
    return { bg: 'bg-indigo-50 dark:bg-indigo-950/20', text: 'text-indigo-500' };
  };

  // Helper utility to calculate combined file banking sizes safely
  const calculateTotalStorage = () => {
    if (!materials || materials.length === 0) return "0.00 MB";
    const total = materials.reduce((acc, curr) => {
      const val = parseFloat(curr.size) || 0;
      return acc + val;
    }, 0);
    return `${total.toFixed(2)} MB`;
  };

  // Helper utility to trigger temporary dynamic toast alerts
  const triggerNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // 📥 Core Upload Pipeline
  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const uploadedFiles = [];

    for (const file of Array.from(files)) {
      // Strict 45MB Frontend Validation Gate
      const MAX_SIZE = 45 * 1024 * 1024; 
      if (file.size > MAX_SIZE) {
        const currentSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        triggerNotification("error", `"${file.name}" is too large (${currentSizeMB}MB). Max limit is 45MB.`);
        continue; 
      }

      try {
        const cleanName = `${Date.now()}_${file.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        const { data, error } = await supabase.storage
          .from("study-materials")
          .upload(`uploads/${cleanName}`, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("study-materials")
          .getPublicUrl(`uploads/${cleanName}`);

        const materialRecord = {
          id: data.path,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          uploadedAt: new Date().toLocaleDateString(),
          type: file.type,
          url: urlData.publicUrl,
        };

        uploadedFiles.push(materialRecord);
        setActivePreview(materialRecord);

        // ADD THIS - save to database so it persists
const { error: dbError } = await supabase
  .from('study_materials')
  .insert({
    user_id: userId,
    title: file.name,
    name: file.name,
    file_path: data.path,
    url: urlData.publicUrl,
    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    type: file.type,
    uploaded_at: new Date().toISOString(),
  });

if (dbError) console.error('DB insert error:', dbError);

      } catch (err) {
        console.error("Storage upload exception caught:", err.message);
        triggerNotification("error", `Failed to upload ${file.name}: ${err.message}`);
      }
    }

    if (uploadedFiles.length > 0) {
      setMaterials((prev) => [...(prev || []), ...uploadedFiles]);
      triggerNotification("success", `Successfully saved ${uploadedFiles.length} file(s) to your File Bank.`);
    }
    
    setUploading(false);
  };

  // 🗑 Asset Deletion Flow
  const deleteMaterial = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this file from your File Bank?")) return;
    try {
      const { error } = await supabase.storage
        .from("study-materials")
        .remove([id]);

      if (error) throw error;
      setMaterials((prev) => (prev || []).filter((item) => item.id !== id));
      setActivePreview(null);
      triggerNotification("success", "File successfully cleared from your Bank storage.");
    } catch (err) {
      console.error("Delete failed:", err.message);
      triggerNotification("error", "Could not remove the asset from remote cloud nodes.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12 text-slate-700 dark:text-slate-300">
      
      {/* Notifications Dynamic Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold shadow-lg transition-all ${
          notification.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400"
            : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400"
        }`}>
          {notification.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Dynamic Header Titles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/60">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Material Upload Hub</h1>
          <p className="text-slate-400 dark:text-slate-500 mt-1 text-xs font-medium">
            Ingest and store document coordinates directly into your centralized persistent student library bank.
          </p>
        </div>
        
        {/* Dynamic File Bank Stat Badges */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0 shadow-sm">
          <div className="p-2 bg-violet-50 dark:bg-violet-950/30 text-violet-600 rounded-lg">
            <HardDrive size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">File Bank Vault</div>
            <div className="text-xs font-black text-slate-800 dark:text-white font-mono">
              {materials?.length || 0} Files Locked ({calculateTotalStorage()})
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Drag & Drop Area */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-slate-800 dark:text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
            <Upload size={14} className="text-violet-600" />
            Ingest Materials Pipeline
          </h3>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
            className={`border-2 border-dashed rounded-[24px] h-[340px] p-8 flex flex-col items-center justify-center transition-all bg-white dark:bg-slate-900 shadow-sm ${
              isDragging 
                ? "border-violet-500 bg-violet-50/30 dark:bg-violet-950/10 scale-[1.005]" 
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div className="text-violet-500 mb-4 transition-transform duration-300 hover:scale-105">
              {uploading ? (
                <Loader2 className="w-12 h-12 stroke-[1.5] animate-spin text-violet-600" />
                ) : (
                <Upload className="w-12 h-12 stroke-[1.25]" />
              )}
            </div>
            
            <p className="text-slate-800 dark:text-slate-200 font-extrabold text-sm tracking-tight">
              {uploading ? "Uploading your study materials..." : "Drag & drop files straight into your bank"}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-1 font-medium">or</p>
            
            <label className="mt-4 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]">
              Browse Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
            
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-8 uppercase tracking-wider">
              Accepted Formats: PDF, DOCX, PPTX, TXT (Max 45MB)
            </p>
          </div>
        </div>

        {/* Right Side: Uploaded Materials Index Feed (THE FILE BANK) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-slate-800 dark:text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
            <FolderHeart size={14} className="text-violet-600" />
            Your Saved File Bank
          </h3>
          
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 bg-slate-50/50 dark:bg-slate-900/20 p-3 rounded-[24px] border border-slate-100 dark:border-slate-800/60">
            {(!materials || materials.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs font-medium text-slate-400 dark:text-slate-500 shadow-sm h-[314px]">
                <Layers className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2 stroke-[1.5]" />
                Your File Bank is empty.<br />Upload a document on the left to save it here.
              </div>
            ) : (
              materials.map((file) => {
                const styles = getFileIconStyles(file.name);
                return (
                  <div 
                    key={file.id} 
                    onClick={() => setActivePreview(file)}
                    className="group flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-violet-200 dark:hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-lg shrink-0 transition-transform group-hover:scale-105 ${styles.bg} ${styles.text}`}>
                        <FileText className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>Saved {file.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => deleteMaterial(file.id, e)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 dark:text-slate-700 dark:hover:text-rose-400 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                        title="Delete from bank"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                      <button 
                        className="p-1.5 text-slate-300 group-hover:text-violet-500 dark:text-slate-700 dark:group-hover:text-violet-400 rounded-md hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all"
                        title="Preview Material"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Infographic Pipeline Channels */}
      <div className="w-full bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Pipeline Mechanism Channels</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Step 1 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-violet-600 text-white font-black text-[10px] shadow-sm">
                1
              </span>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-300 tracking-tight">Cloud Ingestion</h5>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pl-7.5 leading-relaxed">
              Upload notes, slides, or textbooks. File records lock securely inside remote buckets.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-violet-600 text-white font-black text-[10px] shadow-sm">
                2
              </span>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-300 tracking-tight">File Bank Catalog</h5>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pl-7.5 leading-relaxed">
              Your assets persist permanently inside your personal File Bank repository for quick reference anytime.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 rounded bg-violet-600 text-white font-black text-[10px] shadow-sm">
                3
              </span>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-300 tracking-tight">Adaptive Learning</h5>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pl-7.5 leading-relaxed">
              Open your smart dashboard or quiz systems to dynamically spin up questions from saved documents.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}