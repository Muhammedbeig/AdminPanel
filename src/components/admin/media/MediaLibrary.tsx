"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Folder, FileImage, Upload, Plus, 
  Search, Check, Image as ImageIcon, X, 
  ChevronRight, Home, RotateCw, MoreVertical,
  Edit2, Trash2
} from "lucide-react";

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

type Breadcrumb = { id: number; name: string };

export default function MediaLibrary({ 
  onSelect, 
  onClose, 
  isModal = true 
}: MediaLibraryProps) {
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  // Context Menu State
  const [menu, setMenu] = useState<{ x: number, y: number, type: 'file' | 'folder', id: number, name: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchMedia = (folderId: number | null) => {
    setLoading(true);
    fetch(`/api/admin/media?folderId=${folderId || ""}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setFolders(data.folders);
          setFiles(data.files);
          setBreadcrumbs(data.breadcrumbs || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedia(currentFolder);
  }, [currentFolder]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleRefresh = () => fetchMedia(currentFolder);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (currentFolder) fd.append("folderId", currentFolder.toString());
    await fetch("/api/admin/media", { method: "POST", body: fd });
    setUploading(false);
    fetchMedia(currentFolder); 
  };

  const createFolder = async () => {
    const name = prompt("Folder Name:");
    if (!name) return;
    const fd = new FormData();
    fd.append("type", "folder");
    fd.append("name", name);
    if (currentFolder) fd.append("parentId", currentFolder.toString());
    await fetch("/api/admin/media", { method: "POST", body: fd });
    fetchMedia(currentFolder);
  };

  const handleRename = async () => {
    if (!menu) return;
    const newName = prompt("Rename to:", menu.name);
    if (!newName || newName === menu.name) return;

    await fetch("/api/admin/media", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: menu.id, type: menu.type, name: newName }),
    });
    setMenu(null);
    fetchMedia(currentFolder);
  };

  const handleDelete = async () => {
    if (!menu) return;
    if (!confirm(`Are you sure you want to delete this ${menu.type}? This cannot be undone.`)) return;

    await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: menu.id, type: menu.type }),
    });
    setMenu(null);
    fetchMedia(currentFolder);
  };

  const onContextMenu = (e: React.MouseEvent, type: 'file' | 'folder', id: number, name: string) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, type, id, name });
  };

  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(search.toLowerCase()));
  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  // --- STYLING ---
  const WrapperClass = isModal 
    ? "fixed inset-0 z-[60] bg-black/50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in"
    : "w-full h-full flex flex-col animate-in fade-in";

  const ContainerClass = isModal
    ? "theme-bg w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border theme-border"
    : "flex-1 flex flex-col theme-bg border theme-border rounded-xl overflow-hidden shadow-sm h-[calc(100vh-140px)]";

  return (
    <div className={WrapperClass}>
      <div className={ContainerClass}>
        
        {/* HEADER & BREADCRUMBS */}
        <div className="p-4 border-b theme-border flex items-center justify-between theme-bg">
          <div className="flex items-center gap-2 overflow-hidden">
            <button 
              onClick={() => setCurrentFolder(null)}
              className={`flex items-center gap-1 text-sm font-bold px-2 py-1.5 rounded-lg transition-colors ${currentFolder === null ? "text-primary bg-slate-100 dark:bg-white/10" : "text-secondary hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary"}`}
            >
              <Home size={16} /> <span className="hidden sm:inline">Home</span>
            </button>
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={14} className="text-secondary opacity-50 shrink-0" />
                <button 
                  onClick={() => setCurrentFolder(crumb.id)}
                  className={`text-sm font-bold px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    crumb.id === currentFolder 
                      ? "text-primary bg-slate-100 dark:bg-white/10" 
                      : "text-secondary hover:text-blue-500 hover:underline"
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-4 shrink-0">
             <button 
               onClick={handleRefresh}
               className="p-2 text-secondary hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
               title="Refresh"
             >
               <RotateCw size={18} />
             </button>
            {isModal && onClose && (
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-secondary transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="p-4 border-b theme-border flex flex-wrap gap-4 items-center justify-between theme-bg">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              {uploading ? "Uploading..." : <><Upload size={16} /> Upload</>}
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            <button 
              onClick={createFolder}
              className="px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-primary rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border theme-border active:scale-95"
            >
              <Plus size={16} /> Folder
            </button>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-2.5 text-secondary" />
            <input 
              placeholder="Search in this folder..." 
              className="pl-9 pr-4 py-2 rounded-lg theme-bg theme-border border text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50 w-full sm:w-64 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="flex-1 overflow-y-auto p-6 theme-bg relative" onContextMenu={(e) => e.preventDefault()}>
          {loading ? (
            <div className="flex items-center justify-center h-full text-secondary font-bold text-sm animate-pulse">Loading contents...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              
              {/* Folders */}
              {filteredFolders.map(folder => (
                <div 
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  onContextMenu={(e) => onContextMenu(e, 'folder', folder.id, folder.name)}
                  className="group cursor-pointer p-4 theme-bg rounded-xl border theme-border hover:border-blue-500 transition-all flex flex-col items-center justify-center gap-2 aspect-square shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <Folder size={40} className="text-blue-300 dark:text-blue-500/50 group-hover:text-blue-500 fill-current/20 transition-colors" />
                  <span className="text-xs font-bold text-secondary truncate w-full text-center group-hover:text-primary">
                    {folder.name}
                  </span>
                </div>
              ))}

              {/* Files */}
              {filteredFiles.map(file => (
                <div 
                  key={file.id}
                  onClick={() => {
                    if (onSelect) onSelect(file.url);
                    else prompt("File URL:", window.location.origin + file.url);
                  }}
                  onContextMenu={(e) => onContextMenu(e, 'file', file.id, file.filename)}
                  className="group cursor-pointer relative theme-bg rounded-xl border theme-border hover:border-emerald-500 hover:shadow-lg transition-all aspect-square overflow-hidden shadow-sm"
                >
                  {file.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-secondary bg-slate-50 dark:bg-white/5">
                      <FileImage size={32} />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                    <p className="text-[10px] text-white truncate font-medium">{file.filename}</p>
                    <p className="text-[9px] text-white/70">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {onSelect && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <Check size={12} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Empty State */}
          {!loading && filteredFolders.length === 0 && filteredFiles.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-secondary opacity-70">
              <div className="p-4 bg-slate-100 dark:bg-white/5 rounded-full mb-3 border theme-border">
                <ImageIcon size={48} className="text-secondary" />
              </div>
              <p className="font-bold text-sm text-primary">No items found</p>
              <p className="text-xs text-secondary mt-1">{search ? "Try a different search term" : "Right click or upload to start"}</p>
            </div>
          )}

          {/* ✅ CONTEXT MENU (FIXED: Dynamic Theme Colors) */}
          {menu && (
            <div 
              ref={menuRef}
              className="fixed z-[70] theme-bg border theme-border rounded-lg shadow-xl w-40 overflow-hidden animate-in fade-in zoom-in-95"
              style={{ top: menu.y, left: menu.x }}
            >
              <div className="px-3 py-2 text-[10px] font-black text-secondary uppercase tracking-widest border-b theme-border bg-slate-100 dark:bg-white/5">
                {menu.type === 'file' ? 'File Actions' : 'Folder Actions'}
              </div>
              <div className="p-1">
                <button 
                  onClick={handleRename} 
                  className="w-full text-left px-3 py-2 text-xs font-bold text-primary hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 rounded-md transition-colors"
                >
                  <Edit2 size={14} /> Rename
                </button>
                <button 
                  onClick={handleDelete} 
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 rounded-md transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}