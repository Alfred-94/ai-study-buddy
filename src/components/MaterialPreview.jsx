 import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, ExternalLink } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function MaterialPreview() {
  const { activePreview, setActivePreview, accentColor } = useApp();

  if (!activePreview) return null;

  const isPdf = activePreview.name?.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(activePreview.name || "");

  // --- UNIVERSAL STORAGE PATH CLEANER ---
  // Normalizes both bucket names (hyphens) and storage folders (uploads) dynamically
  const getCleanPreviewUrl = (rawUrl) => {
    if (!rawUrl) return "";
    
    let clean = rawUrl;

    // 1. Force the correct hyphenated bucket name string
    if (clean.includes("/study_materials/")) {
      clean = clean.replace("/study_materials/", "/study_materials/");
    }

    // 2. Fix subfolder variations: Map legacy "user_upload" folder paths to your active "uploads" folder
    if (clean.includes("/user_upload/")) {
      clean = clean.replace("/user_upload/", "/uploads/");
    }

    return clean;
  };

  const cleanUrl = getCleanPreviewUrl(activePreview.url);
  // --------------------------------------

  const accentBgs = {
    purple: "bg-[#7C3AED]",
    blue: "bg-blue-500",
    cyan: "bg-cyan-500",
    green: "bg-emerald-500",
    orange: "bg-orange-500",
    pink: "bg-rose-500"
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[32px] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col"
        >
          {/* Top Control Bar header */}
          <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-[#7C3AED] dark:text-purple-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-md md:max-w-xl">
                  {activePreview.name}
                </h3>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                  Size: {activePreview.size} • Uploaded Hub Asset
                </p>
              </div>
            </div>

            {/* Quick Action Buttons array */}
            <div className="flex items-center gap-2">
              <a
                href={cleanUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 text-gray-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 rounded-xl shadow-sm transition"
                title="Open in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setActivePreview(null)}
                className="p-2.5 text-gray-400 hover:text-rose-500 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 rounded-xl shadow-sm transition"
                title="Close Viewport"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Content Render Block Viewport slot */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative p-4 flex items-center justify-center overflow-hidden">
            {isPdf ? (
                <iframe
                src={`${cleanUrl}#toolbar=0`}
                title="Document View Frame"
                className="w-full h-full rounded-2xl border border-gray-200/40 dark:border-slate-800 shadow-inner bg-white"
              />
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center p-2 overflow-auto">
                <img
                  src={cleanUrl}
                  alt="Resource High Fidelity Render"
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-md border border-white dark:border-slate-800"
                />
              </div>
            ) : (
              // Fallback interface UI block for raw files or docx links
              <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 max-w-sm shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center mb-4 text-[#7C3AED]">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">Format Preview Restricted</h4>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-2 leading-relaxed">
                  Direct rendering is optimized for PDFs and Images. You can inspect this data component directly via external modules.
                </p>
                <a
                  href={cleanUrl}
                  download
                  className={`mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md ${accentBgs[accentColor] || "bg-[#7C3AED]"} transition-all active:scale-95`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}