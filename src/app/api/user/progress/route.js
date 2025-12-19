import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET: Obtener progreso del usuario
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

    const [rows] = await pool.query(
      'SELECT learning_plan, challenge_history, stats FROM user_progress WHERE user_id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Progreso no encontrado' },
        { status: 404 }
      );
    }

    const progress = rows[0];

    // Parsear JSON solo si es string (MySQL puede devolverlo ya parseado)
    const learningPlan = typeof progress.learning_plan === 'string' 
      ? JSON.parse(progress.learning_plan) 
      : progress.learning_plan || null;
    
    const challengeHistory = typeof progress.challenge_history === 'string'
      ? JSON.parse(progress.challenge_history)
      : progress.challenge_history || [];
    
    const stats = typeof progress.stats === 'string'
      ? JSON.parse(progress.stats)
      : progress.stats || {};

    return NextResponse.json({
      progress: {
        learning_plan: learningPlan,
        challenge_history: challengeHistory,
        stats: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Error al obtener el progreso' },
      { status: 500 }
    );
  }
}
