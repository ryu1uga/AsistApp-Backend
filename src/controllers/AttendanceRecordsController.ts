import express, { Request, Response } from "express";
import { attendanceRecordsService } from "../services";
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
            const records = await attendanceRecordsService.findAll();
            resp.json(records.map(serializeAttendanceRecord));
        } catch (error) {
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
            const data: CreateAttendanceRecordDto = req.body;
            const record = await attendanceRecordsService.create(data);
            resp.status(201).json(serializeAttendanceRecord(record));
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el registro de asistencia" });
        }
    })

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
            resp.status(500).json({ error: "Error al actualizar el registro de asistencia" });
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
            resp.status(500).json({ error: "Error al eliminar el registro de asistencia" });
        }
    })

    return router
};

export default AttendanceRecordsController;
