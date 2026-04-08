import { NextResponse } from "next/server";
import { generateToken } from "@/lib/auth";
import pool from "@/lib/db";
import { getAuthContext } from "@/lib/workspace";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request) {
    const auth = await getAuthContext(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    try {
        const { workspaceId } = await request.json();

        if (!workspaceId) {
            return NextResponse.json({ error: "workspaceId es requerido" }, { status: 400 });
        }

        const [memberships] = await pool.query(
            "SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ? AND status = 'active' LIMIT 1",
            [workspaceId, auth.userId]
        );

        if (!memberships.length) {
            return NextResponse.json({ error: "No tienes acceso a ese workspace" }, { status: 403 });
        }

        await pool.query("UPDATE users SET current_workspace_id = ? WHERE id = ?", [workspaceId, auth.userId]);

        const role = memberships[0].role;
        const token = generateToken(auth.userId, auth.user.email, workspaceId, role);

        const [result] = await pool.query(
            "UPDATE sessions SET token = ? WHERE token = ?",
            [token, auth.token]
        );

        if (!result?.affectedRows) {
            return NextResponse.json({ error: "No se pudo actualizar la sesion" }, { status: 500 });
        }

        await logAuditEvent({
            workspaceId,
            userId: auth.userId,
            action: "workspace.switch",
            targetType: "workspace",
            targetId: workspaceId,
            status: "success",
            ipAddress: auth.requestMeta.ipAddress,
            userAgent: auth.requestMeta.userAgent,
        });

        return NextResponse.json({ success: true, token, workspaceId, role }, { status: 200 });
    } catch (error) {
        console.error("Error cambiando workspace:", error);
        return NextResponse.json({ error: "No se pudo cambiar de workspace" }, { status: 500 });
    }
}
