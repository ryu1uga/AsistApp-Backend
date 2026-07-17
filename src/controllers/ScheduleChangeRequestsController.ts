import express, { Request, Response } from "express";
import { activityLogsService, scheduleChangeRequestsService, scheduleDaysService, usersService } from "../services";
import { CreateScheduleChangeRequestDto, UpdateScheduleChangeRequestDto } from "../dtos";
import { formatTime } from "../utils/formatters";
import emailService from "../services/EmailService";
import { LogCategory } from "../generated/prisma/enums";

const serializeScheduleChangeRequest = (req: any) => ({
    ...req,
    newCheckInTime: formatTime(req.newCheckInTime),
    newLunchStartTime: formatTime(req.newLunchStartTime),
    newLunchEndTime: formatTime(req.newLunchEndTime),
    newCheckOutTime: formatTime(req.newCheckOutTime),
    scheduleDay: req.scheduleDay && {
        ...req.scheduleDay,
        checkInTime: formatTime(req.scheduleDay.checkInTime),
        lunchStartTime: formatTime(req.scheduleDay.lunchStartTime),
        lunchEndTime: formatTime(req.scheduleDay.lunchEndTime),
        checkOutTime: formatTime(req.scheduleDay.checkOutTime),
    },
});

const ScheduleChangeRequestsController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /schedule-change-requests:
     *   get:
     *     summary: Obtener las solicitudes propias (practicante) o las de la organización (admin)
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
            const currentUser = req.user!;

            if (currentUser.role === "trainee") {
                const requests = await scheduleChangeRequestsService.findAll({ userId: currentUser.id });
                return resp.json(requests.map(serializeScheduleChangeRequest));
            }

            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId) {
                return resp.status(403).json({ error: "El usuario no pertenece a ninguna organización" });
            }
            const requests = await scheduleChangeRequestsService.findAll({ organizationId: admin.organizationId });
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
            const request = await scheduleChangeRequestsService.findById(req.params.id as string);
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
            const currentUser = req.user!;
            const data: CreateScheduleChangeRequestDto = req.body;

            if (currentUser.role === "trainee") {
                const scheduleDay = await scheduleDaysService.findById(data.scheduleDayId);
                if (!scheduleDay || (scheduleDay as any).schedule?.userId !== currentUser.id) {
                    return resp.status(403).json({ error: "No tienes permiso para modificar este día de horario" });
                }
                data.userId = currentUser.id;
            }

            const request = await scheduleChangeRequestsService.create(data);
            resp.status(201).json(serializeScheduleChangeRequest(request));

            const scheduleDay = await scheduleDaysService.findById(request.scheduleDayId);
            const organizationId = (scheduleDay as any)?.schedule?.organizationId;
            if (organizationId) {
                await activityLogsService.log({
                    organizationId,
                    performedById: currentUser.id,
                    affectedUserId: request.userId,
                    title: "Solicitud de cambio de horario creada",
                    category: LogCategory.schedule,
                });
            }
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
            const currentUser = req.user!;
            const data: UpdateScheduleChangeRequestDto = req.body;
            const requestId = req.params.id as string;

            const existing = await scheduleChangeRequestsService.findById(requestId);
            if (!existing) {
                return resp.status(404).json({ error: "Solicitud de cambio de horario no encontrada" });
            }

            const sendStatusEmail = data.status === "approved" || data.status === "rejected";
            if (sendStatusEmail) {
                data.reviewedById = currentUser.id;
            }

            const request = await scheduleChangeRequestsService.update(requestId, data);
            resp.json(serializeScheduleChangeRequest(request));

            const scheduleDay = await scheduleDaysService.findById(request.scheduleDayId);
            const organizationId = (scheduleDay as any)?.schedule?.organizationId;
            if (organizationId) {
                await activityLogsService.log({
                    organizationId,
                    performedById: currentUser.id,
                    affectedUserId: request.userId,
                    title: "Solicitud de cambio de horario actualizada",
                    category: LogCategory.schedule,
                });
            }

            if (sendStatusEmail) {
                const trainee = await usersService.findById(existing.userId);
                if (trainee) {
                    if (data.status === "approved") {
                        emailService.sendScheduleApproved(trainee.institutionalEmail, trainee.firstName);
                    } else {
                        emailService.sendScheduleRejected(trainee.institutionalEmail, trainee.firstName);
                    }
                }
            }
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
            const request = await scheduleChangeRequestsService.findById(req.params.id as string);
            if (!request) {
                return resp.status(404).json({ error: "Solicitud de cambio de horario no encontrada" });
            }

            await scheduleChangeRequestsService.remove(req.params.id as string);
            resp.status(204).send();

            const scheduleDay = await scheduleDaysService.findById(request.scheduleDayId);
            const organizationId = (scheduleDay as any)?.schedule?.organizationId;
            if (organizationId) {
                await activityLogsService.log({
                    organizationId,
                    performedById: req.user!.id,
                    affectedUserId: request.userId,
                    title: "Solicitud de cambio de horario eliminada",
                    category: LogCategory.schedule,
                });
            }
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar la solicitud de cambio de horario" });
        }
    })

    return router
};

export default ScheduleChangeRequestsController;
