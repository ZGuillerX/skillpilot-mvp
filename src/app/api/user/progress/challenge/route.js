import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST: Guardar reto completado
export async function POST(request) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { error: 'Token no proporcionado' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        const challengeData = await request.json();

        // Validar datos
        if (!challengeData.challenge || !challengeData.challenge.id) {
            return NextResponse.json(
                { error: 'Datos del reto inválidos' },
                { status: 400 }
            );
        }

        // Obtener historial actual
        const [rows] = await pool.query(
            'SELECT challenge_history, stats FROM user_progress WHERE user_id = ?',
            [decoded.userId]
        );

        let history = [];
        let stats = {
            totalChallenges: 0,
            completedChallenges: 0,
            totalAttempts: 0,
            averageScore: 0,
        };

        if (rows.length > 0) {
            history = rows[0].challenge_history
                ? (typeof rows[0].challenge_history === 'string'
                    ? JSON.parse(rows[0].challenge_history)
                    : rows[0].challenge_history)
                : [];

            stats = rows[0].stats
                ? (typeof rows[0].stats === 'string'
                    ? JSON.parse(rows[0].stats)
                    : rows[0].stats)
                : stats;
        }

        // Agregar o actualizar reto en historial
        // Buscar por challenge.id Y planId para no sobreescribir entre planes
        const existingIndex = history.findIndex(
            entry => entry.challenge.id === challengeData.challenge.id &&
                entry.planId === challengeData.planId
        );

        if (existingIndex >= 0) {
            // Actualizar reto existente del mismo plan
            challengeData.attempts = (history[existingIndex].attempts || 0) + 1;
            history[existingIndex] = challengeData;
        } else {
            // Agregar nuevo reto
            challengeData.attempts = 1;
            history.push(challengeData);
        }

        console.log(' Challenge saved:', challengeData.challenge.title, 'planId:', challengeData.planId, 'total history:', history.length);

        // Actualizar estadísticas
        stats.totalChallenges = history.length;
        stats.completedChallenges = history.filter(
            entry => entry.evaluation?.success
        ).length;
        stats.totalAttempts = history.reduce(
            (sum, entry) => sum + (entry.attempts || 0),
            0
        );

        const scores = history
            .filter(entry => entry.evaluation?.score !== undefined)
            .map(entry => entry.evaluation.score);

        stats.averageScore = scores.length > 0
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : 0;

        // Guardar en BD
        await pool.query(
            'UPDATE user_progress SET challenge_history = ?, stats = ?, updated_at = NOW() WHERE user_id = ?',
            [JSON.stringify(history), JSON.stringify(stats), decoded.userId]
        );

        return NextResponse.json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('Error saving challenge:', error);
        return NextResponse.json(
            { error: 'Error al guardar el reto' },
            { status: 500 }
        );
    }
}
