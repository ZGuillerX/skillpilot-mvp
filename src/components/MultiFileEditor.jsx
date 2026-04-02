"use client";

import { useState, useCallback } from "react";
import Editor from "@/components/Editor";

const FILE_ICONS = {
  typescript: "󰛦",
  javascript: "󰌞",
  html: "󰌝",
  css: "󰌜",
  python: "󰌠",
  vue: "󰡄",
  jsx: "󰜈",
  default: "󰈙",
};

const FILE_COLORS = {
  typescript: "#3178c6",
  javascript: "#f7df1e",
  html: "#e34f26",
  css: "#1572b6",
  python: "#3776ab",
  vue: "#42b883",
  jsx: "#61dafb",
  default: "#888",
};

function getFileIcon(language) {
  return FILE_ICONS[language?.toLowerCase()] || FILE_ICONS.default;
}

function getFileColor(language) {
  return FILE_COLORS[language?.toLowerCase()] || FILE_COLORS.default;
}

function getFileStatusIcon(status) {
  if (status === "ok") return { icon: "✓", color: "#4ade80" };
  if (status === "warning") return { icon: "⚠", color: "#fbbf24" };
  if (status === "error") return { icon: "✗", color: "#f87171" };
  return null;
}

export default function MultiFileEditor({
  files,
  onFilesChange,
  language,
  theme = "vs-dark",
  filesFeedback = [],
  isLoading = false,
}) {
  const [activeFileId, setActiveFileId] = useState(files?.[0]?.id || null);

  const activeFile = files?.find((f) => f.id === activeFileId) || files?.[0];

  const handleCodeChange = useCallback(
    (newCode) => {
      if (!activeFile) return;
      const updated = files.map((f) =>
        f.id === activeFile.id ? { ...f, content: newCode } : f
      );
      onFilesChange(updated);
    },
    [activeFile, files, onFilesChange]
  );

  const getFeedbackForFile = (filename) => {
    return filesFeedback?.find((fb) => fb.filename === filename);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Generando archivos...</p>
        </div>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
        <p className="text-sm text-gray-500">No hay archivos disponibles</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab Bar */}
      <div className="flex-shrink-0 flex items-stretch bg-[#252526] border-b border-[#1e1e1e] overflow-x-auto scrollbar-none">
        {files.map((file) => {
          const isActive = file.id === activeFile?.id;
          const feedback = getFeedbackForFile(file.filename);
          const statusInfo = feedback ? getFileStatusIcon(feedback.status) : null;
          const color = getFileColor(file.language);

          return (
            <button
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              title={file.description || file.filename}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-xs font-medium
                border-r border-[#1e1e1e] whitespace-nowrap
                transition-all duration-150 relative
                ${isActive
                  ? "bg-[#1e1e1e] text-white"
                  : "bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200"
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ backgroundColor: color }}
                />
              )}

              {/* Dot de color del lenguaje */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />

              <span>{file.filename}</span>

              {/* Badge required */}
              {file.required && (
                <span className="text-[9px] px-1 py-0.5 bg-primary/20 text-primary rounded font-semibold">
                  principal
                </span>
              )}

              {/* Status feedback icon */}
              {statusInfo && (
                <span
                  className="text-xs font-bold ml-1"
                  style={{ color: statusInfo.color }}
                  title={feedback.comment}
                >
                  {statusInfo.icon}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* File description bar */}
      {activeFile?.description && (
        <div className="flex-shrink-0 px-4 py-1.5 bg-[#252526] border-b border-[#1e1e1e]">
          <p className="text-[11px] text-gray-500">{activeFile.description}</p>
          {/* Feedback inline del archivo activo */}
          {(() => {
            const fb = getFeedbackForFile(activeFile.filename);
            if (!fb) return null;
            const si = getFileStatusIcon(fb.status);
            return (
              <p
                className="text-[11px] mt-0.5 font-medium"
                style={{ color: si?.color }}
              >
                {si?.icon} {fb.comment}
              </p>
            );
          })()}
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          key={activeFile?.id} // Re-monta el editor al cambiar de archivo
          language={activeFile?.language?.toLowerCase() || "javascript"}
          value={activeFile?.content || ""}
          onChange={handleCodeChange}
          height="100%"
          theme={theme}
        />
      </div>
    </div>
  );
}