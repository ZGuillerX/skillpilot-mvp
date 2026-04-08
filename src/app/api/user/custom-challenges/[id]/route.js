import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import pool from "@/lib/db";

// GET - Obtener un custom challenge específico
export async function GET(request, { params }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { error: 'Token no proporcionado' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        const { id } = params;

        const query = `
      SELECT id, challenge_data, status, is_favorite, attempts_count, best_score, created_at, completed_at
      FROM custom_challenges
      WHERE id = ? AND user_id = ?
    `;

        const [challenges] = await pool.query(query, [id, decoded.userId]);

        if (challenges.length === 0) {
            return NextResponse.json(
                { error: "Reto no encontrado" },
                { status: 404 }
            );
        }

        const challenge = challenges[0];
        challenge.challenge_data = typeof challenge.challenge_data === "string"
            ? JSON.parse(challenge.challenge_data)
            : challenge.challenge_data;
        return NextResponse.json({
            success: true,
            challenge,
        });
    } catch (error) {
        console.error("Error obteniendo custom challenge:", error);
        return NextResponse.json(
            { error: "Error al obtener el reto" },
            { status: 500 }
        );
    }
}

// PUT - Actualizar custom challenge (completar, marcar favorito, etc)
export async function PUT(request, { params }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { error: 'Token no proporcionado' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        const { id } = params;
        const { status, isFavorite, score } = await request.json();

        // Validar que el reto pertenece al usuario
        const [challenges] = await pool.query(
            "SELECT id FROM custom_challenges WHERE id = ? AND user_id = ?",
            [id, decoded.userId]
        );

        if (challenges.length === 0) {
            return NextResponse.json(
                { error: "Reto no encontrado" },
                { status: 404 }
            );
        }

        const updates = [];
        const values = [];

        if (status !== undefined) {
            updates.push("status = ?");
            values.push(status);
        }

        if (isFavorite !== undefined) {
            updates.push("is_favorite = ?");
            values.push(isFavorite ? 1 : 0);
        }

        if (score !== undefined && score >= 0) {
            updates.push("best_score = GREATEST(best_score, ?)");
            values.push(score);
            updates.push("attempts_count = attempts_count + 1");
        } else if (score === undefined) {
            updates.push("attempts_count = attempts_count + 1");
        }

        if (status === "completed") {
            updates.push("completed_at = ?");
            values.push(new Date());
        }

        updates.push("updated_at = ?");
        values.push(new Date());
        values.push(id);

        const query = `UPDATE custom_challenges SET ${updates.join(", ")} WHERE id = ?`;

        await pool.query(query, values);

        return NextResponse.json({
            success: true,
            message: "Reto actualizado",
        });
    } catch (error) {
        console.error("Error actualizando custom challenge:", error);
        return NextResponse.json(
            { error: "Error al actualizar el reto" },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar un custom challenge
export async function DELETE(request, { params }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { error: 'Token no proporcionado' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        const { id } = params;

        const [rows, result] = await pool.query(
            "DELETE FROM custom_challenges WHERE id = ? AND user_id = ?",
            [id, decoded.userId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: "Reto no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Reto eliminado",
        });
    } catch (error) {
        console.error("Error eliminando custom challenge:", error);
        return NextResponse.json(
            { error: "Error al eliminar el reto" },
            { status: 500 }
        );
    }
}
