import express, { Request, Response } from "express";
import { activityLogsService, scheduleDaysService, schedulesService, usersService } from "../services";
import { CreateScheduleDayDto, UpdateScheduleDayDto } from "../dtos";
import { formatTime } from "../utils/formatters";
import { LogCategory } from "../generated/prisma/enums";
import { handleControllerError } from "../utils/validation";

const serializeScheduleDay = (day: any) => ({
    ...day,
    checkInTime: formatTime(day.checkInTime),
    lunchStartTime: formatTime(day.lunchStartTime),
    lunchEndTime: formatTime(day.lunchEndTime),
    checkOutTime: formatTime(day.checkOutTime),
});

/**
 * Verifica que el usuario autenticado tenga permiso sobre el horario dado:
 * un trainee solo puede operar sobre su propio horario, un admin solo sobre
 * horarios de su propia organización.
 */
const canAccessSchedule = async (
    currentUser: { id: string; role: string },
    schedule: { userId: string; organizationId: string }
): Promise<boolean> => {
    if (currentUser.role === "trainee") {
        return schedule.userId === currentUser.id;
    }
    const admin = await usersService.findById(currentUser.id);
    return !!admin?.organizationId && admin.organizationId === schedule.organizationId;
};

const ScheduleDaysController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /schedule-days:
     *   get:
     *     summary: Obtener todos los días de horario
     *     tags: [ScheduleDays]
     *     responses:
     *       200:
     *         description: Lista de días de horario
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ScheduleDay'
     */
    router.get("/", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;

            if (currentUser.role === "trainee") {
                const scheduleDays = await scheduleDaysService.findAll({ userId: currentUser.id });
                return resp.json(scheduleDays.map(serializeScheduleDay));
            }

            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId) {
                return resp.status(403).json({ error: "El usuario no pertenece a ninguna organización" });
            }
            const scheduleDays = await scheduleDaysService.findAll({ organizationId: admin.organizationId });
            resp.json(scheduleDays.map(serializeScheduleDay));
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al obtener los días de horario", context: "ScheduleDays][GET /" });
        }
    })

    /**
     * @openapi
     * /schedule-days/schedule/{scheduleId}:
     *   get:
     *     summary: Obtener todos los días de horario de un horario específico
     *     tags: [ScheduleDays]
     *     parameters:
     *       - in: path
     *         name: scheduleId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Lista de días de horario del horario indicado
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ScheduleDay'
     */
    router.get("/schedule/:scheduleId", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            const schedule = await schedulesService.findById(req.params.scheduleId as string);
            if (!schedule) {
                return resp.status(404).json({ error: "Horario no encontrado" });
            }
            if (!(await canAccessSchedule(currentUser, schedule))) {
                return resp.status(403).json({ error: "No tienes permiso para ver estos días de horario" });
            }

            const scheduleDays = await scheduleDaysService.findByScheduleId(req.params.scheduleId as string);
            resp.json(scheduleDays.map(serializeScheduleDay));
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al obtener los días de horario del horario", context: "ScheduleDays][GET /schedule/:scheduleId" });
        }
    })

    /**
     * @openapi
     * /schedule-days/{id}:
     *   get:
     *     summary: Obtener un día de horario por ID
     *     tags: [ScheduleDays]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Día de horario encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ScheduleDay'
     *       404:
     *         description: Día de horario no encontrado
     */
    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            const scheduleDay = await scheduleDaysService.findById(req.params.id as string);
            if (!scheduleDay) {
                return resp.status(404).json({ error: "Día de horario no encontrado" });
            }
            const schedule = (scheduleDay as any).schedule;
            if (!schedule || !(await canAccessSchedule(currentUser, schedule))) {
                return resp.status(403).json({ error: "No tienes permiso para ver este día de horario" });
            }
            resp.json(serializeScheduleDay(scheduleDay));
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al obtener el día de horario", context: "ScheduleDays][GET /:id" });
        }
    })

    /**
     * @openapi
     * /schedule-days:
     *   post:
     *     summary: Crear un día de horario
     *     tags: [ScheduleDays]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateScheduleDayDto'
     *     responses:
     *       201:
     *         description: Día de horario creado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ScheduleDay'
     */
    router.post("/", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            const data: CreateScheduleDayDto = req.body;

            const schedule = await schedulesService.findById(data.scheduleId);
            if (!schedule) {
                return resp.status(404).json({ error: "Horario no encontrado" });
            }
            if (!(await canAccessSchedule(currentUser, schedule))) {
                return resp.status(403).json({ error: "No tienes permiso para modificar este horario" });
            }

            const scheduleDay = await scheduleDaysService.create(data);
            resp.status(201).json(serializeScheduleDay(scheduleDay));

            await activityLogsService.log({
                organizationId: schedule.organizationId,
                performedById: currentUser.id,
                affectedUserId: schedule.userId,
                title: "Día de horario creado",
                category: LogCategory.schedule,
            });
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al crear el día de horario", context: "ScheduleDays][POST /" });
        }
    })

    /**
     * @openapi
     * /schedule-days/{id}:
     *   put:
     *     summary: Actualizar un día de horario
     *     tags: [ScheduleDays]
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
     *             $ref: '#/components/schemas/UpdateScheduleDayDto'
     *     responses:
     *       200:
     *         description: Día de horario actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ScheduleDay'
     */
    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            const data: UpdateScheduleDayDto = req.body;
            const existing = await scheduleDaysService.findById(req.params.id as string);
            if (!existing) {
                return resp.status(404).json({ error: "Día de horario no encontrado" });
            }

            const schedule = (existing as any).schedule;
            if (!schedule || !(await canAccessSchedule(currentUser, schedule))) {
                return resp.status(403).json({ error: "No tienes permiso para modificar este día de horario" });
            }

            const scheduleDay = await scheduleDaysService.update(req.params.id as string, data);
            resp.json(serializeScheduleDay(scheduleDay));

            await activityLogsService.log({
                organizationId: schedule.organizationId,
                performedById: currentUser.id,
                affectedUserId: schedule.userId,
                title: "Día de horario actualizado",
                category: LogCategory.schedule,
            });
        } catch (error) {
            handleControllerError(resp, error, {
                fallback: "Error al actualizar el día de horario",
                notFound: "Día de horario no encontrado",
                context: "ScheduleDays][PUT /:id",
            });
        }
    })

    /**
     * @openapi
     * /schedule-days/{id}:
     *   delete:
     *     summary: Eliminar un día de horario
     *     tags: [ScheduleDays]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Día de horario eliminado
     */
    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            const existing = await scheduleDaysService.findById(req.params.id as string);
            if (!existing) {
                return resp.status(404).json({ error: "Día de horario no encontrado" });
            }

            const schedule = (existing as any).schedule;
            if (!schedule || !(await canAccessSchedule(currentUser, schedule))) {
                return resp.status(403).json({ error: "No tienes permiso para eliminar este día de horario" });
            }

            await scheduleDaysService.remove(req.params.id as string);
            resp.status(204).send();

            await activityLogsService.log({
                organizationId: schedule.organizationId,
                performedById: currentUser.id,
                affectedUserId: schedule.userId,
                title: "Día de horario eliminado",
                category: LogCategory.schedule,
            });
        } catch (error) {
            handleControllerError(resp, error, {
                fallback: "Error al eliminar el día de horario",
                notFound: "Día de horario no encontrado",
                context: "ScheduleDays][DELETE /:id",
            });
        }
    })

    return router
};

export default ScheduleDaysController;
