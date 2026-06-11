import express, { Request, Response } from "express";
import prisma from "../config/db";

const ScheduleChangeRequestsController = () => {
    const router = express.Router();

    router.get("/", async (req: Request, resp: Response) => {
        try {
            const requests = await prisma.scheduleChangeRequest.findMany();
            resp.json(requests);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener las solicitudes de cambio de horario" });
        }
    })

    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const request = await prisma.scheduleChangeRequest.findUnique({
                where: { id: req.params.id as string }
            });
            if (!request) {
                return resp.status(404).json({ error: "Solicitud de cambio de horario no encontrada" });
            }
            resp.json(request);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener la solicitud de cambio de horario" });
        }
    })

    router.post("/", async (req: Request, resp: Response) => {
        try {
            const request = await prisma.scheduleChangeRequest.create({
                data: req.body
            });
            resp.status(201).json(request);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear la solicitud de cambio de horario" });
        }
    })

    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const request = await prisma.scheduleChangeRequest.update({
                where: { id: req.params.id as string },
                data: req.body
            });
            resp.json(request);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar la solicitud de cambio de horario" });
        }
    })

    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await prisma.scheduleChangeRequest.delete({
                where: { id: req.params.id as string }
            });
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar la solicitud de cambio de horario" });
        }
    })

    return router
};

export default ScheduleChangeRequestsController;
