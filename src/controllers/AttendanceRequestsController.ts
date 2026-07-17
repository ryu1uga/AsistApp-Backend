import express, { Request, Response } from "express";
import { activityLogsService, attendanceRequestsService, usersService } from "../services";
import { CreateAttendanceRequestDto, UpdateAttendanceRequestDto } from "../dtos";
import { formatDate } from "../utils/formatters";
import { LogCategory } from "../generated/prisma/enums";

const serializeAttendanceRequest = (req: any) => ({
    ...req,
    requestedDate: formatDate(req.requestedDate),
});

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
            const currentUser = req.user!;

            if (currentUser.role === "trainee") {
                const requests = await attendanceRequestsService.findAll({ userId: currentUser.id });
                return resp.json(requests.map(serializeAttendanceRequest));
            }

            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId) {
                return resp.status(403).json({ error: "El usuario no pertenece a ninguna organización" });
            }
            const requests = await attendanceRequestsService.findAll({ organizationId: admin.organizationId });
            resp.json(requests.map(serializeAttendanceRequest));
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
            const request = await attendanceRequestsService.findById(req.params.id as string);
            if (!request) {
                return resp.status(404).json({ error: "Solicitud de asistencia no encontrada" });
            }
            resp.json(serializeAttendanceRequest(request));
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
     *             $ref: '#/components/schemas/CreateAttendanceRequestDto'
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
            const data: CreateAttendanceRequestDto = req.body;
            const request = await attendanceRequestsService.create(data);
            resp.status(201).json(serializeAttendanceRequest(request));

            await activityLogsService.log({
                organizationId: data.organizationId,
                performedById: req.user!.id,
                affectedUserId: data.userId,
                title: "Solicitud de asistencia creada",
                category: LogCategory.attendance,
            });
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
     *             $ref: '#/components/schemas/UpdateAttendanceRequestDto'
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
            const data: UpdateAttendanceRequestDto = req.body;
            const request = await attendanceRequestsService.update(req.params.id as string, data);
            resp.json(serializeAttendanceRequest(request));

            await activityLogsService.log({
                organizationId: request.organizationId,
                performedById: req.user!.id,
                affectedUserId: request.userId,
                title: "Solicitud de asistencia actualizada",
                category: LogCategory.attendance,
            });
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
            const request = await attendanceRequestsService.findById(req.params.id as string);
            if (!request) {
                return resp.status(404).json({ error: "Solicitud de asistencia no encontrada" });
            }

            await attendanceRequestsService.remove(req.params.id as string);
            resp.status(204).send();

            await activityLogsService.log({
                organizationId: request.organizationId,
                performedById: req.user!.id,
                affectedUserId: request.userId,
                title: "Solicitud de asistencia eliminada",
                category: LogCategory.attendance,
            });
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar la solicitud de asistencia" });
        }
    })

    return router
};

export default AttendanceRequestsController;
