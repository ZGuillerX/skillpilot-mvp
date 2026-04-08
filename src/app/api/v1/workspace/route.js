import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthContext } from "@/lib/workspace";

export async function GET(request) {
    const auth = await getAuthContext(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    if (!auth.workspaceId) {
        return NextResponse.json(
            {
                workspace: null,
                role: auth.role,
                members: [],
            },
            { status: 200 }
        );
    }

    try {
        const [workspaces] = await pool.query(
            "SELECT id, name, slug, owner_user_id, plan_tier, created_at, updated_at FROM workspaces WHERE id = ? LIMIT 1",
            [auth.workspaceId]
        );

        const workspace = workspaces[0] || null;

        let members = [];
        if (auth.role === "owner" || auth.role === "admin") {
            const [rows] = await pool.query(
                `
        SELECT wm.user_id, wm.role, wm.status, u.email, u.name
        FROM workspace_members wm
        INNER JOIN users u ON u.id = wm.user_id
        WHERE wm.workspace_id = ?
        ORDER BY FIELD(wm.role, 'owner', 'admin', 'member', 'viewer'), u.name ASC
        `,
                [auth.workspaceId]
            );
            members = rows;
        }

        return NextResponse.json(
            {
                workspace,
                role: auth.role,
                members,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error obteniendo workspace:", error);
        return NextResponse.json(
            { error: "No se pudo obtener el workspace" },
            { status: 500 }
        );
    }
}
