import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const MAX_PLANS = 5;

// POST: Guardar nuevo plan de aprendizaje
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
    const { plan } = await request.json();

    if (!plan || !plan.goal) {
      return NextResponse.json(
        { error: 'Datos del plan inválidos' },
        { status: 400 }
      );
    }

    // Obtener progreso actual
    const [rows] = await pool.query(
      'SELECT learning_plan FROM user_progress WHERE user_id = ?',
      [decoded.userId]
    );

    let learningPlanData = { plans: [], currentPlan: null };

    if (rows.length > 0 && rows[0].learning_plan) {
      learningPlanData = typeof rows[0].learning_plan === 'string'
        ? JSON.parse(rows[0].learning_plan)
        : rows[0].learning_plan;
    }

    // Verificar límite de planes
    if (!learningPlanData.plans) learningPlanData.plans = [];
    
    if (learningPlanData.plans.length >= MAX_PLANS) {
      return NextResponse.json(
        { 
          error: 'Has alcanzado el límite de 5 planes de aprendizaje',
          limit: true,
          currentCount: learningPlanData.plans.length,
        },
        { status: 400 }
      );
    }

    // Crear nuevo plan con ID y timestamp
    const newPlan = {
      id: `plan-${Date.now()}`,
      ...plan,
      createdAt: new Date().toISOString(),
    };

    // Agregar a la lista de planes
    learningPlanData.plans.push(newPlan);
    learningPlanData.currentPlan = newPlan;

    // Cuando se crea un nuevo plan, LIMPIAR el historial de retos
    const cleanHistory = [];

    // Actualizar en BD
    await pool.query(
      'UPDATE user_progress SET learning_plan = ?, challenge_history = ?, updated_at = NOW() WHERE user_id = ?',
      [JSON.stringify(learningPlanData), JSON.stringify(cleanHistory), decoded.userId]
    );

    return NextResponse.json({
      success: true,
      plan: newPlan,
      plansCount: learningPlanData.plans.length,
    });
  } catch (error) {
    console.error('Error saving plan:', error);
    return NextResponse.json(
      { error: 'Error al guardar el plan' },
      { status: 500 }
    );
  }
}
