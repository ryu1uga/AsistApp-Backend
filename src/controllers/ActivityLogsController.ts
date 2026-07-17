import express, { Request, Response } from "express";
import { activityLogsService, usersService } from "../services";
import { CreateActivityLogDto, UpdateActivityLogDto } from "../dtos";
import { handleControllerError } from "../utils/validation";

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
            const currentUser = await usersService.findById(req.user!.id);
            if (!currentUser?.organizationId) {
                return resp.json([]);
            }
            const logs = await activityLogsService.findAll({ organizationId: currentUser.organizationId });
            resp.json(logs);
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al obtener los registros de actividad", context: "ActivityLogs][GET /" });
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
            const currentUser = await usersService.findById(req.user!.id);
            const log = await activityLogsService.findById(req.params.id as string);
            if (!log) {
                return resp.status(404).json({ error: "Registro de actividad no encontrado" });
            }
            if (!currentUser?.organizationId || currentUser.organizationId !== log.organizationId) {
                return resp.status(403).json({ error: "No tienes permiso para ver este registro de actividad" });
            }
            resp.json(log);
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al obtener el registro de actividad", context: "ActivityLogs][GET /:id" });
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
            const currentUser = req.user!;
            if (currentUser.role !== "admin") {
                return resp.status(403).json({ error: "No tienes permiso para crear registros de actividad" });
            }
            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId) {
                return resp.status(403).json({ error: "El usuario no pertenece a ninguna organización" });
            }

            const data: CreateActivityLogDto = { ...req.body, organizationId: admin.organizationId };
            const log = await activityLogsService.create(data);
            resp.status(201).json(log);
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al crear el registro de actividad", context: "ActivityLogs][POST /" });
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
            const currentUser = req.user!;
            if (currentUser.role !== "admin") {
                return resp.status(403).json({ error: "No tienes permiso para actualizar registros de actividad" });
            }

            const existing = await activityLogsService.findById(req.params.id as string);
            if (!existing) {
                return resp.status(404).json({ error: "Registro de actividad no encontrado" });
            }
            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId || admin.organizationId !== existing.organizationId) {
                return resp.status(403).json({ error: "No tienes permiso para actualizar este registro de actividad" });
            }

            const data: UpdateActivityLogDto = req.body;
            const log = await activityLogsService.update(req.params.id as string, data);
            resp.json(log);
        } catch (error) {
            handleControllerError(resp, error, {
                fallback: "Error al actualizar el registro de actividad",
                notFound: "Registro de actividad no encontrado",
                context: "ActivityLogs][PUT /:id",
            });
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
            const currentUser = req.user!;
            if (currentUser.role !== "admin") {
                return resp.status(403).json({ error: "No tienes permiso para eliminar registros de actividad" });
            }

            const existing = await activityLogsService.findById(req.params.id as string);
            if (!existing) {
                return resp.status(404).json({ error: "Registro de actividad no encontrado" });
            }
            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId || admin.organizationId !== existing.organizationId) {
                return resp.status(403).json({ error: "No tienes permiso para eliminar este registro de actividad" });
            }

            await activityLogsService.remove(req.params.id as string);
            resp.status(204).send();
        } catch (error) {
            handleControllerError(resp, error, {
                fallback: "Error al eliminar el registro de actividad",
                notFound: "Registro de actividad no encontrado",
                context: "ActivityLogs][DELETE /:id",
            });
        }
    })

    return router
};

export default ActivityLogsController;
