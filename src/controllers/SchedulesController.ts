import express, { Request, Response } from "express";
import { activityLogsService, schedulesService, usersService } from "../services";
import { CreateScheduleDto, UpdateScheduleDto } from "../dtos";
import { formatTime } from "../utils/formatters";
import emailService from "../services/EmailService";
import { LogCategory } from "../generated/prisma/enums";
import { handleControllerError } from "../utils/validation";

const serializeSchedule = (schedule: any) => ({
    ...schedule,
    days: schedule.days?.map((day: any) => ({
        ...day,
        checkInTime: formatTime(day.checkInTime),
        lunchStartTime: formatTime(day.lunchStartTime),
        lunchEndTime: formatTime(day.lunchEndTime),
        checkOutTime: formatTime(day.checkOutTime),
    })),
});

const SchedulesController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /schedules:
     *   get:
     *     summary: Obtener el horario propio (practicante) o los de la organización (admin)
     *     tags: [Schedules]
     *     responses:
     *       200:
     *         description: Lista de horarios
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Schedule'
     */
    router.get("/", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;

            if (currentUser.role === "trainee") {
                const schedules = await schedulesService.findAll({ userId: currentUser.id });
                return resp.json(schedules.map(serializeSchedule));
            }

            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId) {
                return resp.status(403).json({ error: "El usuario no pertenece a ninguna organización" });
            }
            const schedules = await schedulesService.findAll({ organizationId: admin.organizationId });
            resp.json(schedules.map(serializeSchedule));
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al obtener los horarios", context: "Schedules][GET /" });
        }
    })

    /**
     * @openapi
     * /schedules/{id}:
     *   get:
     *     summary: Obtener un horario por ID
     *     tags: [Schedules]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Horario encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Schedule'
     *       404:
     *         description: Horario no encontrado
     */
    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const schedule = await schedulesService.findById(req.params.id as string);
            if (!schedule) {
                return resp.status(404).json({ error: "Horario no encontrado" });
            }
            resp.json(serializeSchedule(schedule));
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al obtener el horario", context: "Schedules][GET /:id" });
        }
    })

    /**
     * @openapi
     * /schedules:
     *   post:
     *     summary: Crear un horario
     *     tags: [Schedules]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateScheduleDto'
     *     responses:
     *       201:
     *         description: Horario creado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Schedule'
     */
    router.post("/", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            const data: CreateScheduleDto = req.body;

            if (currentUser.role === "trainee") {
                const trainee = await usersService.findById(currentUser.id);
                if (!trainee?.organizationId) {
                    return resp.status(403).json({ error: "El usuario no pertenece a ninguna organización" });
                }
                data.userId = currentUser.id;
                data.organizationId = trainee.organizationId;
                data.status = "pending";
            }

            const schedule = await schedulesService.create(data);
            resp.status(201).json(serializeSchedule(schedule));

            await activityLogsService.log({
                organizationId: schedule.organizationId,
                performedById: currentUser.id,
                affectedUserId: schedule.userId,
                title: "Horario creado",
                category: LogCategory.schedule,
            });
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al crear el horario", context: "Schedules][POST /" });
        }
    })

    /**
     * @openapi
     * /schedules/{id}:
     *   put:
     *     summary: Actualizar un horario
     *     tags: [Schedules]
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
     *             $ref: '#/components/schemas/UpdateScheduleDto'
     *     responses:
     *       200:
     *         description: Horario actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Schedule'
     */
    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            const data: UpdateScheduleDto = req.body;
            const scheduleId = req.params.id as string;

            const existingSchedule = await schedulesService.findById(scheduleId);
            if (!existingSchedule) {
                return resp.status(404).json({ error: "Horario no encontrado" });
            }

            if (currentUser.role === "trainee") {
                if (existingSchedule.userId !== currentUser.id) {
                    return resp.status(403).json({ error: "No tienes permiso para modificar este horario" });
                }
                delete data.userId;
                delete data.organizationId;
                data.status = "pending";
            }

            const sendStatusEmail = data.status === "approved" || data.status === "rejected";

            const schedule = await schedulesService.update(scheduleId, data);
            resp.json(serializeSchedule(schedule));

            await activityLogsService.log({
                organizationId: schedule.organizationId,
                performedById: currentUser.id,
                affectedUserId: schedule.userId,
                title: "Horario actualizado",
                category: LogCategory.schedule,
            });

            if (sendStatusEmail) {
                const trainee = await usersService.findById(existingSchedule.userId);
                if (trainee) {
                    if (data.status === "approved") {
                        emailService.sendScheduleApproved(trainee.institutionalEmail, trainee.firstName);
                    } else {
                        emailService.sendScheduleRejected(trainee.institutionalEmail, trainee.firstName);
                    }
                }
            }
        } catch (error) {
            handleControllerError(resp, error, {
                fallback: "Error al actualizar el horario",
                notFound: "Horario no encontrado",
                context: "Schedules][PUT /:id",
            });
        }
    })

    /**
     * @openapi
     * /schedules/{id}:
     *   delete:
     *     summary: Eliminar un horario
     *     tags: [Schedules]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Horario eliminado
     */
    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            const schedule = await schedulesService.findById(req.params.id as string);
            if (!schedule) {
                return resp.status(404).json({ error: "Horario no encontrado" });
            }

            await schedulesService.remove(req.params.id as string);
            resp.status(204).send();

            await activityLogsService.log({
                organizationId: schedule.organizationId,
                performedById: req.user!.id,
                affectedUserId: schedule.userId,
                title: "Horario eliminado",
                category: LogCategory.schedule,
            });
        } catch (error) {
            handleControllerError(resp, error, {
                fallback: "Error al eliminar el horario",
                notFound: "Horario no encontrado",
                context: "Schedules][DELETE /:id",
            });
        }
    })

    return router
};

export default SchedulesController;
