import express, { Request, Response } from "express";
import prisma from "../config/db";

const AttendanceRecordsController = () => {
    const router = express.Router();

    router.get("/", async (req: Request, resp: Response) => {
        try {
            const records = await prisma.attendanceRecord.findMany();
            resp.json(records);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los registros de asistencia" });
        }
    })

    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const record = await prisma.attendanceRecord.findUnique({
                where: { id: req.params.id as string }
            });
            if (!record) {
                return resp.status(404).json({ error: "Registro de asistencia no encontrado" });
            }
            resp.json(record);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener el registro de asistencia" });
        }
    })

    router.post("/", async (req: Request, resp: Response) => {
        try {
            const record = await prisma.attendanceRecord.create({
                data: req.body
            });
            resp.status(201).json(record);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el registro de asistencia" });
        }
    })

    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const record = await prisma.attendanceRecord.update({
                where: { id: req.params.id as string },
                data: req.body
            });
            resp.json(record);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar el registro de asistencia" });
        }
    })

    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await prisma.attendanceRecord.delete({
                where: { id: req.params.id as string }
            });
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar el registro de asistencia" });
        }
    })

    return router
};

export default AttendanceRecordsController;
