import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";

function isSchemaMissingError(error) {
    return error?.code === "ER_NO_SUCH_TABLE" || error?.code === "ER_BAD_FIELD_ERROR";
}

export async function logAuditEvent({
    workspaceId = null,
    userId = null,
    action,
    targetType = null,
    targetId = null,
    status = "success",
    metadata = null,
    ipAddress = null,
    userAgent = null,
}) {
    if (!action) return;

    try {
        await pool.query(
            `
      INSERT INTO audit_events
      (id, workspace_id, user_id, action, target_type, target_id, status, ip_address, user_agent, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                uuidv4(),
                workspaceId,
                userId,
                action,
                targetType,
                targetId,
                status,
                ipAddress,
                userAgent,
                metadata ? JSON.stringify(metadata) : null,
            ]
        );
    } catch (error) {
        if (!isSchemaMissingError(error)) {
            console.error("Error guardando evento de auditoria:", error);
        }
    }
}
