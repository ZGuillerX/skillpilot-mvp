import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

function parseJsonField(value, fallback) {
    if (!value) return fallback;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }
    return value;
}

function sanitizeTasks(tasks) {
    if (!Array.isArray(tasks)) return [];
    return tasks
        .filter((task) => task && typeof task === "object")
        .map((task, idx) => ({
            id: String(task.id || `task-${idx + 1}`),
            label: String(task.label || `Tarea ${idx + 1}`),
            done: Boolean(task.done),
        }))
        .slice(0, 12);
}

export async function GET(request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Token no proporcionado" }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        const { searchParams } = new URL(request.url);
        const planId = searchParams.get("planId");

        if (!planId) {
            return NextResponse.json({ error: "planId es requerido" }, { status: 400 });
        }

        const [rows] = await pool.query(
            "SELECT stats FROM user_progress WHERE user_id = ?",
            [decoded.userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Progreso no encontrado" }, { status: 404 });
        }

        const stats = parseJsonField(rows[0].stats, {});
        const liveProjects = stats.liveProjects || {};
        const board = liveProjects[planId] || { weeks: {}, updatedAt: null };

        return NextResponse.json({ success: true, board });
    } catch (error) {
        console.error("Error getting live project board:", error);
        return NextResponse.json({ error: "Error al obtener tablero" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Token no proporcionado" }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        const { planId, week, title, objective, tasks } = await request.json();

        if (!planId || !week) {
            return NextResponse.json({ error: "planId y week son requeridos" }, { status: 400 });
        }

        const weekKey = String(week);
        const safeTasks = sanitizeTasks(tasks);

        const [rows] = await pool.query(
            "SELECT stats FROM user_progress WHERE user_id = ?",
            [decoded.userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: "Progreso no encontrado" }, { status: 404 });
        }

        const stats = parseJsonField(rows[0].stats, {});
        if (!stats.liveProjects) stats.liveProjects = {};
        if (!stats.liveProjects[planId]) {
            stats.liveProjects[planId] = { weeks: {}, updatedAt: null };
        }

        const currentWeek = stats.liveProjects[planId].weeks?.[weekKey] || {};

        stats.liveProjects[planId].weeks[weekKey] = {
            title: String(title || currentWeek.title || `Semana ${weekKey}`),
            objective: String(objective || currentWeek.objective || ""),
            tasks: safeTasks.length > 0 ? safeTasks : sanitizeTasks(currentWeek.tasks),
            updatedAt: new Date().toISOString(),
        };

        stats.liveProjects[planId].updatedAt = new Date().toISOString();

        await pool.query(
            "UPDATE user_progress SET stats = ?, updated_at = NOW() WHERE user_id = ?",
            [JSON.stringify(stats), decoded.userId]
        );

        return NextResponse.json({
            success: true,
            board: stats.liveProjects[planId],
        });
    } catch (error) {
        console.error("Error updating live project board:", error);
        return NextResponse.json({ error: "Error al actualizar tablero" }, { status: 500 });
    }
}
