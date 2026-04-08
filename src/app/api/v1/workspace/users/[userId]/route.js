import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";
import { getAuthContext } from "@/lib/workspace";
import { logAuditEvent } from "@/lib/audit";

const ALLOWED_ROLES = new Set(["owner", "admin", "member", "viewer"]);
const ALLOWED_MEMBER_STATUS = new Set(["active", "invited", "disabled"]);

export async function PUT(request, { params }) {
    const auth = await getAuthContext(request, { minRole: "admin" });
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const resolvedParams = await params;
    const userId = resolvedParams?.userId;

    if (!userId) {
        return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const hasRole = Object.prototype.hasOwnProperty.call(body, "role");
        const hasMemberStatus = Object.prototype.hasOwnProperty.call(body, "memberStatus");
        const hasIsActive = Object.prototype.hasOwnProperty.call(body, "isActive");

        if (!hasRole && !hasMemberStatus && !hasIsActive) {
            return NextResponse.json({ error: "No hay cambios para aplicar" }, { status: 400 });
        }

        const role = hasRole ? String(body.role || "").trim() : null;
        const memberStatus = hasMemberStatus ? String(body.memberStatus || "").trim() : null;
        const isActive = hasIsActive ? Boolean(body.isActive) : null;

        if (hasRole && !ALLOWED_ROLES.has(role)) {
            return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
        }

        if (hasMemberStatus && !ALLOWED_MEMBER_STATUS.has(memberStatus)) {
            return NextResponse.json({ error: "Estado de miembro inválido" }, { status: 400 });
        }

        if (role === "owner" && auth.role !== "owner") {
            return NextResponse.json(
                { error: "Solo un owner puede asignar rol owner" },
                { status: 403 }
            );
        }

        const [targetUsers] = await pool.query(
            "SELECT id, email, is_active FROM users WHERE id = ? LIMIT 1",
            [userId]
        );

        if (!targetUsers.length) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        if (userId === auth.userId && hasIsActive && isActive === false) {
            return NextResponse.json(
                { error: "No puedes desactivarte a ti mismo" },
                { status: 400 }
            );
        }

        if (hasRole || hasMemberStatus) {
            const [memberships] = await pool.query(
                "SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ? LIMIT 1",
                [auth.workspaceId, userId]
            );

            if (memberships.length) {
                const updates = [];
                const values = [];

                if (hasRole) {
                    updates.push("role = ?");
                    values.push(role);
                }

                if (hasMemberStatus) {
                    updates.push("status = ?");
                    values.push(memberStatus);
                }

                if (updates.length > 0) {
                    values.push(memberships[0].id);
                    await pool.query(
                        `UPDATE workspace_members SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                        values
                    );
                }
            } else {
                await pool.query(
                    `
          INSERT INTO workspace_members (id, workspace_id, user_id, role, status)
          VALUES (?, ?, ?, ?, ?)
          `,
                    [
                        uuidv4(),
                        auth.workspaceId,
                        userId,
                        hasRole ? role : "member",
                        hasMemberStatus ? memberStatus : "active",
                    ]
                );
            }
        }

        if (hasIsActive) {
            await pool.query(
                "UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [isActive ? 1 : 0, userId]
            );
        }

        await logAuditEvent({
            workspaceId: auth.workspaceId,
            userId: auth.userId,
            action: "workspace.user.update",
            targetType: "user",
            targetId: userId,
            status: "success",
            metadata: {
                role: hasRole ? role : undefined,
                memberStatus: hasMemberStatus ? memberStatus : undefined,
                isActive: hasIsActive ? isActive : undefined,
            },
            ipAddress: auth.requestMeta.ipAddress,
            userAgent: auth.requestMeta.userAgent,
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error actualizando usuario del workspace:", error);
        return NextResponse.json(
            { error: "No se pudo actualizar el usuario" },
            { status: 500 }
        );
    }
}
