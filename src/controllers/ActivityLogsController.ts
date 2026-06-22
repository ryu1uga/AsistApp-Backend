import express, { Request, Response } from "express";
import { activityLogsService } from "../services";
import { CreateActivityLogDto, UpdateActivityLogDto } from "../dtos";

const ActivityLogsController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /activity-logs:
     *   get:
     *     summary: Obtener todos los registros de actividad
     *     tags: [ActivityLogs]
     *     responses:
     *       200:
     *         description: Lista de registros de actividad
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ActivityLog'
     */
    router.get("/", async (req: Request, resp: Response) => {
        try {
            const logs = await activityLogsService.findAll();
            resp.json(logs);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los registros de actividad" });
        }
    })

    /**
     * @openapi
     * /activity-logs/{id}:
     *   get:
     *     summary: Obtener un registro de actividad por ID
     *     tags: [ActivityLogs]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Registro de actividad encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ActivityLog'
     *       404:
     *         description: Registro de actividad no encontrado
     */
    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const log = await activityLogsService.findById(req.params.id as string);
            if (!log) {
                return resp.status(404).json({ error: "Registro de actividad no encontrado" });
            }
            resp.json(log);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener el registro de actividad" });
        }
    })

    /**
     * @openapi
     * /activity-logs:
     *   post:
     *     summary: Crear un registro de actividad
     *     tags: [ActivityLogs]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateActivityLogDto'
     *     responses:
     *       201:
     *         description: Registro de actividad creado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ActivityLog'
     */
    router.post("/", async (req: Request, resp: Response) => {
        try {
            const data: CreateActivityLogDto = req.body;
            const log = await activityLogsService.create(data);
            resp.status(201).json(log);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el registro de actividad" });
        }
    })

    /**
     * @openapi
     * /activity-logs/{id}:
     *   put:
     *     summary: Actualizar un registro de actividad
     *     tags: [ActivityLogs]
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
     *             $ref: '#/components/schemas/UpdateActivityLogDto'
     *     responses:
     *       200:
     *         description: Registro de actividad actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ActivityLog'
     */
    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const data: UpdateActivityLogDto = req.body;
            const log = await activityLogsService.update(req.params.id as string, data);
            resp.json(log);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar el registro de actividad" });
        }
    })

    /**
     * @openapi
     * /activity-logs/{id}:
     *   delete:
     *     summary: Eliminar un registro de actividad
     *     tags: [ActivityLogs]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Registro de actividad eliminado
     */
    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await activityLogsService.remove(req.params.id as string);
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar el registro de actividad" });
        }
    })

    return router
};

export default ActivityLogsController;
