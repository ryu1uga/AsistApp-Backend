import express, { Request, Response } from "express";
import prisma from "../config/db";
import { CreateScheduleDayDto, UpdateScheduleDayDto } from "../dtos";

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
            const scheduleDays = await prisma.scheduleDay.findMany();
            resp.json(scheduleDays);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los días de horario" });
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
            const scheduleDays = await prisma.scheduleDay.findMany({
                where: { scheduleId: req.params.scheduleId as string }
            });
            resp.json(scheduleDays);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los días de horario del horario" });
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
            const data: CreateScheduleDayDto = req.body;
            const scheduleDay = await prisma.scheduleDay.create({
                data
            });
            resp.status(201).json(scheduleDay);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el día de horario" });
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
            const data: UpdateScheduleDayDto = req.body;
            const scheduleDay = await prisma.scheduleDay.update({
                where: { id: req.params.id as string },
                data
            });
            resp.json(scheduleDay);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar el día de horario" });
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
