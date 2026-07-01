import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
    destination: path.join(__dirname, "..", "..", "uploads"),
    filename: (req, file, cb) => {
        const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Solo se permiten imágenes"));
        }
        cb(null, true);
    },
});

const UploadsController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /uploads:
     *   post:
     *     summary: Subir una imagen (ej. foto de organización)
     *     tags: [Uploads]
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               file:
     *                 type: string
     *                 format: binary
     *     responses:
     *       201:
     *         description: Imagen subida
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 url:
     *                   type: string
     */
    router.post("/", (req: Request, resp: Response) => {
        upload.single("file")(req, resp, (err: unknown) => {
            if (err) {
                const message = err instanceof Error ? err.message : "Error al subir el archivo";
                return resp.status(400).json({ error: message });
            }
            if (!req.file) {
                return resp.status(400).json({ error: "No se envió ningún archivo" });
            }
            resp.status(201).json({ url: `/uploads/${req.file.filename}` });
        });
    });

    return router;
};

export default UploadsController;
