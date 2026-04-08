import { NextResponse } from "next/server";
import { getAuthContext, getWorkspaceSettings, saveWorkspaceSettings } from "@/lib/workspace";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request) {
    const auth = await getAuthContext(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const settings = await getWorkspaceSettings(auth.workspaceId);
    return NextResponse.json({ workspaceId: auth.workspaceId, settings }, { status: 200 });
}

export async function PUT(request) {
    const auth = await getAuthContext(request, { minRole: "admin" });
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    try {
        const body = await request.json();
        const settings = await saveWorkspaceSettings(auth.workspaceId, body || {});

        await logAuditEvent({
            workspaceId: auth.workspaceId,
            userId: auth.userId,
            action: "workspace.settings.update",
            targetType: "workspace",
            targetId: auth.workspaceId,
            status: "success",
            metadata: { keys: Object.keys(body || {}) },
            ipAddress: auth.requestMeta.ipAddress,
            userAgent: auth.requestMeta.userAgent,
        });

        return NextResponse.json({ success: true, settings }, { status: 200 });
    } catch (error) {
        console.error("Error guardando settings:", error);
        return NextResponse.json(
            { error: "No se pudieron guardar los settings" },
            { status: 500 }
        );
    }
}
