import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";
import { getAuthContext } from "@/lib/workspace";
import { generatePlainApiKey, getApiKeyPrefix, hashApiKey } from "@/lib/apiKeys";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request) {
    const auth = await getAuthContext(request, { minRole: "admin" });
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    try {
        const [rows] = await pool.query(
            `
      SELECT id, name, key_prefix, scopes_json, created_by_user_id, created_at, last_used_at, revoked_at
      FROM workspace_api_keys
      WHERE workspace_id = ?
      ORDER BY created_at DESC
      `,
            [auth.workspaceId]
        );

        const keys = rows.map((row) => ({
            ...row,
            scopes: typeof row.scopes_json === "string" ? JSON.parse(row.scopes_json) : row.scopes_json,
            scopes_json: undefined,
        }));

        return NextResponse.json({ keys }, { status: 200 });
    } catch (error) {
        console.error("Error obteniendo API keys:", error);
        return NextResponse.json({ error: "No se pudieron listar las API keys" }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await getAuthContext(request, { minRole: "admin" });
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    try {
        const body = await request.json();
        const name = String(body?.name || "API Key").trim();
        const scopes = Array.isArray(body?.scopes) && body.scopes.length > 0 ? body.scopes : ["ai:generate", "ai:evaluate"];

        const plainKey = generatePlainApiKey();
        const keyHash = hashApiKey(plainKey);
        const keyPrefix = getApiKeyPrefix(plainKey);

        const id = uuidv4();

        await pool.query(
            `
      INSERT INTO workspace_api_keys
      (id, workspace_id, name, key_prefix, key_hash, scopes_json, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            [
                id,
                auth.workspaceId,
                name,
                keyPrefix,
                keyHash,
                JSON.stringify(scopes),
                auth.userId,
            ]
        );

        await logAuditEvent({
            workspaceId: auth.workspaceId,
            userId: auth.userId,
            action: "workspace.api_key.create",
            targetType: "api_key",
            targetId: id,
            status: "success",
            metadata: { name, scopes },
            ipAddress: auth.requestMeta.ipAddress,
            userAgent: auth.requestMeta.userAgent,
        });

        return NextResponse.json(
            {
                success: true,
                apiKey: {
                    id,
                    name,
                    prefix: keyPrefix,
                    scopes,
                    key: plainKey,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creando API key:", error);
        return NextResponse.json({ error: "No se pudo crear la API key" }, { status: 500 });
    }
}
