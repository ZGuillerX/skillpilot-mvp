import React from "react";
import MonacoEditor from "@monaco-editor/react";

// Definición de temas personalizados (colores básicos)
const customThemes = {
  dracula: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "f8f8f2", background: "282a36" },
      { token: "comment", foreground: "6272a4" },
      { token: "string", foreground: "f1fa8c" },
      { token: "keyword", foreground: "ff79c6" },
      { token: "number", foreground: "bd93f9" },
      { token: "identifier", foreground: "50fa7b" },
    ],
    colors: {
      "editor.background": "#282a36",
      "editor.foreground": "#f8f8f2",
    },
  },
  monokai: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "f8f8f2", background: "272822" },
      { token: "comment", foreground: "75715e" },
      { token: "string", foreground: "e6db74" },
      { token: "keyword", foreground: "f92672" },
      { token: "number", foreground: "ae81ff" },
      { token: "identifier", foreground: "a6e22e" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
    },
  },
  "github-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0d1117",
      "editor.foreground": "#c9d1d9",
    },
  },
  "github-light": {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#fff",
      "editor.foreground": "#24292f",
    },
  },
  "solarized-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#002b36",
      "editor.foreground": "#839496",
    },
  },
  "solarized-light": {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#fdf6e3",
      "editor.foreground": "#657b83",
    },
  },
  onedark: {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#282c34",
      "editor.foreground": "#abb2bf",
    },
  },
  nord: {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#2e3440",
      "editor.foreground": "#d8dee9",
    },
  },
};

const Editor = ({
  height = "400px",
  language = "javascript",
  value = "",
  onChange = () => {},
  theme = "vs-dark",
}) => {
  // Registrar temas personalizados antes de montar el editor
  const handleBeforeMount = (monaco) => {
    Object.entries(customThemes).forEach(([name, data]) => {
      try {
        monaco.editor.defineTheme(name, data);
      } catch (e) {
        // Si ya está definido, ignorar
      }
    });
  };
  return (
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      theme={theme}
      beforeMount={handleBeforeMount}
      options={{
        fontSize: 16,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
      }}
    />
  );
};

export default Editor;
