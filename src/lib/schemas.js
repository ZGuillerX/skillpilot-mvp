import { z } from "zod";

// Schema para validar retos
export const challengeSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "El título es requerido"),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    language: z.string().min(1, "El lenguaje es requerido"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    acceptanceCriteria: z.array(z.string()).min(1, "Debe haber al menos un criterio"),
    hints: z.array(z.string()),
    exampleInput: z.string().nullable().optional(),
    exampleOutput: z.string().nullable().optional(),
    concepts: z.array(z.string()),
    estimatedTimeMinutes: z.number().positive(),
});

// Schema para validar plan de aprendizaje
export const learningPlanSchema = z.object({
    goal: z.string().min(5, "El objetivo debe tener al menos 5 caracteres"),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    language: z.string().min(1, "El lenguaje es requerido"),
    savedAt: z.string().optional(),
});

// Schema para validar usuario
export const userSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Schema para login
export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "La contraseña es requerida"),
});

// Schema para evaluación de código
export const evaluationSchema = z.object({
    success: z.boolean(),
    score: z.number().min(0).max(100),
    feedback: z.string(),
    suggestions: z.array(z.string()),
});
