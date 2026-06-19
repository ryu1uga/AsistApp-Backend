import express, { Request, Response } from "express";
import prisma from "../config/db";
import { CreateScheduleChangeRequestDto, UpdateScheduleChangeRequestDto } from "../dtos";
import { RequestStatus } from "../generated/prisma/enums";
import { formatTime } from "../utils/formatters";

const serializeScheduleChangeRequest = (req: any) => ({
    ...req,
    newCheckInTime: formatTime(req.newCheckInTime),
    newLunchStartTime: formatTime(req.newLunchStartTime),
    newLunchEndTime: formatTime(req.newLunchEndTime),
    newCheckOutTime: formatTime(req.newCheckOutTime),
});

const ScheduleChangeRequestsController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /schedule-change-requests:
     *   get:
     *     summary: Obtener todas las solicitudes de cambio de horario
     *     tags: [ScheduleChangeRequests]
     *     responses:
     *       200:
     *         description: Lista de solicitudes de cambio de horario
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ScheduleChangeRequest'
     */
    router.get("/", async (req: Request, resp: Response) => {
        try {
            const requests = await prisma.scheduleChangeRequest.findMany();
            resp.json(requests.map(serializeScheduleChangeRequest));
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener las solicitudes de cambio de horario" });
        }
    })

    /**
     * @openapi
     * /schedule-change-requests/{id}:
     *   get:
     *     summary: Obtener una solicitud de cambio de horario por ID
     *     tags: [ScheduleChangeRequests]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Solicitud de cambio de horario encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ScheduleChangeRequest'
     *       404:
     *         description: Solicitud de cambio de horario no encontrada
     */
    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const request = await prisma.scheduleChangeRequest.findUnique({
                where: { id: req.params.id as string }
            });
            if (!request) {
                return resp.status(404).json({ error: "Solicitud de cambio de horario no encontrada" });
            }
            resp.json(serializeScheduleChangeRequest(request));
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener la solicitud de cambio de horario" });
        }
    })

    /**
     * @openapi
     * /schedule-change-requests:
     *   post:
     *     summary: Crear una solicitud de cambio de horario
     *     tags: [ScheduleChangeRequests]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateScheduleChangeRequestDto'
     *     responses:
     *       201:
     *         description: Solicitud de cambio de horario creada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ScheduleChangeRequest'
     */
    router.post("/", async (req: Request, resp: Response) => {
        try {
            const data: CreateScheduleChangeRequestDto = req.body;
            const request = await prisma.scheduleChangeRequest.create({
                data: {
                    ...data,
                    status: RequestStatus.pending
                }
            });
            resp.status(201).json(serializeScheduleChangeRequest(request));
        } catch (error) {
            resp.status(500).json({ error: "Error al crear la solicitud de cambio de horario" });
        }
    })

    /**
     * @openapi
     * /schedule-change-requests/{id}:
     *   put:
     *     summary: Actualizar una solicitud de cambio de horario
     *     tags: [ScheduleChangeRequests]
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
     *             $ref: '#/components/schemas/UpdateScheduleChangeRequestDto'
     *     responses:
     *       200:
     *         description: Solicitud de cambio de horario actualizada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ScheduleChangeRequest'
     */
    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const data: UpdateScheduleChangeRequestDto = req.body;
            const request = await prisma.scheduleChangeRequest.update({
                where: { id: req.params.id as string },
                data
            });
            resp.json(serializeScheduleChangeRequest(request));
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar la solicitud de cambio de horario" });
        }
    })

    /**
     * @openapi
     * /schedule-change-requests/{id}:
     *   delete:
     *     summary: Eliminar una solicitud de cambio de horario
     *     tags: [ScheduleChangeRequests]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Solicitud de cambio de horario eliminada
     */
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
