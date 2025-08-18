export function getCompletedModules() {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("completedModules") || "[]");
}

export function isModuleCompleted(id) {
  return getCompletedModules().includes(id);
}

export function markModuleCompleted(id) {
  const completed = getCompletedModules();
  if (!completed.includes(id)) {
    const updated = [...completed, id];
    localStorage.setItem("completedModules", JSON.stringify(updated));
  }
}


// export function markModuleIncomplete(id) {
//   const completed = getCompletedModules();
//   if (completed.includes(id)) {
//     const updated = completed.filter((m) => m !== id);
//     localStorage.setItem("completed-modules", JSON.stringify(updated));
//   }
// }
