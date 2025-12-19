import { useEffect, useState } from "react";
import { isModuleCompleted, markModuleCompleted } from "@/lib/progress";

export default function ModuleCard({ module, index, onComplete }) {
  const [linkStatus, setLinkStatus] = useState("checking"); // 'checking', 'valid', 'invalid'

  useEffect(() => {
    const handleFocus = () => {
      const visited = sessionStorage.getItem(`visited-${module.id}`);
      if (visited && !isModuleCompleted(module.id)) {
        markModuleCompleted(module.id);
        onComplete(module.id);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [module.id, onComplete]);

  useEffect(() => {
    async function checkLink() {
      if (!module.resource?.url) {
        setLinkStatus("invalid");
        return;
      }

      try {
        new URL(module.resource.url);
        setLinkStatus("valid");
      } catch {
        setLinkStatus("invalid");
      }
    }

    checkLink();
  }, [module.resource?.url]);

  const handleResourceClick = () => {
    sessionStorage.setItem(`visited-${module.id}`, "true");
    console.log(`[v0] User clicked resource: ${module.resource?.url}`);
  };

  return (
    <li
      className={`border rounded p-4 ${
        isModuleCompleted(module.id) ? "bg-green-50" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">
          {index + 1}. {module.title}
        </h3>
        {isModuleCompleted(module.id) && (
          <span className="text-green-600 font-semibold">✔ Completado</span>
        )}
      </div>
      <p className="mt-2 text-gray-700">{module.description}</p>

      <div className="mt-2 text-sm">
        <div className="flex items-center gap-2">
          {linkStatus === "checking" && (
            <span className="text-yellow-600 text-xs">🔄 Verificando...</span>
          )}
          {linkStatus === "valid" && (
            <span className="text-green-600 text-xs">✅ Link verificado</span>
          )}
          {linkStatus === "invalid" && (
            <span className="text-red-600 text-xs">Link alternativo</span>
          )}
        </div>

        <a
          className="underline hover:text-blue-600 transition-colors"
          href={module.resource?.url}
          target="_blank"
          rel="noreferrer"
          onClick={handleResourceClick}
        >
          Recurso ({module.resource?.type}): {module.resource?.title}
        </a>
      </div>

      <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
        {module.outcomes.map((o, idx) => (
          <li key={idx}>{o}</li>
        ))}
      </ul>
    </li>
  );
}
