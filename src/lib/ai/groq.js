import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, 
});

// Utilidad para pedir “solo JSON” y tener fallback si el modelo habla de más
export async function askJSON({
  system,
  user,
  model = "llama-3.1-8b-instant",
}) {
  const res = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) },
    ],
    temperature: 0.3,
  });

  const content = res?.choices?.[0]?.message?.content || "{}";

  try {
    return JSON.parse(content);
  } catch {
    // Fallback: intenta extraer el primer bloque JSON “grande”
    const first = content.indexOf("{");
    const last = content.lastIndexOf("}");
    if (first !== -1 && last !== -1) {
      try {
        return JSON.parse(content.slice(first, last + 1));
      } catch {}
    }
    return {};
  }
}
