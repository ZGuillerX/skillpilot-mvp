import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST: Cambiar plan activo
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
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID requerido' },
        { status: 400 }
      );
    }

    // Obtener progreso actual
    const [rows] = await pool.query(
      'SELECT learning_plan FROM user_progress WHERE user_id = ?',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Progreso no encontrado' },
        { status: 404 }
      );
    }

    let learningPlanData = typeof rows[0].learning_plan === 'string'
      ? JSON.parse(rows[0].learning_plan)
      : rows[0].learning_plan;

    // Buscar el plan
    const plan = learningPlanData.plans?.find(p => p.id === planId);

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar plan actual
    learningPlanData.currentPlan = plan;

    // Guardar en BD
    await pool.query(
      'UPDATE user_progress SET learning_plan = ?, updated_at = NOW() WHERE user_id = ?',
      [JSON.stringify(learningPlanData), decoded.userId]
    );

    return NextResponse.json({
      success: true,
      plan: plan,
    });
  } catch (error) {
    console.error('Error switching plan:', error);
    return NextResponse.json(
      { error: 'Error al cambiar de plan' },
      { status: 500 }
    );
  }
}
