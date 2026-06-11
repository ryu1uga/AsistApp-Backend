import express, { Request, Response } from "express";
import prisma from "../config/db";
import { CreateUserDto, UpdateUserDto } from "../dtos";

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
            resp.json(users);
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
            resp.json(user);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener el usuario" });
        }
    })

    /**
     * @openapi
     * /users:
     *   post:
     *     summary: Crear un usuario
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateUserDto'
     *     responses:
     *       201:
     *         description: Usuario creado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     */
    router.post("/", async (req: Request, resp: Response) => {
        try {
            const data: CreateUserDto = req.body;
            const user = await prisma.user.create({
                data
            });
            resp.status(201).json(user);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el usuario" });
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
            const user = await prisma.user.update({
                where: { id: req.params.id as string },
                data
            });
            resp.json(user);
        } catch (error) {
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
