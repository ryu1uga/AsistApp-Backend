import express, { Request, Response } from "express";
import { activityLogsService, organizationsService, usersService } from "../services";
import { CreateOrganizationDto, UpdateOrganizationDto } from "../dtos";
import { handleControllerError } from "../utils/validation";
import { LogCategory } from "../generated/prisma/enums";

// Nota: este router ya se monta con `authenticate` en index.ts
// (app.use("/organizations", authenticate, OrganizationsController())),
// por lo que las rutas de acá abajo no necesitan volver a declararlo.

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
            handleControllerError(resp, error, { fallback: "Error al obtener las organizaciones", context: "Organizations][GET /" });
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
            handleControllerError(resp, error, { fallback: "Error al obtener la organización", context: "Organizations][GET /:id" });
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
            const currentUser = req.user;
            if (!currentUser) {
                return resp.status(401).json({ error: "Usuario no autenticado" });
            }

            if (currentUser.role !== "admin") {
                return resp.status(403).json({ error: "No tienes permiso para crear una organización" });
            }

            const data: CreateOrganizationDto = req.body;
            const organization = await organizationsService.create(data);
            await usersService.update(currentUser.id, { organizationId: organization.id });
            resp.status(201).json(organization);

            await activityLogsService.log({
                organizationId: organization.id,
                performedById: currentUser.id,
                affectedUserId: currentUser.id,
                title: "Organización creada",
                category: LogCategory.members,
            });
        } catch (error: any) {
            if (error.code === "P2002" && error.meta?.target?.includes("code")) {
                return resp.status(400).json({ error: "El código de la organización ya está registrado" });
            }
            handleControllerError(resp, error, { fallback: "Error al crear la organización", context: "Organizations][POST /" });
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
            const currentUser = req.user;

            if (!currentUser) {
                return resp.status(401).json({ error: "Usuario no autenticado" });
            }

            const organization = await organizationsService.update(req.params.id as string, data, currentUser);
            resp.json(organization);

            await activityLogsService.log({
                organizationId: organization.id,
                performedById: currentUser.id,
                affectedUserId: currentUser.id,
                title: "Organización actualizada",
                category: LogCategory.members,
            });
        } catch (error: any) {
            // Handle Prisma unique constraint violation (duplicate code)
            if (error.code === "P2002" && error.meta?.target?.includes("code")) {
                return resp.status(400).json({ error: "El código de la organización ya está registrado" });
            }
            handleControllerError(resp, error, {
                fallback: "Error al actualizar la organización",
                notFound: "Organización no encontrada",
                context: "Organizations][PUT /:id",
            });
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
            const currentUser = req.user!;
            if (currentUser.role !== "admin") {
                return resp.status(403).json({ error: "No tienes permiso para eliminar esta organización" });
            }

            const admin = await usersService.findById(currentUser.id);
            if (!admin?.organizationId || admin.organizationId !== req.params.id) {
                return resp.status(403).json({ error: "No tienes permiso para eliminar esta organización" });
            }

            const organization = await organizationsService.findById(req.params.id as string);
            if (!organization) {
                return resp.status(404).json({ error: "Organización no encontrada" });
            }

            await organizationsService.remove(req.params.id as string);
            resp.status(204).send();

            await activityLogsService.log({
                organizationId: organization.id,
                performedById: currentUser.id,
                affectedUserId: currentUser.id,
                title: "Organización eliminada",
                category: LogCategory.members,
            });
        } catch (error) {
            handleControllerError(resp, error, {
                fallback: "Error al eliminar la organización",
                notFound: "Organización no encontrada",
                context: "Organizations][DELETE /:id",
            });
        }
    })

    return router
};

export default OrganizationsController;
