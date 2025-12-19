import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// DELETE: Eliminar todos los planes
export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);

    // Limpiar planes y retos
    const emptyPlanData = JSON.stringify({ plans: [], currentPlan: null });
    const emptyHistory = JSON.stringify([]);

    await pool.query(
      'UPDATE user_progress SET learning_plan = ?, challenge_history = ?, updated_at = NOW() WHERE user_id = ?',
      [emptyPlanData, emptyHistory, decoded.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Todos los planes han sido eliminados',
    });
  } catch (error) {
    console.error('Error clearing plans:', error);
    return NextResponse.json(
      { error: 'Error al eliminar los planes' },
      { status: 500 }
    );
  }
}
