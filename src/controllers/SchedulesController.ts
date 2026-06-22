import express, { Request, Response } from "express";
import { schedulesService } from "../services";
import { CreateScheduleDto, UpdateScheduleDto } from "../dtos";

const SchedulesController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /schedules:
     *   get:
     *     summary: Obtener todos los horarios
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
            const schedules = await schedulesService.findAll();
            resp.json(schedules);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los horarios" });
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
            resp.json(schedule);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener el horario" });
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
            const data: CreateScheduleDto = req.body;
            const schedule = await schedulesService.create(data);
            resp.status(201).json(schedule);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el horario" });
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
            const data: UpdateScheduleDto = req.body;
            const schedule = await schedulesService.update(req.params.id as string, data);
            resp.json(schedule);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar el horario" });
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
            await schedulesService.remove(req.params.id as string);
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar el horario" });
        }
    })

    return router
};

export default SchedulesController;
