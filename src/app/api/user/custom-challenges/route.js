import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { error: 'Token no proporcionado' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);

        // Obtener parámetro type de la URL
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "all";

        let query = `
      SELECT id, challenge_data, status, is_favorite, attempts_count, best_score, created_at, completed_at
      FROM custom_challenges
      WHERE user_id = ?
    `;

        const queryParams = [decoded.userId];

        // Filtrar por tipo
        if (type === "favorites") {
            query += ` AND is_favorite = true`;
            query += ` ORDER BY created_at DESC`;
        } else if (type === "history") {
            query += ` AND status IN ('completed', 'abandoned')`;
            query += ` ORDER BY completed_at DESC`;
        } else {
            query += ` ORDER BY created_at DESC`;
        }

        const [challenges] = await pool.query(query, queryParams);

        // Parsear challenge_data JSON (MySQL puede devolverlo ya parseado)
        const formattedChallenges = challenges.map((c) => ({
            ...c,
            challenge_data: typeof c.challenge_data === "string"
                ? JSON.parse(c.challenge_data)
                : c.challenge_data,
        }));

        return NextResponse.json({
            success: true,
            challenges: formattedChallenges,
            count: formattedChallenges.length,
        });
    } catch (error) {
        console.error("Error obteniendo custom challenges:", error);
        return NextResponse.json(
            { error: "Error al obtener los retos" },
            { status: 500 }
        );
    }
}
