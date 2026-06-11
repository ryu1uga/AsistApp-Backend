import express, { Request, Response } from "express";
import prisma from "../config/db";

const SchedulesController = () => {
    const router = express.Router();

    router.get("/", async (req: Request, resp: Response) => {
        try {
            const schedules = await prisma.schedule.findMany();
            resp.json(schedules);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los horarios" });
        }
    })

    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const schedule = await prisma.schedule.findUnique({
                where: { id: req.params.id as string }
            });
            if (!schedule) {
                return resp.status(404).json({ error: "Horario no encontrado" });
            }
            resp.json(schedule);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener el horario" });
        }
    })

    router.post("/", async (req: Request, resp: Response) => {
        try {
            const schedule = await prisma.schedule.create({
                data: req.body
            });
            resp.status(201).json(schedule);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el horario" });
        }
    })

    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const schedule = await prisma.schedule.update({
                where: { id: req.params.id as string },
                data: req.body
            });
            resp.json(schedule);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar el horario" });
        }
    })

    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await prisma.schedule.delete({
                where: { id: req.params.id as string }
            });
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar el horario" });
        }
    })

    return router
};

export default SchedulesController;
