import { useState } from "react";
export default function ChallengeCard({ challenge }) {
  const [code, setCode] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!challenge) return null;

  const handleSubmitCode = async () => {
    if (!code.trim()) return;

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      const response = await fetch("/api/ai/evaluate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          challenge: {
            title: challenge.title,
            description: challenge.description,
            language: challenge.language,
            acceptanceCriteria: challenge.acceptanceCriteria,
          },
        }),
      });

      const result = await response.json();
      setEvaluation(result);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error evaluating code:", error);
      setEvaluation({
        success: false,
        feedback: "Error al evaluar el código. Por favor intenta de nuevo.",
        score: 0,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetChallenge = () => {
    setCode("");
    setEvaluation(null);
    setIsSubmitted(false);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow border">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">
        🚀 Reto inicial
      </h2>

      <div className="p-4 border rounded-lg bg-gray-50 mb-6">
        <h3 className="text-lg font-bold text-blue-700 mb-2">
          {challenge.title}
        </h3>
        <p className="text-gray-700 mb-3">{challenge.description}</p>
        <p className="text-gray-600 mb-3">
          <span className="font-semibold">Lenguaje:</span> {challenge.language}
        </p>

        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            Criterios de aceptación:
          </h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {challenge.acceptanceCriteria.map((criteria, i) => (
              <li key={i}>{criteria}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Code Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tu solución en {challenge.language}:
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Escribe tu código aquí...

Ejemplo para ${challenge.language}:
${
  challenge.language === "JavaScript"
    ? "function miFuncion() {\n  // tu código aquí\n}"
    : challenge.language === "Python"
    ? "def mi_funcion():\n    # tu código aquí\n    pass"
    : "// tu código aquí"
}
`}
            className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitted && evaluation?.success}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmitCode}
            disabled={
              !code.trim() ||
              isEvaluating ||
              (isSubmitted && evaluation?.success)
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isEvaluating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Evaluando...
              </>
            ) : (
              "Evaluar código"
            )}
          </button>

          {isSubmitted && (
            <button
              onClick={resetChallenge}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Intentar de nuevo
            </button>
          )}
        </div>

        {/* Evaluation Results */}
        {evaluation && (
          <div
            className={`p-4 rounded-lg border-l-4 ${
              evaluation.success
                ? "bg-green-50 border-green-500"
                : "bg-red-50 border-red-500"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-lg ${
                  evaluation.success ? "text-green-600" : "text-red-600"
                }`}
              >
                {evaluation.success ? "✅" : "❌"}
              </span>
              <h4
                className={`font-semibold ${
                  evaluation.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {evaluation.success
                  ? "¡Excelente trabajo!"
                  : "Necesita mejoras"}
              </h4>
              <span
                className={`ml-auto px-2 py-1 rounded text-sm font-semibold ${
                  evaluation.score >= 80
                    ? "bg-green-100 text-green-800"
                    : evaluation.score >= 60
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {evaluation.score}/100
              </span>
            </div>

            <p
              className={`${
                evaluation.success ? "text-green-700" : "text-red-700"
              } mb-3`}
            >
              {evaluation.feedback}
            </p>

            {evaluation.suggestions && evaluation.suggestions.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-800 mb-1">
                  Sugerencias:
                </h5>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {evaluation.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
