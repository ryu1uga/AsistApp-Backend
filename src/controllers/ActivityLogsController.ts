import express, { Request, Response } from "express";
import prisma from "../config/db";

const ActivityLogsController = () => {
    const router = express.Router();

    router.get("/", async (req: Request, resp: Response) => {
        try {
            const logs = await prisma.activityLog.findMany();
            resp.json(logs);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los registros de actividad" });
        }
    })

    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const log = await prisma.activityLog.findUnique({
                where: { id: req.params.id as string }
            });
            if (!log) {
                return resp.status(404).json({ error: "Registro de actividad no encontrado" });
            }
            resp.json(log);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener el registro de actividad" });
        }
    })

    router.post("/", async (req: Request, resp: Response) => {
        try {
            const log = await prisma.activityLog.create({
                data: req.body
            });
            resp.status(201).json(log);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el registro de actividad" });
        }
    })

    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const log = await prisma.activityLog.update({
                where: { id: req.params.id as string },
                data: req.body
            });
            resp.json(log);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar el registro de actividad" });
        }
    })

    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await prisma.activityLog.delete({
                where: { id: req.params.id as string }
            });
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar el registro de actividad" });
        }
    })

    return router
};

export default ActivityLogsController;
