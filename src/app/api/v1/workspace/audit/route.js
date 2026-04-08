import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthContext } from "@/lib/workspace";

export async function GET(request) {
    const auth = await getAuthContext(request, { minRole: "admin" });
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    try {
        const url = new URL(request.url);
        const limit = Math.min(100, Math.max(10, Number(url.searchParams.get("limit") || 30)));

        const [rows] = await pool.query(
            `
      SELECT id, action, target_type, target_id, status, ip_address, user_agent, metadata_json, created_at, user_id
      FROM audit_events
      WHERE workspace_id = ?
      ORDER BY created_at DESC
      LIMIT ?
      `,
            [auth.workspaceId, limit]
        );

        const events = rows.map((row) => ({
            ...row,
            metadata: typeof row.metadata_json === "string" ? JSON.parse(row.metadata_json) : row.metadata_json,
            metadata_json: undefined,
        }));

        return NextResponse.json({ events }, { status: 200 });
    } catch (error) {
        console.error("Error listando auditoria:", error);
        return NextResponse.json({ error: "No se pudo cargar la auditoria" }, { status: 500 });
    }
}
