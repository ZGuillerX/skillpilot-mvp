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
            'SELECT learning_plan, challenge_history FROM user_progress WHERE user_id = ?',
            [decoded.userId]
        );

        let learningPlanData = { plans: [], currentPlan: null };
        let existingHistory = [];

        if (rows.length > 0 && rows[0].learning_plan) {
            learningPlanData = typeof rows[0].learning_plan === 'string'
                ? JSON.parse(rows[0].learning_plan)
                : rows[0].learning_plan;
            
            // Preservar el historial existente
            if (rows[0].challenge_history) {
                existingHistory = typeof rows[0].challenge_history === 'string'
                    ? JSON.parse(rows[0].challenge_history)
                    : rows[0].challenge_history;
            }
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

        // Mantener el historial existente (NO limpiarlo)
        // Los retos se mantienen con su planId para poder filtrarlos por plan

        // Actualizar en BD
        await pool.query(
            'UPDATE user_progress SET learning_plan = ?, challenge_history = ?, updated_at = NOW() WHERE user_id = ?',
            [JSON.stringify(learningPlanData), JSON.stringify(existingHistory), decoded.userId]
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
