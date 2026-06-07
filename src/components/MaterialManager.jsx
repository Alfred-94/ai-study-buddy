import React from "react";
import { useApp } from "../context/AppContext";
import { FileText, Trash2, Plus, Link as LinkIcon, Eye } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function MaterialManager() {
  const { materials, setMaterials, activePreview, setActivePreview } = useApp();

  const handleTriggerUploadTab = () => {
    alert("Navigating to file repository. Please drop your files on the 'Upload Materials' tab to save them here.");
  };

  const handleDeleteFile = async (e, fileId, fileName) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${fileName}" from your study vault?`);
    if (!confirmDelete) return;

    try {
      const { error: storageError } = await supabase.storage.from("study_materials").remove([fileName]);
      if (storageError) console.warn("Storage deletion warning:", storageError.message);

      const { error: dbError } = await supabase.from("materials").delete().eq("id", fileId);
      if (dbError) console.warn("Database row deletion warning:", dbError.message);

      setMaterials((prev) => prev.filter((item) => item.id !== fileId));
      if (activePreview?.name === fileName) setActivePreview(null);

      alert("File successfully deleted.");
    } catch (err) {
      console.error("Lifecycle erasure failure:", err);
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 p-6 flex flex-col h-[390px]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900 tracking-tight">Connected Vault</h3>
          <p className="text-gray-400 text-xs font-medium">Review notes or link elements to the AI Coach</p>
        </div>
        <span className="text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full font-bold">
          {materials?.length || 0} Files
        </span>
      </div>

      <div 
        onClick={handleTriggerUploadTab}
        className="border-2 border-dashed border-slate-200 hover:border-violet-400 bg-slate-50/50 hover:bg-violet-50/30 rounded-2xl p-3 text-center cursor-pointer transition-all mb-4 group"
      >
        <div className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center mx-auto text-slate-400 group-hover:text-violet-600 transition-transform shadow-sm">
          <Plus size={14} />
        </div>
        <p className="text-xs font-bold text-slate-600 mt-1.5">Click to add PDFs or notes</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {materials && materials.length > 0 ? (
          materials.map((file) => {
            const isCurrentlyLinked = activePreview?.name === file.name;
            return (
              <div
                key={file.id}
                className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                  isCurrentlyLinked 
                    ? "bg-violet-50/80 border-violet-300 shadow-sm" 
                    : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50/60"
                }`}
              >
                {/* File Details Line Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCurrentlyLinked ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-600"}`}>
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate text-gray-900">
                      {file.name}
                    </h4>
                    <p className="text-[10px] mt-0.5 text-gray-400">
                      {file.size || "Calculated size"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteFile(e, file.id, file.name)}
                    className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                    title="Delete file item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* TWO ACTION ACCORDION BUTTON ROW CONTROLS */}
                <div className="grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-slate-100">
                  {/* Left Button Side: Launches full browser slides/view previews */}
                  <button
                    type="button"
                    onClick={() => {
                      if(file.url) {
                        window.open(file.url, '_blank');
                      } else {
                        alert("Storage link unavailable.");
                      }
                    }}
                    className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye size={12} /> View Slides
                  </button>

                  {/* Right Button Side: Handles linking document directly to the coach */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isCurrentlyLinked) {
                        setActivePreview(null); // Disconnect on click if active
                      } else {
                        setActivePreview({ name: file.name, url: file.url, size: file.size });
                      }
                    }}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                      isCurrentlyLinked
                        ? "bg-red-500 text-white shadow-sm"
                        : "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                    }`}
                  >
                    {isCurrentlyLinked ? (
                      <>✕ Unlink</>
                    ) : (
                      <><LinkIcon size={12} /> Link to Coach</>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center pb-6">
            <p className="text-xs text-slate-400 font-medium">Your global vault is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}