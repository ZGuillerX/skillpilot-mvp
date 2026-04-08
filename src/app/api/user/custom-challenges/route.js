import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthContext } from "@/lib/workspace";

export async function GET(request) {
    try {
        const auth = await getAuthContext(request);
        if (auth.error) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status || 401 }
            );
        }

        // Obtener parámetro type de la URL
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "all";

        let query = `
      SELECT id, challenge_data, status, is_favorite, attempts_count, best_score, created_at, completed_at
      FROM custom_challenges
      WHERE user_id = ?
    `;

        const queryParams = [auth.userId];

        // Filtrar por tipo
        if (type === "favorites") {
            // Favoritos en cualquier estado
            query += ` AND is_favorite = true`;
            query += ` ORDER BY created_at DESC`;
        } else if (type === "history") {
            // Historial solo retos finalizados
            query += ` AND status IN ('completed', 'abandoned')`;
            query += ` ORDER BY completed_at DESC, updated_at DESC`;
        } else {
            // Todos los retos activos (sin historial)
            query += ` AND status IN ('generated', 'in_progress')`;
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
