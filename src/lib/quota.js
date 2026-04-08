import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";
import { getWorkspaceSettings } from "@/lib/workspace";

function isSchemaMissingError(error) {
    return error?.code === "ER_NO_SUCH_TABLE" || error?.code === "ER_BAD_FIELD_ERROR";
}

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

export async function getUsageSnapshot(workspaceId) {
    if (!workspaceId) {
        return { date: todayIsoDate(), usage: {} };
    }

    try {
        const [rows] = await pool.query(
            `
      SELECT metric, usage_count
      FROM workspace_daily_usage
      WHERE workspace_id = ? AND usage_date = ?
      `,
            [workspaceId, todayIsoDate()]
        );

        const usage = rows.reduce((acc, row) => {
            acc[row.metric] = row.usage_count;
            return acc;
        }, {});

        return { date: todayIsoDate(), usage };
    } catch (error) {
        if (!isSchemaMissingError(error)) {
            console.error("Error obteniendo uso diario:", error);
        }
        return { date: todayIsoDate(), usage: {} };
    }
}

export async function enforceWorkspaceQuota({ workspaceId, metric, increment = 1 }) {
    if (!workspaceId || !metric) {
        return { allowed: true, limit: null, current: 0, remaining: null };
    }

    const settings = await getWorkspaceSettings(workspaceId);
    const limit = Number(settings?.quotas?.[metric] ?? 0);

    if (limit <= 0) {
        return { allowed: true, limit: null, current: 0, remaining: null };
    }

    try {
        const [rows] = await pool.query(
            `
      SELECT usage_count
      FROM workspace_daily_usage
      WHERE workspace_id = ? AND usage_date = ? AND metric = ?
      LIMIT 1
      `,
            [workspaceId, todayIsoDate(), metric]
        );

        const current = rows.length ? Number(rows[0].usage_count || 0) : 0;
        const next = current + increment;

        if (next > limit) {
            return {
                allowed: false,
                limit,
                current,
                remaining: Math.max(0, limit - current),
            };
        }

        await pool.query(
            `
      INSERT INTO workspace_daily_usage (id, workspace_id, usage_date, metric, usage_count)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE usage_count = usage_count + VALUES(usage_count), updated_at = CURRENT_TIMESTAMP
      `,
            [uuidv4(), workspaceId, todayIsoDate(), metric, increment]
        );

        return {
            allowed: true,
            limit,
            current: next,
            remaining: Math.max(0, limit - next),
        };
    } catch (error) {
        if (!isSchemaMissingError(error)) {
            console.error("Error aplicando cuota:", error);
            return { allowed: false, limit, current: 0, remaining: 0, error: true };
        }

        return { allowed: true, limit: null, current: 0, remaining: null };
    }
}
