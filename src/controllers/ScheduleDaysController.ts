import express, { Request, Response } from "express";
import prisma from "../config/db";

const ScheduleDaysController = () => {
    const router = express.Router();

    router.get("/", async (req: Request, resp: Response) => {
        try {
            const scheduleDays = await prisma.scheduleDay.findMany();
            resp.json(scheduleDays);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los días de horario" });
        }
    })

    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const scheduleDay = await prisma.scheduleDay.findUnique({
                where: { id: req.params.id as string }
            });
            if (!scheduleDay) {
                return resp.status(404).json({ error: "Día de horario no encontrado" });
            }
            resp.json(scheduleDay);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener el día de horario" });
        }
    })

    router.post("/", async (req: Request, resp: Response) => {
        try {
            const scheduleDay = await prisma.scheduleDay.create({
                data: req.body
            });
            resp.status(201).json(scheduleDay);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el día de horario" });
        }
    })

    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const scheduleDay = await prisma.scheduleDay.update({
                where: { id: req.params.id as string },
                data: req.body
            });
            resp.json(scheduleDay);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar el día de horario" });
        }
    })

    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await prisma.scheduleDay.delete({
                where: { id: req.params.id as string }
            });
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar el día de horario" });
        }
    })

    return router
};

export default ScheduleDaysController;
