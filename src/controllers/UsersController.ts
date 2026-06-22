import express, { Request, Response } from "express";
import prisma from "../config/db";
import { CreateUserDto, UpdateUserDto } from "../dtos";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
    router.get("/", async (req: Request, resp: Response) => {
        try {
            const users = await prisma.user.findMany();
            const usersWithoutPassword = users.map(user => {
                const { passwordHash, ...rest } = user;
                return rest;
            });
            resp.json(usersWithoutPassword);
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
    router.get("/:id", async (req: Request, resp: Response) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.params.id as string }
            });
            if (!user) {
                return resp.status(404).json({ error: "Usuario no encontrado" });
            }
            const { passwordHash, ...userWithoutPassword } = user;
            resp.json(userWithoutPassword);
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
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.institutionalEmail)) {
                return resp.status(400).json({ error: "El formato del correo institucional no es válido" });
            }

            // Role enum validation
            if (data.role !== "admin" && data.role !== "trainee") {
                return resp.status(400).json({ error: "El campo 'role' debe ser 'admin' o 'trainee'" });
            }

            // Status enum validation
            if (data.status !== "pending" && data.status !== "active" && data.status !== "rejected") {
                return resp.status(400).json({ error: "El campo 'status' debe ser 'pending', 'active' o 'rejected'" });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(data.password, 10);

            // Remove password from payload passed to Prisma
            const { password, ...prismaData } = data;

            const user = await prisma.user.create({
                data: {
                    ...prismaData,
                    passwordHash
                }
            });

            const { passwordHash: _, ...userWithoutPassword } = user;
            resp.status(201).json(userWithoutPassword);
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

            const user = await prisma.user.findUnique({
                where: { institutionalEmail: email }
            });

            if (!user) {
                return resp.status(404).json({ error: "Usuario no encontrado" });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return resp.status(401).json({ error: "Credenciales incorrectas" });
            }

            const token = jwt.sign(
                { id: user.id, email: user.institutionalEmail, role: user.role },
                process.env.TOKEN || "PROGRAMOVIL",
                { expiresIn: "30d" }
            );

            const { passwordHash: _, ...userWithoutPassword } = user;

            resp.json({
                token,
                user: userWithoutPassword
            });
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
    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const data: UpdateUserDto = req.body;

            let prismaData: any = { ...data };
            if (data.password) {
                prismaData.passwordHash = await bcrypt.hash(data.password, 10);
                delete prismaData.password;
            }

            const user = await prisma.user.update({
                where: { id: req.params.id as string },
                data: prismaData
            });

            const { passwordHash: _, ...userWithoutPassword } = user;
            resp.json(userWithoutPassword);
        } catch (error) {
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
    router.delete("/:id", async (req: Request, resp: Response) => {
        try {
            await prisma.user.delete({
                where: { id: req.params.id as string }
            });
            resp.status(204).send();
        } catch (error) {
            resp.status(500).json({ error: "Error al eliminar el usuario" });
        }
    })

    return router
};

export default UsersController;
