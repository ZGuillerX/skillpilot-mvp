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
        const query = String(url.searchParams.get("query") || "").trim();
        const like = `%${query}%`;

        const [rows] = await pool.query(
            `
      SELECT
        u.id,
        u.email,
        u.name,
        u.is_active,
        u.last_login,
        wm.role AS workspace_role,
        wm.status AS workspace_member_status
      FROM users u
      LEFT JOIN workspace_members wm
        ON wm.user_id = u.id
       AND wm.workspace_id = ?
      WHERE (? = '' OR u.email LIKE ? OR u.name LIKE ?)
      ORDER BY
        CASE WHEN wm.role IS NULL THEN 1 ELSE 0 END,
        FIELD(wm.role, 'owner', 'admin', 'member', 'viewer'),
        u.created_at DESC
      LIMIT 100
      `,
            [auth.workspaceId, query, like, like]
        );

        return NextResponse.json({ users: rows }, { status: 200 });
    } catch (error) {
        console.error("Error listando usuarios del workspace:", error);
        return NextResponse.json(
            { error: "No se pudieron cargar los usuarios" },
            { status: 500 }
        );
    }
}
