import { NextResponse } from "next/server";
import { askJSON } from "@/lib/ai/groq";

const SYSTEM_FILES = `
Eres un experto en arquitectura de proyectos de programación.
Tu tarea es generar la estructura de archivos correcta para un reto de programación.

RESPONDE EXCLUSIVAMENTE EN JSON con esta estructura:

{
  "files": [
    {
      "filename": "nombre-del-archivo.ext",
      "language": "typescript|javascript|html|css|python|etc",
      "placeholder": "comentario inicial que guía al estudiante",
      "required": true|false,
      "description": "qué debe contener este archivo"
    }
  ]
}

REGLAS POR TECNOLOGÍA:

Angular (TypeScript):
- Siempre genera: component.ts, component.html, component.css
- El .ts es el principal (required: true)
- Incluye imports y estructura básica del decorador @Component en el placeholder

React (JSX/TSX):
- Genera: App.jsx o Component.jsx
- Si pide estilos: App.css
- Placeholder con import React si es JSX puro

JavaScript puro:
- Solo: solution.js
- Placeholder simple con comentario de la función a implementar

TypeScript puro:
- Solo: solution.ts
- Placeholder con tipos básicos si aplica

Python:
- Solo: solution.py
- Placeholder con def o class según el reto

Vue:
- Genera: Component.vue (Single File Component)
- Placeholder con <template>, <script setup>, <style>

Node.js / Express:
- Genera: index.js o server.js
- Placeholder con imports y estructura básica

CSS puro:
- Genera: styles.css + index.html
- Placeholder con estructura HTML básica si es necesario

IMPORTANTE:
- El placeholder debe ser útil, no vacío
- Para Angular, incluye la estructura mínima del decorador pero SIN el contenido que el estudiante debe agregar
- Nunca incluyas la solución, solo la estructura de arranque
- Si el reto es beginner, el placeholder puede tener más estructura inicial
- Si es advanced, el placeholder puede ser más vacío para que el estudiante lo construya

EJEMPLOS DE PLACEHOLDERS:

Angular beginner (Imprimir en consola):
// component.ts placeholder:
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-solution',
  templateUrl: './component.html',
  styleUrls: ['./component.css']
})
export class SolutionComponent implements OnInit {
  
  constructor() { }

  ngOnInit(): void {
    // Escribe tu código aquí
  }
}

JavaScript beginner (Sumar números):
// solution.js placeholder:
// Completa la función para sumar dos números
function suma(a, b) {
  // Tu código aquí
}

Python beginner:
# Completa la función
def suma(a, b):
    # Tu código aquí
    pass
`;

// Mapa de tecnologías a sus archivos por defecto (fallback)
const DEFAULT_FILES = {
  angular: [
    {
      filename: "component.ts",
      language: "typescript",
      placeholder: `import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-solution',
  templateUrl: './component.html',
  styleUrls: ['./component.css']
})
export class SolutionComponent implements OnInit {
  
  constructor() { }

  ngOnInit(): void {
    // Tu código aquí
  }
}`,
      required: true,
      description: "Lógica del componente Angular",
    },
    {
      filename: "component.html",
      language: "html",
      placeholder: `<!-- Template del componente -->
<div class="container">
  <!-- Tu HTML aquí -->
</div>`,
      required: false,
      description: "Template HTML del componente",
    },
    {
      filename: "component.css",
      language: "css",
      placeholder: `/* Estilos del componente */
.container {
  /* Tu CSS aquí */
}`,
      required: false,
      description: "Estilos del componente",
    },
  ],
  react: [
    {
      filename: "App.jsx",
      language: "javascript",
      placeholder: `import { useState } from 'react';

export default function App() {
  // Tu código aquí
  
  return (
    <div>
      {/* Tu JSX aquí */}
    </div>
  );
}`,
      required: true,
      description: "Componente React principal",
    },
  ],
  javascript: [
    {
      filename: "solution.js",
      language: "javascript",
      placeholder: `// Escribe tu solución aquí

`,
      required: true,
      description: "Archivo de solución JavaScript",
    },
  ],
  typescript: [
    {
      filename: "solution.ts",
      language: "typescript",
      placeholder: `// Escribe tu solución aquí

`,
      required: true,
      description: "Archivo de solución TypeScript",
    },
  ],
  python: [
    {
      filename: "solution.py",
      language: "python",
      placeholder: `# Escribe tu solución aquí

`,
      required: true,
      description: "Archivo de solución Python",
    },
  ],
  vue: [
    {
      filename: "Component.vue",
      language: "vue",
      placeholder: `<template>
  <div>
    <!-- Tu template aquí -->
  </div>
</template>

<script setup>
// Tu lógica aquí
</script>

<style scoped>
/* Tus estilos aquí */
</style>`,
      required: true,
      description: "Single File Component de Vue",
    },
  ],
};

function getDefaultFiles(language) {
  const lang = language?.toLowerCase();
  if (lang?.includes("angular")) return DEFAULT_FILES.angular;
  if (lang?.includes("react")) return DEFAULT_FILES.react;
  if (lang?.includes("vue")) return DEFAULT_FILES.vue;
  if (lang?.includes("python")) return DEFAULT_FILES.python;
  if (lang?.includes("typescript") || lang?.includes("ts")) return DEFAULT_FILES.typescript;
  return DEFAULT_FILES.javascript;
}

export async function POST(req) {
  try {
    const { challenge } = await req.json();

    if (!challenge) {
      return NextResponse.json(
        { error: "challenge es requerido" },
        { status: 400 }
      );
    }

    const userPrompt = {
      titulo: challenge.title,
      descripcion: challenge.description,
      lenguaje: challenge.language,
      dificultad: challenge.difficulty,
      conceptos: challenge.concepts,
      instruccion: `Genera los archivos necesarios para que el estudiante resuelva este reto de ${challenge.language}.
      El reto es: "${challenge.title}".
      El estudiante debe escribir desde cero el contenido de cada archivo.
      El placeholder debe guiar sin dar la solución.`,
    };

    let result;
    try {
      result = await askJSON({
        system: SYSTEM_FILES,
        user: userPrompt,
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
      });
    } catch (error) {
      console.log("Error generando archivos, usando fallback:", error.message);
      result = { files: getDefaultFiles(challenge.language) };
    }

    if (!result?.files || !Array.isArray(result.files) || result.files.length === 0) {
      result = { files: getDefaultFiles(challenge.language) };
    }

    // Normalizar y validar cada archivo
    const files = result.files.map((file, index) => ({
      id: `file-${index}-${Date.now()}`,
      filename: file.filename || `file-${index + 1}.js`,
      language: file.language || "javascript",
      placeholder: file.placeholder || "// Escribe tu código aquí\n",
      content: file.placeholder || "// Escribe tu código aquí\n", // contenido inicial = placeholder
      required: file.required ?? index === 0,
      description: file.description || "",
    }));

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("Error generando archivos:", error);
    return NextResponse.json(
      { error: "No se pudieron generar los archivos", details: error.message },
      { status: 500 }
    );
  }
}