import express, { Request, Response } from "express";
import { attendanceRecordsService, usersService } from "../services";
import { CreateAttendanceRecordDto, UpdateAttendanceRecordDto } from "../dtos";
import { formatDate } from "../utils/formatters";

const serializeAttendanceRecord = (record: any) => ({
    ...record,
    date: formatDate(record.date),
});

const AttendanceRecordsController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /attendance-records:
     *   get:
     *     summary: Obtener todos los registros de asistencia
     *     tags: [AttendanceRecords]
     *     responses:
     *       200:
     *         description: Lista de registros de asistencia
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/AttendanceRecord'
     */
    router.get("/", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;

            if (currentUser.role === "trainee") {
                const records = await attendanceRecordsService.findAll({ userId: currentUser.id });
                return resp.json(records.map(serializeAttendanceRecord));
            }

            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId) {
                return resp.status(403).json({ error: "El usuario no pertenece a ninguna organización" });
            }
            const records = await attendanceRecordsService.findAll({ organizationId: admin.organizationId });
            resp.json(records.map(serializeAttendanceRecord));
        } catch (error) {
            console.error("[AttendanceRecords][GET /]", error);
            resp.status(500).json({ error: "Error al obtener los registros de asistencia" });
        }
    })

    /**
     * @openapi
     * /attendance-records/{id}:
     *   get:
     *     summary: Obtener un registro de asistencia por ID
     *     tags: [AttendanceRecords]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Registro de asistencia encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AttendanceRecord'
     *       404:
     *         description: Registro de asistencia no encontrado
     */
    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const record = await attendanceRecordsService.findById(req.params.id as string);
            if (!record) {
                return resp.status(404).json({ error: "Registro de asistencia no encontrado" });
            }
            resp.json(serializeAttendanceRecord(record));
        } catch (error) {
            console.error("[AttendanceRecords][GET /:id]", error);
            resp.status(500).json({ error: "Error al obtener el registro de asistencia" });
        }
    })

    /**
     * @openapi
     * /attendance-records:
     *   post:
     *     summary: Crear un registro de asistencia
     *     tags: [AttendanceRecords]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateAttendanceRecordDto'
     *     responses:
     *       201:
     *         description: Registro de asistencia creado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AttendanceRecord'
     */
    router.post("/", async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;

            if (currentUser.role !== "trainee") {
                return resp.status(403).json({
                    error: "Solo los practicantes pueden registrar su asistencia",
                });
            }

            const user = await usersService.findById(currentUser.id);

            if (!user?.organizationId) {
                return resp.status(403).json({
                    error: "El usuario no pertenece a ninguna organización",
                });
            }

            const data: CreateAttendanceRecordDto = {
                ...req.body,
                userId: currentUser.id,
                organizationId: user.organizationId,
            };

            const record = await attendanceRecordsService.create(data);

            resp.status(201).json(serializeAttendanceRecord(record));
        } catch (error) {
            console.error("[AttendanceRecords][POST /]", error);

            resp.status(500).json({
                error: "Error al crear el registro de asistencia",
                detail: error instanceof Error ? error.message : String(error),
            });
        }
    });

    /**
     * @openapi
     * /attendance-records/{id}:
     *   put:
     *     summary: Actualizar un registro de asistencia
     *     tags: [AttendanceRecords]
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
     *             $ref: '#/components/schemas/UpdateAttendanceRecordDto'
     *     responses:
     *       200:
     *         description: Registro de asistencia actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AttendanceRecord'
     */
    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const data: UpdateAttendanceRecordDto = req.body;
            const record = await attendanceRecordsService.update(req.params.id as string, data);
            resp.json(serializeAttendanceRecord(record));
        } catch (error) {
            console.error("[AttendanceRecords][PUT /:id]", error);
            resp.status(500).json({
                error: "Error al actualizar el registro de asistencia",
                detail: error instanceof Error ? error.message : String(error),
            });
        }
    })

    /**
     * @openapi
     * /attendance-records/{id}:
     *   delete:
     *     summary: Eliminar un registro de asistencia
     *     tags: [AttendanceRecords]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Registro de asistencia eliminado
     */
    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await attendanceRecordsService.remove(req.params.id as string);
            resp.status(204).send();
        } catch (error) {
            console.error("[AttendanceRecords][DELETE /:id]", error);
            resp.status(500).json({ error: "Error al eliminar el registro de asistencia" });
        }
    })

    return router
};

export default AttendanceRecordsController;
