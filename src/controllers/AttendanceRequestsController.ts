import express, { Request, Response } from "express";
import prisma from "../config/db";

const AttendanceRequestsController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /attendance-requests:
     *   get:
     *     summary: Obtener todas las solicitudes de asistencia
     *     tags: [AttendanceRequests]
     *     responses:
     *       200:
     *         description: Lista de solicitudes de asistencia
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/AttendanceRequest'
     */
    router.get("/", async (req: Request, resp: Response) => {
        try {
            const requests = await prisma.attendanceRequest.findMany();
            resp.json(requests);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener las solicitudes de asistencia" });
        }
    })

    /**
     * @openapi
     * /attendance-requests/{id}:
     *   get:
     *     summary: Obtener una solicitud de asistencia por ID
     *     tags: [AttendanceRequests]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Solicitud de asistencia encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AttendanceRequest'
     *       404:
     *         description: Solicitud de asistencia no encontrada
     */
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

    /**
     * @openapi
     * /attendance-requests:
     *   post:
     *     summary: Crear una solicitud de asistencia
     *     tags: [AttendanceRequests]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AttendanceRequest'
     *     responses:
     *       201:
     *         description: Solicitud de asistencia creada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AttendanceRequest'
     */
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

    /**
     * @openapi
     * /attendance-requests/{id}:
     *   put:
     *     summary: Actualizar una solicitud de asistencia
     *     tags: [AttendanceRequests]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AttendanceRequest'
     *     responses:
     *       200:
     *         description: Solicitud de asistencia actualizada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AttendanceRequest'
     */
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

    /**
     * @openapi
     * /attendance-requests/{id}:
     *   delete:
     *     summary: Eliminar una solicitud de asistencia
     *     tags: [AttendanceRequests]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Solicitud de asistencia eliminada
     */
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
