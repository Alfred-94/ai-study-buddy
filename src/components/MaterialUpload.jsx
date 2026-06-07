import React, { useState } from "react";
import { 
  Upload, 
  FileText, 
  Trash2,
  ChevronRight,
  Eye
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useApp } from "../context/AppContext";

export default function MaterialUpload({ userId }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Consume global reactive state engines cleanly from Context Provider
  const { materials, setMaterials, setActivePreview } = useApp();

  // Helper utility to style file icons individually by type extension
  const getFileIconStyles = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return { bg: 'bg-rose-50', text: 'text-rose-500' };
    if (ext === 'docx' || ext === 'doc') return { bg: 'bg-blue-50', text: 'text-blue-500' };
    if (ext === 'pptx' || ext === 'ppt') return { bg: 'bg-amber-50', text: 'text-amber-500' };
    return { bg: 'bg-indigo-50', text: 'text-indigo-500' };
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
        alert(`"${file.name}" is too large! It is ${currentSizeMB}MB, but the maximum upload limit is 45MB.`);
        continue; 
      }

      try {
        const cleanName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

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

        // 🚀 Automatically awaken visual dashboard preview frames instantly on upload completion
        setActivePreview(materialRecord);

      } catch (err) {
        console.error("Storage upload exception caught:", err.message);
        alert(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    if (uploadedFiles.length > 0) {
      setMaterials((prev) => [...(prev || []), ...uploadedFiles]);
    }
    
    setUploading(false);
  };

  // 🗑 Asset Deletion Flow
  const deleteMaterial = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this study material?")) return;
    try {
      const { error } = await supabase.storage
        .from("study-materials")
        .remove([id]);

      if (error) throw error;

      setMaterials((prev) => (prev || []).filter((item) => item.id !== id));
      
      // Clear active file previews dynamically if active file is deleted
      setActivePreview(null);
    } catch (err) {
      console.error("Delete failed:", err.message);
      alert("Could not remove the asset from remote cloud nodes.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-2 font-sans text-slate-700">
      {/* Dynamic Header Titles */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upload Your Study Materials</h1>
        <p className="text-slate-400 mt-1 text-[15px]">Upload any documents and let AI help you learn better.</p>
      </div>
      {/* Side-by-Side Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Side: Drag & Drop Area */}
        <div className="lg:col-span-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
            className={`border border-dashed rounded-2xl h-[380px] p-8 flex flex-col items-center justify-center transition-all bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${
              isDragging ? "border-violet-500 scale-[1.01] bg-violet-50/20" : "border-slate-200"
            }`}
          >
            <div className="text-violet-500 mb-5 transition-transform duration-300 hover:scale-110">
              <Upload className="w-14 h-14 stroke-[1.25]" />
            </div>
            
            <p className="text-slate-800 font-semibold text-lg tracking-tight">
              {uploading ? "Uploading directly to Supabase..." : "Drag & drop your files here"}
            </p>
            <p className="text-slate-400 text-sm mt-1">or</p>
            
            <label className="mt-5 px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-violet-100 cursor-pointer transition-all active:scale-[0.98]">
              Choose Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
            
            <p className="text-xs text-slate-400 font-medium mt-8 tracking-wide">
              Supports PDF, DOCX, PPTX, TXT (Max 45MB)
            </p>
          </div>
        </div>

        {/* Right Side: Uploaded Materials Index Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-slate-800 font-bold text-lg tracking-tight">Uploaded Materials</h3>
          
          <div className="space-y-3 max-h-[335px] overflow-y-auto pr-1">
            {(!materials || materials.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-12 border border-slate-100 rounded-2xl bg-white text-center text-sm text-slate-400 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                <FileText className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                No active resources indexed yet.<br />Upload a document to start studying.
              </div>
            ) : (
              materials.map((file) => {
                const styles = getFileIconStyles(file.name);
                return (
                  <div 
                    key={file.id} 
                    onClick={() => setActivePreview(file)}
                    className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.015)] hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-3 ${styles.bg} ${styles.text} rounded-xl shrink-0 transition-transform group-hover:scale-105}`}>
                        <FileText className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-slate-800 truncate pr-2 tracking-tight group-hover:text-violet-600 transition-colors">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-0.5">

                        <span>{file.size}</span>
                          <span>•</span>
                          <span>Uploaded {file.uploadedAt}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => deleteMaterial(file.id, e)}
                        className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all duration-150"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2]" />
                      </button>
                      <button 
                        className="p-2 text-slate-300 group-hover:text-violet-500 rounded-lg hover:bg-violet-50 transition-all"
                        title="Preview Material"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Infographic "How It Works" Flowchart Banner */}
      <div className="w-full bg-slate-50/60 border border-slate-100 rounded-2xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.01)]">
        <h4 className="text-[15px] font-bold text-slate-900 tracking-tight mb-5">How it works?</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-600 text-white font-semibold text-xs shadow-sm shadow-violet-200">
                1
              </span>
              <h5 className="text-sm font-bold text-slate-800 tracking-tight">Upload</h5>
            </div>
            <p className="text-xs text-slate-400 font-medium pl-9 leading-relaxed">
              Upload your materials in any format.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-600 text-white font-semibold text-xs shadow-sm shadow-violet-200">
                2
              </span>
              <h5 className="text-sm font-bold text-slate-800 tracking-tight">AI Processes</h5>
            </div>
            <p className="text-xs text-slate-400 font-medium pl-9 leading-relaxed">
              Our AI analyzes and understands.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-600 text-white font-semibold text-xs shadow-sm shadow-violet-200">
                3
              </span>
              <h5 className="text-sm font-bold text-slate-800 tracking-tight">Smart Learning</h5>
            </div>
            <p className="text-xs text-slate-400 font-medium pl-9 leading-relaxed">
              Get quizzes, summaries & insights.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}