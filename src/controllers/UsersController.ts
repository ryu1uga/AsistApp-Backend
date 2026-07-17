import express, { Request, Response } from "express";
import { CreateUserDto, UpdateUserDto } from "../dtos";
import { activityLogsService, usersService, organizationsService } from "../services";
import { authenticate } from "../middlewares/authenticate";
import { handleControllerError } from "../utils/validation";
import emailService from "../services/EmailService";
import { LogCategory } from "../generated/prisma/enums";

const UsersController = () => {
    const router = express.Router();

    /**
     * @openapi
     * /users:
     *   get:
     *     summary: Obtener todos los usuarios
     *     tags: [Users]
     *     responses:
     *       200:
     *         description: Lista de usuarios
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/User'
     */
    router.get("/", authenticate, async (req: Request, resp: Response) => {
        try {
            const currentUser = await usersService.findById(req.user!.id);
            if (!currentUser?.organizationId) {
                return resp.status(403).json({ error: "El usuario no pertenece a ninguna organización" });
            }
            resp.json(await usersService.findAll({ organizationId: currentUser.organizationId }));
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al obtener los usuarios", context: "Users][GET /" });
        }
    })

    /**
     * @openapi
     * /users/{id}:
     *   get:
     *     summary: Obtener un usuario por ID
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Usuario encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       404:
     *         description: Usuario no encontrado
     */
    router.get("/:id", authenticate, async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            const user = await usersService.findById(req.params.id as string);
            if (!user) {
                return resp.status(404).json({ error: "Usuario no encontrado" });
            }

            if (currentUser.role === "trainee" && currentUser.id !== user.id) {
                return resp.status(403).json({ error: "No tienes permiso para ver este usuario" });
            }
            if (currentUser.role === "admin" && currentUser.id !== user.id) {
                const admin = await usersService.findById(currentUser.id);
                if (!admin?.organizationId || admin.organizationId !== user.organizationId) {
                    return resp.status(403).json({ error: "No tienes permiso para ver este usuario" });
                }
            }

            resp.json(user);
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al obtener el usuario", context: "Users][GET /:id" });
        }
    })

    /**
     * @openapi
     * /users/register:
     *   post:
     *     summary: Registrar un nuevo usuario
     *     tags: [Users]
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateUserDto'
     *     responses:
     *       201:
     *         description: Usuario creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     */
    router.post("/register", async (req: Request, resp: Response) => {
        try {
            const data: CreateUserDto = req.body;
            const session = await usersService.register(data);
            resp.status(201).json(session);

            if (session.user.organizationId) {
                await activityLogsService.log({
                    organizationId: session.user.organizationId,
                    performedById: session.user.id,
                    affectedUserId: session.user.id,
                    title: "Usuario registrado",
                    category: LogCategory.members,
                });
            }
        } catch (error: any) {
            // Handle Prisma unique constraint violation (duplicate email)
            if (error.code === "P2002" && error.meta?.target?.includes("institutional_email")) {
                return resp.status(400).json({ error: "El correo institucional ya está registrado" });
            }
            handleControllerError(resp, error, { fallback: "Error al registrar el usuario", context: "Users][POST /register" });
        }
    })

    /**
     * @openapi
     * /users/login:
     *   post:
     *     summary: Iniciar sesión de usuario
     *     tags: [Users]
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, password]
     *             properties:
     *               email:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: Login exitoso
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 token:
     *                   type: string
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *       401:
     *         description: Credenciales incorrectas
     *       404:
     *         description: Usuario no encontrado
     */
    router.post("/login", async (req: Request, resp: Response) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return resp.status(400).json({ error: "Email y contraseña son requeridos" });
            }

            const session = await usersService.login(email, password);
            if (session === null) {
                return resp.status(404).json({ error: "Usuario no encontrado" });
            }
            if (session === false) {
                return resp.status(401).json({ error: "Credenciales incorrectas" });
            }
            resp.json(session);
        } catch (error) {
            handleControllerError(resp, error, { fallback: "Error al iniciar sesión", context: "Users][POST /login" });
        }
    })

    /**
     * @openapi
     * /users/{id}:
     *   put:
     *     summary: Actualizar un usuario
     *     tags: [Users]
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
     *             $ref: '#/components/schemas/UpdateUserDto'
     *     responses:
     *       200:
     *         description: Usuario actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     */
    router.put("/:id", authenticate, async (req: Request, resp: Response) => {
        try {
            const data: UpdateUserDto = req.body;
            const currentUser = req.user;

            if (!currentUser) {
                return resp.status(401).json({ error: "Usuario no autenticado" });
            }

            const targetUser = await usersService.findById(req.params.id as string);

            const user = await usersService.update(req.params.id as string, data, currentUser, targetUser);
            resp.json(user);

            if (user.organizationId) {
                await activityLogsService.log({
                    organizationId: user.organizationId,
                    performedById: currentUser.id,
                    affectedUserId: user.id,
                    title: "Usuario actualizado",
                    category: LogCategory.members,
                });
            }

            const sendStatusEmail = data.status === "active" || data.status === "rejected";
            if (sendStatusEmail && targetUser) {
                const orgName = targetUser.organizationId
                    ? (await organizationsService.findById(targetUser.organizationId))?.name ?? "la organización"
                    : "la organización";

                if (data.status === "active") {
                    emailService.sendAccepted(targetUser.institutionalEmail, targetUser.firstName, orgName);
                } else {
                    emailService.sendRejected(targetUser.institutionalEmail, targetUser.firstName, orgName);
                }
            }
        } catch (error: any) {
            // Handle Prisma unique constraint violation (duplicate email)
            if (error.code === "P2002" && error.meta?.target?.includes("institutional_email")) {
                return resp.status(400).json({ error: "El correo institucional ya está registrado" });
            }
            handleControllerError(resp, error, {
                fallback: "Error al actualizar el usuario",
                notFound: "Usuario no encontrado",
                context: "Users][PUT /:id",
            });
        }
    })

    /**
     * @openapi
     * /users/{id}:
     *   delete:
     *     summary: Eliminar un usuario
     *     tags: [Users]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Usuario eliminado
     */
    router.delete("/:id", authenticate, async (req: Request, resp: Response) => {
        try {
            const currentUser = req.user!;
            if (currentUser.role !== "admin") {
                return resp.status(403).json({ error: "No tienes permiso para eliminar usuarios" });
            }

            const [admin, targetUser] = await Promise.all([
                usersService.findById(currentUser.id),
                usersService.findById(req.params.id as string),
            ]);
            if (!targetUser) {
                return resp.status(404).json({ error: "Usuario no encontrado" });
            }
            if (!admin?.organizationId || admin.organizationId !== targetUser.organizationId) {
                return resp.status(403).json({ error: "No tienes permiso para eliminar este usuario" });
            }

            await usersService.remove(req.params.id as string);
            resp.status(204).send();

            if (targetUser.organizationId) {
                await activityLogsService.log({
                    organizationId: targetUser.organizationId,
                    performedById: currentUser.id,
                    affectedUserId: targetUser.id,
                    title: "Usuario eliminado",
                    category: LogCategory.members,
                });
            }
        } catch (error) {
            handleControllerError(resp, error, {
                fallback: "Error al eliminar el usuario",
                notFound: "Usuario no encontrado",
                context: "Users][DELETE /:id",
            });
        }
    })

    return router
};

export default UsersController;
