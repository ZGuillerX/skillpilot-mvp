import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthContext } from "@/lib/workspace";
import { logAuditEvent } from "@/lib/audit";

export async function DELETE(request, { params }) {
    const auth = await getAuthContext(request, { minRole: "admin" });
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
        return NextResponse.json({ error: "ID de API key requerido" }, { status: 400 });
    }

    try {
        const [result] = await pool.query(
            `
      UPDATE workspace_api_keys
      SET revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND workspace_id = ? AND revoked_at IS NULL
      `,
            [id, auth.workspaceId]
        );

        if (!result?.affectedRows) {
            return NextResponse.json({ error: "API key no encontrada" }, { status: 404 });
        }

        await logAuditEvent({
            workspaceId: auth.workspaceId,
            userId: auth.userId,
            action: "workspace.api_key.revoke",
            targetType: "api_key",
            targetId: id,
            status: "success",
            ipAddress: auth.requestMeta.ipAddress,
            userAgent: auth.requestMeta.userAgent,
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error revocando API key:", error);
        return NextResponse.json({ error: "No se pudo revocar la API key" }, { status: 500 });
    }
}
