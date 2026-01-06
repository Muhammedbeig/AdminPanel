"use client";

import React, { useEffect, useState } from "react";
import { ImageMinus, Trash2, CheckCircle2, RefreshCcw } from "lucide-react";
import RoleGuard from "@/components/admin/auth/RoleGuard";

export default function UnusedMediaClient() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);

  const scanMedia = () => {
    setLoading(true);
    fetch("/api/admin/media/unused")
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setMedia(data.media);
          setTotalSize(data.totalSize);
        }
        setLoading(false);
      });
  };

  useEffect(() => { scanMedia(); }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedIds.length === media.length) setSelectedIds([]);
    else setSelectedIds(media.map(m => m.id));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.length} files? This cannot be undone.`)) return;

    setDeleting(true);
    const res = await fetch("/api/admin/media/unused", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds })
    });

    if (res.ok) {
      setMedia(media.filter(m => !selectedIds.includes(m.id)));
      setSelectedIds([]);
      // Recalculate size roughly
      scanMedia();
    } else {
      alert("Failed to delete some files.");
    }
    setDeleting(false);
  };

  return (
    <RoleGuard allowedRoles={["ADMIN", "EDITOR"]}>
      <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-primary flex items-center gap-2">
              <ImageMinus className="text-red-600" /> Unused Media
            </h1>
            <p className="text-sm text-secondary mt-1">
              Scan and clean up files that are not used in any posts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={scanMedia} 
              className="p-2 text-secondary hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              title="Rescan"
            >
              <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            {media.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0 || deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20"
              >
                <Trash2 size={16} /> {deleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="theme-bg theme-border border p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ImageMinus size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-primary">{media.length}</div>
              <div className="text-xs font-bold text-secondary uppercase">Unused Files</div>
            </div>
          </div>
          <div className="theme-bg theme-border border p-4 rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-primary">{formatBytes(totalSize)}</div>
              <div className="text-xs font-bold text-secondary uppercase">Potential Savings</div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="theme-bg theme-border border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-secondary">Scanning database...</div>
          ) : media.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-bold text-primary">System is clean!</h3>
              <p className="text-sm text-secondary mt-1">No unused media files found.</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b theme-border bg-slate-50/50 dark:bg-white/5 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={selectedIds.length === media.length && media.length > 0}
                  onChange={selectAll}
                />
                <span className="text-xs font-bold text-secondary uppercase tracking-widest">Select All</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
                {media.map(file => (
                  <div 
                    key={file.id} 
                    onClick={() => toggleSelect(file.id)}
                    className={`relative group cursor-pointer border rounded-xl overflow-hidden aspect-square transition-all ${
                      selectedIds.includes(file.id) ? "border-blue-500 ring-2 ring-blue-500/20" : "theme-border hover:border-red-400"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-2">
                      <p className="text-[10px] text-white truncate">{file.filename}</p>
                      <p className="text-[9px] text-white/70">{formatBytes(file.size)}</p>
                    </div>
                    <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      selectedIds.includes(file.id) ? "bg-blue-500 text-white" : "bg-black/50 text-white/50"
                    }`}>
                      <CheckCircle2 size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}