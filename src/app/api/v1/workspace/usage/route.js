import { NextResponse } from "next/server";
import { getAuthContext, getWorkspaceSettings } from "@/lib/workspace";
import { getUsageSnapshot } from "@/lib/quota";

export async function GET(request) {
    const auth = await getAuthContext(request);
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status || 401 });
    }

    const [settings, usage] = await Promise.all([
        getWorkspaceSettings(auth.workspaceId),
        getUsageSnapshot(auth.workspaceId),
    ]);

    return NextResponse.json(
        {
            workspaceId: auth.workspaceId,
            date: usage.date,
            usage: usage.usage,
            quotas: settings.quotas,
        },
        { status: 200 }
    );
}
