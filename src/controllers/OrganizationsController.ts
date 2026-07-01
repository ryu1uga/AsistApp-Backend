import express, { Request, Response } from "express";
import { organizationsService, usersService } from "../services";
import { CreateOrganizationDto, UpdateOrganizationDto } from "../dtos";
import { authenticate } from "../middlewares/authenticate";

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
    router.get("/", authenticate, async (req: Request, resp: Response) => {
        try {
            const { code } = req.query;
            if (code) {
                const organization = await organizationsService.findByCode(code as string);
                if (!organization) {
                    return resp.status(404).json({ error: "Organización no encontrada" });
                }
                return resp.json(organization);
            }

            const currentUser = await usersService.findById(req.user!.id);
            if (!currentUser?.organizationId) {
                return resp.json([]);
            }
            const organization = await organizationsService.findById(currentUser.organizationId);
            resp.json(organization ? [organization] : []);
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
    router.get("/:id", authenticate, async (req: Request, resp: Response) => {
        try {
            const currentUser = await usersService.findById(req.user!.id);
            if (!currentUser?.organizationId || currentUser.organizationId !== req.params.id) {
                return resp.status(403).json({ error: "No tienes permiso para ver esta organización" });
            }

            const organization = await organizationsService.findById(req.params.id as string);
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
    router.post("/", authenticate, async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user;
            if (!currentUser) {
                return resp.status(401).json({ error: "Usuario no autenticado" });
            }

            const data: CreateOrganizationDto = req.body;
            const organization = await organizationsService.create(data);
            await usersService.update(currentUser.id, { organizationId: organization.id });
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
    router.put("/:id", authenticate, async (req: Request, resp: Response) => {
        try {
            const data: UpdateOrganizationDto = req.body;
            const currentUser = req.user;

            if (!currentUser) {
                return resp.status(401).json({ error: "Usuario no autenticado" });
            }

            // Authorization: Only admin can update an organization
            if (currentUser.role !== "admin") {
                return resp.status(403).json({ error: "No tienes permiso para actualizar esta organización" });
            }

            // Fetch user from DB to verify organization ownership
            const userDb = await usersService.findById(currentUser.id);
            if (!userDb || userDb.organizationId !== req.params.id) {
                return resp.status(403).json({ error: "No tienes permiso para actualizar esta organización" });
            }

            // Validation: name if provided cannot be empty
            if (data.name !== undefined && data.name.trim() === "") {
                return resp.status(400).json({ error: "El nombre de la organización no puede estar vacío" });
            }

            // Validation: lateTimeLimit if provided must be a valid number >= 0
            if (data.lateTimeLimit !== undefined) {
                if (typeof data.lateTimeLimit !== "number" || data.lateTimeLimit < 0) {
                    return resp.status(400).json({ error: "El límite de tiempo de tardanza debe ser un número entero mayor o igual a 0" });
                }
            }

            const organization = await organizationsService.update(req.params.id as string, data);
            resp.json(organization);
        } catch (error: any) {
            // Handle Prisma unique constraint violation (duplicate code)
            if (error.code === "P2002" && error.meta?.target?.includes("code")) {
                return resp.status(400).json({ error: "El código de la organización ya está registrado" });
            }
            // Handle Prisma record not found
            if (error.code === "P2025" || error.message?.includes("Record to update not found")) {
                return resp.status(404).json({ error: "Organización no encontrada" });
            }
            console.error("Error al actualizar la organización:", error);
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
    router.delete("/:id", authenticate, async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            if (currentUser.role !== "admin") {
                return resp.status(403).json({ error: "No tienes permiso para eliminar esta organización" });
            }

            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId || admin.organizationId !== req.params.id) {
                return resp.status(403).json({ error: "No tienes permiso para eliminar esta organización" });
            }

            await organizationsService.remove(req.params.id as string);
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar la organización" });
        }
    })

    return router
};

export default OrganizationsController;
