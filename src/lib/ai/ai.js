// Aquí decides qué proveedor usar
import { askJSON as askGroq } from "./groq";
// import { askJSON as askOpenAI } from "./providers/openai.js"; // futuro

export async function askAI(options) {
  // Ahora usa Groq
  return askGroq(options);

  // En el futuro podrías cambiarlo fácilmente:
  // return askOpenAI(options);
}
