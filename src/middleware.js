import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request) {
    const token = request.cookies.get('token')?.value;

    // Rutas que requieren autenticación
    const protectedRoutes = ['/challenges', '/onboarding', '/profile', '/history'];

    // Rutas de autenticación (si ya estás logueado, redirigir a home)
    const authRoutes = ['/login', '/register'];

    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    );

    const isAuthRoute = authRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    );

    // Si es una ruta protegida y no hay token, redirigir a login
    if (isProtectedRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            // Verificar que el token sea válido
            await verifyToken(token);
        } catch (error) {
            // Si el token es inválido, redirigir a login
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('token');
            return response;
        }
    }

    // Si es una ruta de autenticación y ya hay token válido, redirigir a home
    if (isAuthRoute && token) {
        try {
            await verifyToken(token);
            return NextResponse.redirect(new URL('/', request.url));
        } catch (error) {
            // Si el token es inválido, permitir acceso a login/register
            const response = NextResponse.next();
            response.cookies.delete('token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/challenges/:path*',
        '/onboarding/:path*',
        '/profile/:path*',
        '/history/:path*',
        '/login',
        '/register'
    ]
};
