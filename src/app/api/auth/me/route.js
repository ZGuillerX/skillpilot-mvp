import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/workspace';

export async function GET(request) {
    try {
        const auth = await getAuthContext(request, { allowCookie: false });
        if (auth.error) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status || 401 }
            );
        }

        return NextResponse.json({
            success: true,
            user: {
                ...auth.user,
                workspaceId: auth.workspaceId,
                workspaceName: auth.workspaceName,
                role: auth.role,
                planTier: auth.planTier,
            },
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return NextResponse.json(
            { error: 'Error al obtener usuario' },
            { status: 500 }
        );
    }
}
