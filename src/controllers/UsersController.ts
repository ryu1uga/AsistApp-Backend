import express, { Request, Response } from "express";
import { CreateUserDto, UpdateUserDto } from "../dtos";
import { usersService } from "../services";
import { authenticate } from "../middlewares/authenticate";
import { isValidEmail, isValidRole, isValidStatus } from "../utils/validation";

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
            resp.json(await usersService.findAll());
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los usuarios" });
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
            const user = await usersService.findById(req.params.id as string);
            if (!user) {
                return resp.status(404).json({ error: "Usuario no encontrado" });
            }
            resp.json(user);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener el usuario" });
        }
    })

    /**
     * @openapi
     * /users/register:
     *   post:
     *     summary: Registrar un nuevo usuario
     *     tags: [Users]
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
            
            // Validate all required fields
            const requiredFields: (keyof CreateUserDto)[] = [
                "firstName",
                "lastName",
                "institutionalEmail",
                "phoneNumber",
                "role",
                "status",
                "password"
            ];

            for (const field of requiredFields) {
                if (!data[field]) {
                    return resp.status(400).json({ error: `El campo '${field}' es obligatorio` });
                }
            }

            // Clean whitespaces from names and email
            data.firstName = data.firstName.trim();
            data.lastName = data.lastName.trim();
            data.institutionalEmail = data.institutionalEmail.trim();

            // Email format validation
            if (!isValidEmail(data.institutionalEmail)) {
                return resp.status(400).json({ error: "El formato del correo institucional no es válido" });
            }

            // Role enum validation
            if (!isValidRole(data.role)) {
                return resp.status(400).json({ error: "El campo 'role' debe ser 'admin' o 'trainee'" });
            }

            // Status enum validation
            if (!isValidStatus(data.status)) {
                return resp.status(400).json({ error: "El campo 'status' debe ser 'pending', 'active' o 'rejected'" });
            }

            const user = await usersService.register(data);
            resp.status(201).json(user);
        } catch (error: any) {
            // Handle Prisma unique constraint violation (duplicate email)
            if (error.code === "P2002" && error.meta?.target?.includes("institutional_email")) {
                return resp.status(400).json({ error: "El correo institucional ya está registrado" });
            }
            console.error("Error al registrar el usuario:", error);
            resp.status(500).json({ error: "Error al registrar el usuario" });
        }
    })

    /**
     * @openapi
     * /users/login:
     *   post:
     *     summary: Iniciar sesión de usuario
     *     tags: [Users]
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
            console.error("Error al iniciar sesión:", error);
            resp.status(500).json({ error: "Error al iniciar sesión" });
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

            // Authorization: Trainee can only update their own profile
            if (currentUser.role === "trainee") {
                if (currentUser.id !== req.params.id) {
                    return resp.status(403).json({ error: "No tienes permiso para actualizar este usuario" });
                }
                // Prevent trainee from elevating their own role or status
                if (data.role) delete data.role;
                if (data.status) delete data.status;
            }

            // Validate institutionalEmail format if provided
            if (data.institutionalEmail) {
                data.institutionalEmail = data.institutionalEmail.trim();
                if (!isValidEmail(data.institutionalEmail)) {
                    return resp.status(400).json({ error: "El formato del correo institucional no es válido" });
                }
            }

            // Validate role enum if provided (only possible for admin)
            if (data.role && !isValidRole(data.role)) {
                return resp.status(400).json({ error: "El campo 'role' debe ser 'admin' o 'trainee'" });
            }

            // Validate status enum if provided (only possible for admin)
            if (data.status && !isValidStatus(data.status)) {
                return resp.status(400).json({ error: "El campo 'status' debe ser 'pending', 'active' o 'rejected'" });
            }

            // Validate password if provided
            if (data.password !== undefined && data.password.trim() === "") {
                return resp.status(400).json({ error: "La contraseña no puede estar vacía" });
            }

            const user = await usersService.update(req.params.id as string, data);
            resp.json(user);
        } catch (error: any) {
            // Handle Prisma unique constraint violation (duplicate email)
            if (error.code === "P2002" && error.meta?.target?.includes("institutional_email")) {
                return resp.status(400).json({ error: "El correo institucional ya está registrado" });
            }
            // Handle Prisma record not found error
            if (error.code === "P2025" || error.message?.includes("Record to update not found")) {
                return resp.status(404).json({ error: "Usuario no encontrado" });
            }
            console.error("Error al actualizar el usuario:", error);
            resp.status(500).json({ error: "Error al actualizar el usuario" });
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
            await usersService.remove(req.params.id as string);
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar el usuario" });
        }
    })

    return router
};

export default UsersController;
