"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent,
  Undo, Redo, RemoveFormatting, Code,
  Type, Highlighter, ChevronDown, Quote,
  Link as LinkIcon, Unlink, Image as ImageIcon, 
  Video, Minus, Subscript, Superscript,
  Info
} from "lucide-react";

// ✅ Import Media Library
import MediaLibrary from "@/components/admin/media/MediaLibrary";

export interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  height?: string;
  placeholder?: string;
}

export default function RichTextEditor({ 
  initialContent = "", 
  onChange, 
  height = "h-[600px]",
  placeholder = "Start writing..."
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [html, setHtml] = useState(initialContent);
  const [showCode, setShowCode] = useState(false);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [blockType, setBlockType] = useState("p");

  // Media Library State
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  useEffect(() => {
    if (editorRef.current && initialContent && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent;
    }
  }, []); // eslint-disable-line

  const handleInput = () => {
    if (!editorRef.current) return;
    const newHtml = editorRef.current.innerHTML;
    setHtml(newHtml);
    if (onChange) onChange(newHtml);
    checkFormats();
  };

  const handleSelectionChange = () => {
    checkFormats();
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // --- INSERTS ---
  const addLink = () => { const url = prompt("Enter URL:"); if (url) exec("createLink", url); };
  
  const addVideo = () => {
    const url = prompt("Enter Video URL (YouTube embed link):");
    if (url) {
      const embedHtml = `<iframe width="560" height="315" src="${url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><p><br/></p>`;
      exec("insertHTML", embedHtml);
    }
  };

  const addInfoBox = () => {
    const boxHtml = `<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; margin: 1rem 0; border-radius: 0.25rem;"><p style="margin: 0; color: #1e40af; font-weight: bold;">💡 Pro Tip:</p><p style="margin: 0.5rem 0 0 0; color: #1e3a8a;">Write your tip here...</p></div><p><br/></p>`;
    exec("insertHTML", boxHtml);
  };

  const addQuoteBox = () => {
    const quoteHtml = `<blockquote style="background-color: #f8fafc; border-left: 4px solid #94a3b8; padding: 1rem; margin: 1rem 0; border-radius: 0.25rem; font-style: italic; color: #475569;">"Insert your quote here..."</blockquote><p><br/></p>`;
    exec("insertHTML", quoteHtml);
  };

  const checkFormats = () => {
    const formats: string[] = [];
    ["bold", "italic", "underline", "strikeThrough", "subscript", "superscript",
     "justifyLeft", "justifyCenter", "justifyRight", "justifyFull", 
     "insertUnorderedList", "insertOrderedList"].forEach(cmd => {
      if (document.queryCommandState(cmd)) formats.push(cmd);
    });
    setActiveFormats(formats);
    setBlockType(document.queryCommandValue("formatBlock") || "p");
  };

  const isActive = (cmd: string) => activeFormats.includes(cmd);

  return (
    <div className={`theme-bg theme-border border rounded-xl overflow-hidden flex flex-col shadow-sm ${height} animate-in fade-in`}>
      
      {/* TOOLBAR */}
      <div className="theme-bg border-b theme-border p-2 flex flex-wrap gap-1 items-center shrink-0 sticky top-0 z-20">
        
        {/* History */}
        <ToolButton onClick={() => exec("undo")} icon={Undo} tooltip="Undo" />
        <ToolButton onClick={() => exec("redo")} icon={Redo} tooltip="Redo" />
        <Separator />

        {/* Headings */}
        <div className="relative group mx-1">
          <select 
            className="appearance-none bg-transparent text-xs font-bold text-primary pl-2 pr-6 py-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 outline-none cursor-pointer border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all w-28"
            value={blockType}
            onChange={(e) => exec("formatBlock", e.target.value)}
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote</option>
            <option value="pre">Code Block</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
        </div>
        <Separator />

        {/* Styles */}
        <ToolButton onClick={() => exec("bold")} icon={Bold} active={isActive("bold")} tooltip="Bold" />
        <ToolButton onClick={() => exec("italic")} icon={Italic} active={isActive("italic")} tooltip="Italic" />
        <ToolButton onClick={() => exec("underline")} icon={Underline} active={isActive("underline")} tooltip="Underline" />
        <ToolButton onClick={() => exec("strikeThrough")} icon={Strikethrough} active={isActive("strikeThrough")} tooltip="Strikethrough" />
        <Separator />
        
        {/* Colors */}
        <div className="flex items-center gap-1">
           <div className="relative group" title="Text Color">
              <label className="cursor-pointer p-1.5 rounded-md text-secondary hover:bg-slate-200 dark:hover:bg-white/10 hover:text-primary flex items-center justify-center">
                 <Type size={16} />
                 <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => exec("foreColor", e.target.value)} />
              </label>
           </div>
           <div className="relative group" title="Highlight Color">
              <label className="cursor-pointer p-1.5 rounded-md text-secondary hover:bg-slate-200 dark:hover:bg-white/10 hover:text-primary flex items-center justify-center">
                 <Highlighter size={16} />
                 <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => exec("hiliteColor", e.target.value)} />
              </label>
           </div>
        </div>
        <Separator />

        {/* Alignment */}
        <ToolButton onClick={() => exec("justifyLeft")} icon={AlignLeft} active={isActive("justifyLeft")} tooltip="Align Left" />
        <ToolButton onClick={() => exec("justifyCenter")} icon={AlignCenter} active={isActive("justifyCenter")} tooltip="Center" />
        <ToolButton onClick={() => exec("insertUnorderedList")} icon={List} active={isActive("insertUnorderedList")} tooltip="Bullet List" />
        <ToolButton onClick={() => exec("insertOrderedList")} icon={ListOrdered} active={isActive("insertOrderedList")} tooltip="Numbered List" />
        <Separator />

        {/* Media */}
        <ToolButton onClick={addLink} icon={LinkIcon} tooltip="Insert Link" />
        <ToolButton onClick={() => exec("unlink")} icon={Unlink} tooltip="Remove Link" />
        
        {/* ✅ MEDIA LIBRARY BUTTON */}
        <ToolButton 
           onClick={() => setShowMediaLibrary(true)} 
           icon={ImageIcon} 
           tooltip="Open Media Library" 
        />

        <ToolButton onClick={addVideo} icon={Video} tooltip="Embed Video" />
        <ToolButton onClick={() => exec("insertHorizontalRule")} icon={Minus} tooltip="Horizontal Line" />
        <Separator />

        {/* Special Blocks */}
        <ToolButton onClick={addInfoBox} icon={Info} tooltip="Insert Info Box" />
        <ToolButton onClick={addQuoteBox} icon={Quote} tooltip="Insert Styled Quote" />

        <Separator />
        <ToolButton onClick={() => exec("removeFormat")} icon={RemoveFormatting} tooltip="Clear Formatting" />

        <div className="flex-1"></div>
        <button 
          onClick={() => setShowCode(!showCode)} 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${showCode ? "bg-blue-600 text-white" : "text-secondary hover:bg-slate-200 dark:hover:bg-white/10"}`}
        >
          <Code size={14} /> {showCode ? "Visual" : "HTML"}
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 relative theme-bg overflow-hidden">
        {showCode ? (
          <textarea 
            className="w-full h-full p-6 font-mono text-xs leading-relaxed outline-none text-primary bg-transparent resize-none overflow-y-auto"
            value={html}
            onChange={(e) => {
              setHtml(e.target.value);
              if (onChange) onChange(e.target.value);
            }}
          />
        ) : (
          <div 
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            className="w-full h-full p-8 outline-none prose dark:prose-invert max-w-none overflow-y-auto text-primary"
            style={{ minHeight: "100%", wordWrap: "break-word" }}
            suppressContentEditableWarning
          />
        )}
      </div>

      {/* ✅ MEDIA LIBRARY MODAL */}
      {showMediaLibrary && (
        <MediaLibrary 
          isModal={true} 
          onClose={() => setShowMediaLibrary(false)}
          onSelect={(url) => {
            exec("insertImage", url);
            setShowMediaLibrary(false);
          }}
        />
      )}

    </div>
  );
}

// --- HELPER COMPONENTS ---

const Separator = () => <div className="w-px h-5 bg-slate-300 dark:bg-white/10 mx-1"></div>;

const ToolButton = ({ onClick, icon: Icon, active, tooltip }: any) => (
  <button 
    onClick={onClick} 
    title={tooltip}
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    className={`p-1.5 rounded-md transition-all ${
      active 
        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
        : "text-secondary hover:bg-slate-200 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-blue-500"
    }`}
  >
    <Icon size={16} />
  </button>
);