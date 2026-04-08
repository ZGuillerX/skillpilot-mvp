import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const ROLE_ORDER = {
    viewer: 1,
    member: 2,
    admin: 3,
    owner: 4,
};

export const DEFAULT_WORKSPACE_SETTINGS = {
    quotas: {
        ai_generate: 120,
        ai_evaluate: 300,
        custom_challenge_generate: 80,
    },
    guardrails: {
        maxHintsPerChallenge: 3,
        allowArenaMode: true,
    },
};

function parseJson(value, fallback = null) {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function isSchemaMissingError(error) {
    return error?.code === "ER_NO_SUCH_TABLE" || error?.code === "ER_BAD_FIELD_ERROR";
}

export function hasMinRole(actualRole = "viewer", minimumRole = "member") {
    return (ROLE_ORDER[actualRole] || 0) >= (ROLE_ORDER[minimumRole] || 0);
}

export function extractRequestMeta(request) {
    const ipAddress =
        request.headers.get("x-forwarded-for")?.split(",")?.[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        null;
    const userAgent = request.headers.get("user-agent") || null;

    return { ipAddress, userAgent };
}

async function ensureSession(decodedToken, token) {
    const [sessions] = await pool.query(
        "SELECT user_id, expires_at FROM sessions WHERE token = ? LIMIT 1",
        [token]
    );

    if (!sessions.length) return null;

    const session = sessions[0];
    if (new Date() > new Date(session.expires_at)) {
        await pool.query("DELETE FROM sessions WHERE token = ?", [token]);
        return null;
    }

    if (decodedToken?.userId !== session.user_id) {
        return null;
    }

    return session;
}

async function resolveWorkspaceContext(userId, decodedToken) {
    try {
        const [rows] = await pool.query(
            `
      SELECT
        COALESCE(u.current_workspace_id, wm.workspace_id) AS workspace_id,
        wm.role,
        w.name AS workspace_name,
        w.plan_tier
      FROM users u
      LEFT JOIN workspace_members wm
        ON wm.user_id = u.id
       AND wm.status = 'active'
       AND (wm.workspace_id = u.current_workspace_id OR u.current_workspace_id IS NULL)
      LEFT JOIN workspaces w ON w.id = COALESCE(u.current_workspace_id, wm.workspace_id)
      WHERE u.id = ?
      ORDER BY FIELD(wm.role, 'owner', 'admin', 'member', 'viewer')
      LIMIT 1
      `,
            [userId]
        );

        if (rows.length > 0 && rows[0].workspace_id) {
            return {
                workspaceId: rows[0].workspace_id,
                role: rows[0].role || decodedToken?.role || "member",
                workspaceName: rows[0].workspace_name || null,
                planTier: rows[0].plan_tier || "free",
            };
        }
    } catch (error) {
        if (!isSchemaMissingError(error)) {
            console.error("Error resolviendo contexto workspace:", error);
        }
    }

    return {
        workspaceId: decodedToken?.workspaceId || null,
        role: decodedToken?.role || "member",
        workspaceName: null,
        planTier: "free",
    };
}

export async function getWorkspaceSettings(workspaceId) {
    if (!workspaceId) return DEFAULT_WORKSPACE_SETTINGS;

    try {
        const [rows] = await pool.query(
            "SELECT settings_json FROM workspace_settings WHERE workspace_id = ? LIMIT 1",
            [workspaceId]
        );

        if (!rows.length) return DEFAULT_WORKSPACE_SETTINGS;

        const parsed = parseJson(rows[0].settings_json, {});
        return {
            ...DEFAULT_WORKSPACE_SETTINGS,
            ...parsed,
            quotas: {
                ...DEFAULT_WORKSPACE_SETTINGS.quotas,
                ...(parsed?.quotas || {}),
            },
            guardrails: {
                ...DEFAULT_WORKSPACE_SETTINGS.guardrails,
                ...(parsed?.guardrails || {}),
            },
        };
    } catch (error) {
        if (!isSchemaMissingError(error)) {
            console.error("Error cargando settings workspace:", error);
        }
        return DEFAULT_WORKSPACE_SETTINGS;
    }
}

export async function saveWorkspaceSettings(workspaceId, settings) {
    const id = uuidv4();
    const merged = {
        ...DEFAULT_WORKSPACE_SETTINGS,
        ...(settings || {}),
        quotas: {
            ...DEFAULT_WORKSPACE_SETTINGS.quotas,
            ...((settings || {}).quotas || {}),
        },
        guardrails: {
            ...DEFAULT_WORKSPACE_SETTINGS.guardrails,
            ...((settings || {}).guardrails || {}),
        },
    };

    await pool.query(
        `
    INSERT INTO workspace_settings (id, workspace_id, settings_json)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE settings_json = VALUES(settings_json), updated_at = CURRENT_TIMESTAMP
    `,
        [id, workspaceId, JSON.stringify(merged)]
    );

    return merged;
}

export async function getAuthContext(request, options = {}) {
    const { minRole = null, allowCookie = true } = options;

    const authHeader = request.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;
    const cookieToken = allowCookie ? request.cookies.get("token")?.value : null;
    const token = headerToken || cookieToken;

    if (!token) {
        return { error: "No autorizado", status: 401 };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return { error: "Token invalido", status: 401 };
    }

    try {
        const session = await ensureSession(decoded, token);
        if (!session) {
            return { error: "Sesion no valida", status: 401 };
        }

        const [users] = await pool.query(
            "SELECT id, email, name, is_active FROM users WHERE id = ? LIMIT 1",
            [session.user_id]
        );

        if (!users.length || !users[0].is_active) {
            return { error: "Usuario no encontrado", status: 404 };
        }

        const workspace = await resolveWorkspaceContext(users[0].id, decoded);

        if (minRole && !hasMinRole(workspace.role, minRole)) {
            return { error: "Permisos insuficientes", status: 403 };
        }

        return {
            token,
            userId: users[0].id,
            user: users[0],
            workspaceId: workspace.workspaceId,
            workspaceName: workspace.workspaceName,
            role: workspace.role,
            planTier: workspace.planTier,
            requestMeta: extractRequestMeta(request),
        };
    } catch (error) {
        console.error("Error creando contexto auth:", error);
        return { error: "Error de autenticacion", status: 500 };
    }
}
