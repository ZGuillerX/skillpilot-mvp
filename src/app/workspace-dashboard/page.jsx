"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function WorkspaceDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [workspaceRole, setWorkspaceRole] = useState(null);
  const [workspaceInfo, setWorkspaceInfo] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [workspaceSettings, setWorkspaceSettings] = useState(null);
  const [workspaceUsage, setWorkspaceUsage] = useState(null);
  const [workspaceKeys, setWorkspaceKeys] = useState([]);
  const [workspaceAudit, setWorkspaceAudit] = useState([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("Backend Integrations");
  const [generatedApiKey, setGeneratedApiKey] = useState(null);

  const [userSearch, setUserSearch] = useState("");
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");

  const isWorkspaceAdmin =
    workspaceRole === "owner" || workspaceRole === "admin";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadDashboard();
  }, [authLoading, user]);

  useEffect(() => {
    if (!isWorkspaceAdmin || !workspaceInfo?.id) return;

    const interval = setInterval(() => {
      loadWorkspaceUsers(userSearch);
    }, 10000);

    return () => clearInterval(interval);
  }, [isWorkspaceAdmin, workspaceInfo?.id, userSearch]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const workspaceRes = await fetch("/api/v1/workspace");
      const workspaceData = await workspaceRes.json();

      setWorkspaceRole(workspaceData?.role || null);
      setWorkspaceInfo(workspaceData?.workspace || null);
      setWorkspaceMembers(
        Array.isArray(workspaceData?.members) ? workspaceData.members : [],
      );

      const isAdmin =
        workspaceData?.role === "owner" || workspaceData?.role === "admin";
      if (!isAdmin) {
        setWorkspaceSettings(null);
        setWorkspaceUsage(null);
        setWorkspaceKeys([]);
        setWorkspaceAudit([]);
        setWorkspaceUsers([]);
        return;
      }

      const [settingsRes, usageRes, keysRes, auditRes] = await Promise.all([
        fetch("/api/v1/workspace/settings"),
        fetch("/api/v1/workspace/usage"),
        fetch("/api/v1/workspace/api-keys"),
        fetch("/api/v1/workspace/audit?limit=25"),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setWorkspaceSettings(data?.settings || null);
      }

      if (usageRes.ok) {
        const data = await usageRes.json();
        setWorkspaceUsage(data || null);
      }

      if (keysRes.ok) {
        const data = await keysRes.json();
        setWorkspaceKeys(Array.isArray(data?.keys) ? data.keys : []);
      }

      if (auditRes.ok) {
        const data = await auditRes.json();
        setWorkspaceAudit(Array.isArray(data?.events) ? data.events : []);
      }

      await loadWorkspaceUsers(userSearch);
    } catch (error) {
      console.error("Error loading workspace dashboard:", error);
      toast.error("No se pudo cargar el dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceUsers = async (query = "") => {
    try {
      setUsersLoading(true);
      const response = await fetch(
        `/api/v1/workspace/users?query=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        setWorkspaceUsers([]);
        return;
      }
      const data = await response.json();
      setWorkspaceUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      console.error("Error loading workspace users:", error);
      setWorkspaceUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    await loadWorkspaceUsers(userSearch);
  };

  const updateWorkspaceUser = async (userId, payload) => {
    try {
      setUpdatingUserId(userId);
      const response = await fetch(`/api/v1/workspace/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo actualizar el usuario");
      }

      toast.success("Usuario actualizado");
      await Promise.all([loadWorkspaceUsers(userSearch), loadDashboard()]);
    } catch (error) {
      toast.error(error.message || "Error actualizando usuario");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleQuotaChange = (metric, value) => {
    setWorkspaceSettings((prev) => ({
      ...(prev || {}),
      quotas: {
        ...(prev?.quotas || {}),
        [metric]: Number(value || 0),
      },
    }));
  };

  const handleSaveWorkspaceSettings = async () => {
    if (!workspaceSettings) return;
    try {
      setSavingSettings(true);
      const response = await fetch("/api/v1/workspace/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workspaceSettings),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "No se pudieron guardar settings");
      }

      setWorkspaceSettings(data?.settings || workspaceSettings);
      toast.success("Cuotas y reglas actualizadas");
      await loadDashboard();
    } catch (error) {
      toast.error(error.message || "Error guardando settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      setCreatingKey(true);
      const response = await fetch("/api/v1/workspace/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newApiKeyName.trim() || "Backend Integrations",
          scopes: ["ai:generate", "ai:evaluate"],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear la API key");
      }

      setGeneratedApiKey(data?.apiKey || null);
      toast.success("API key creada");
      await loadDashboard();
    } catch (error) {
      toast.error(error.message || "Error creando API key");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (id) => {
    if (!confirm("¿Seguro que deseas revocar esta API key?")) return;

    try {
      const response = await fetch(`/api/v1/workspace/api-keys/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo revocar la API key");
      }

      toast.success("API key revocada");
      await loadDashboard();
    } catch (error) {
      toast.error(error.message || "Error revocando API key");
    }
  };

  const handleCopyApiKey = async () => {
    if (!generatedApiKey?.key) return;
    try {
      await navigator.clipboard.writeText(generatedApiKey.key);
      toast.success("API key copiada al portapapeles");
    } catch {
      toast.error("No se pudo copiar la API key");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando dashboard workspace...</p>
      </div>
    );
  }

  if (!isWorkspaceAdmin) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-5xl mx-auto bg-card border border-border rounded-xl p-8">
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Workspace
          </h1>
          <p className="text-muted-foreground mt-2">
            No tienes permisos para ver esta sección. Solicita rol admin u
            owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administra usuarios, permisos, cuotas, API keys y auditoría en
              tiempo real.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Workspace: {workspaceInfo?.name} /{workspaceInfo?.slug}
            </p>
          </div>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Refrescar
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "usuarios", label: "Usuarios" },
              { id: "cuotas", label: "Cuotas" },
              { id: "api-keys", label: "API Keys" },
              { id: "auditoria", label: "Auditoría" },
              { id: "miembros", label: "Miembros" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeSection === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeSection === "dashboard" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Resumen general
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Workspace</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {workspaceInfo?.name || "-"}
                </p>
              </div>
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Slug</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  /{workspaceInfo?.slug || "-"}
                </p>
              </div>
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Tu rol</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {workspaceRole || "-"}
                </p>
              </div>
              <div className="border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Miembros</p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {workspaceMembers.length}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Usa los botones de arriba para navegar por cada módulo sin tener
              todo en una sola vista.
            </p>
          </div>
        )}

        {activeSection === "usuarios" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Usuarios y permisos
            </h2>
            <form
              onSubmit={handleSearchUsers}
              className="flex flex-col md:flex-row gap-2"
            >
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por email o nombre"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Buscar
              </button>
            </form>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {usersLoading && (
                <p className="text-sm text-muted-foreground">
                  Cargando usuarios...
                </p>
              )}
              {!usersLoading && workspaceUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay usuarios para mostrar.
                </p>
              )}

              {workspaceUsers.map((workspaceUser) => {
                const role = workspaceUser.workspace_role || "member";
                const memberStatus =
                  workspaceUser.workspace_member_status || "active";
                const disabled = updatingUserId === workspaceUser.id;

                return (
                  <div
                    key={workspaceUser.id}
                    className="border border-border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {workspaceUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {workspaceUser.email}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        App: {workspaceUser.is_active ? "activo" : "inactivo"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      <select
                        value={role}
                        disabled={disabled}
                        onChange={(e) =>
                          updateWorkspaceUser(workspaceUser.id, {
                            role: e.target.value,
                          })
                        }
                        className="px-2 py-1.5 rounded border border-border bg-background text-sm"
                      >
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                        <option value="member">member</option>
                        <option value="viewer">viewer</option>
                      </select>

                      <select
                        value={memberStatus}
                        disabled={disabled}
                        onChange={(e) =>
                          updateWorkspaceUser(workspaceUser.id, {
                            memberStatus: e.target.value,
                          })
                        }
                        className="px-2 py-1.5 rounded border border-border bg-background text-sm"
                      >
                        <option value="active">active</option>
                        <option value="invited">invited</option>
                        <option value="disabled">disabled</option>
                      </select>

                      <button
                        disabled={disabled}
                        onClick={() =>
                          updateWorkspaceUser(workspaceUser.id, {
                            isActive: !workspaceUser.is_active,
                          })
                        }
                        className="px-2 py-1.5 text-xs font-semibold rounded border border-border hover:bg-muted"
                      >
                        {workspaceUser.is_active
                          ? "Desactivar app"
                          : "Activar app"}
                      </button>

                      <span className="text-xs text-muted-foreground">
                        {workspaceUser.last_login
                          ? `Ultimo login: ${new Date(workspaceUser.last_login).toLocaleString("es-ES")}`
                          : "Sin login aun"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === "cuotas" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Cuotas diarias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: "ai_generate", label: "Generación IA" },
                { key: "ai_evaluate", label: "Evaluaciones IA" },
                {
                  key: "custom_challenge_generate",
                  label: "Retos personalizados",
                },
              ].map((item) => (
                <label key={item.key} className="text-sm space-y-1 block">
                  <span className="text-muted-foreground">{item.label}</span>
                  <input
                    type="number"
                    min="0"
                    value={workspaceSettings?.quotas?.[item.key] ?? 0}
                    onChange={(e) =>
                      handleQuotaChange(item.key, e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                  <span className="text-xs text-muted-foreground block">
                    Uso hoy: {workspaceUsage?.usage?.[item.key] ?? 0}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={handleSaveWorkspaceSettings}
              disabled={savingSettings}
              className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {savingSettings ? "Guardando..." : "Guardar cuotas"}
            </button>
          </div>
        )}

        {activeSection === "api-keys" && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">API Keys</h2>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                placeholder="Nombre de la API key"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              />
              <button
                onClick={handleCreateApiKey}
                disabled={creatingKey}
                className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {creatingKey ? "Creando..." : "Crear API key"}
              </button>
            </div>

            {generatedApiKey?.key && (
              <div className="p-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  Copia esta key ahora, no volverá a mostrarse completa:
                </p>
                <div className="mt-2 flex gap-2 items-center">
                  <input
                    readOnly
                    value={generatedApiKey.key}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded border border-border bg-background"
                  />
                  <button
                    onClick={handleCopyApiKey}
                    className="px-3 py-2 text-xs font-semibold bg-foreground text-background rounded"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {workspaceKeys.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay API keys creadas.
                </p>
              )}
              {workspaceKeys.map((key) => (
                <div
                  key={key.id}
                  className="border border-border rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {key.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {key.key_prefix}... -{" "}
                      {key.revoked_at ? "Revocada" : "Activa"}
                    </p>
                  </div>
                  {!key.revoked_at && (
                    <button
                      onClick={() => handleRevokeApiKey(key.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Revocar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "auditoria" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Auditoría reciente
            </h2>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {workspaceAudit.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Sin eventos recientes.
                </p>
              )}
              {workspaceAudit.map((event) => (
                <div
                  key={event.id}
                  className="border border-border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {event.action}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        event.status === "success"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.created_at).toLocaleString("es-ES")}
                  </p>
                  {event.target_type && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {event.target_type}{" "}
                      {event.target_id ? `(${event.target_id})` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "miembros" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Miembros
            </h2>
            {workspaceMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay miembros para mostrar.
              </p>
            ) : (
              <div className="space-y-2">
                {workspaceMembers.map((member) => (
                  <div
                    key={`${member.user_id}-${member.role}`}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
