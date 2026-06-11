import express, { Request, Response } from "express";
import prisma from "../config/db";

const AttendanceRequestsController = () => {
    const router = express.Router();

    router.get("/", async (req: Request, resp: Response) => {
        try {
            const requests = await prisma.attendanceRequest.findMany();
            resp.json(requests);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener las solicitudes de asistencia" });
        }
    })

    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const request = await prisma.attendanceRequest.findUnique({
                where: { id: req.params.id as string }
            });
            if (!request) {
                return resp.status(404).json({ error: "Solicitud de asistencia no encontrada" });
            }
            resp.json(request);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener la solicitud de asistencia" });
        }
    })

    router.post("/", async (req: Request, resp: Response) => {
        try {
            const request = await prisma.attendanceRequest.create({
                data: req.body
            });
            resp.status(201).json(request);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear la solicitud de asistencia" });
        }
    })

    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const request = await prisma.attendanceRequest.update({
                where: { id: req.params.id as string },
                data: req.body
            });
            resp.json(request);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar la solicitud de asistencia" });
        }
    })

    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await prisma.attendanceRequest.delete({
                where: { id: req.params.id as string }
            });
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar la solicitud de asistencia" });
        }
    })

    return router
};

export default AttendanceRequestsController;
