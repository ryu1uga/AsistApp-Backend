import express, { Request, Response } from "express";
import prisma from "../config/db";
import { CreateOrganizationDto, UpdateOrganizationDto } from "../dtos";

const OrganizationsController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /organizations:
     *   get:
     *     summary: Obtener todas las organizaciones
     *     tags: [Organizations]
     *     responses:
     *       200:
     *         description: Lista de organizaciones
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Organization'
     */
    router.get("/", async (req: Request, resp: Response) => {
        try {
            const organizations = await prisma.organization.findMany();
            resp.json(organizations);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener las organizaciones" });
        }
    })

    /**
     * @openapi
     * /organizations/{id}:
     *   get:
     *     summary: Obtener una organización por ID
     *     tags: [Organizations]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Organización encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Organization'
     *       404:
     *         description: Organización no encontrada
     */
    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const organization = await prisma.organization.findUnique({
                where: { id: req.params.id as string }
            });
            if (!organization) {
                return resp.status(404).json({ error: "Organización no encontrada" });
            }
            resp.json(organization);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener la organización" });
        }
    })

    /**
     * @openapi
     * /organizations:
     *   post:
     *     summary: Crear una organización
     *     tags: [Organizations]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateOrganizationDto'
     *     responses:
     *       201:
     *         description: Organización creada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Organization'
     */
    router.post("/", async (req: Request, resp: Response) => {
        try {
            const data: CreateOrganizationDto = req.body;
            const organization = await prisma.organization.create({
                data
            });
            resp.status(201).json(organization);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear la organización" });
        }
    })

    /**
     * @openapi
     * /organizations/{id}:
     *   put:
     *     summary: Actualizar una organización
     *     tags: [Organizations]
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
     *             $ref: '#/components/schemas/UpdateOrganizationDto'
     *     responses:
     *       200:
     *         description: Organización actualizada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Organization'
     */
    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const data: UpdateOrganizationDto = req.body;
            const organization = await prisma.organization.update({
                where: { id: req.params.id as string },
                data
            });
            resp.json(organization);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar la organización" });
        }
    })

    /**
     * @openapi
     * /organizations/{id}:
     *   delete:
     *     summary: Eliminar una organización
     *     tags: [Organizations]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Organización eliminada
     */
    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await prisma.organization.delete({
                where: { id: req.params.id as string }
            });
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar la organización" });
        }
    })

    return router
};

export default OrganizationsController;
