import express, { Request, Response } from "express";
import prisma from "../config/db";

const UsersController = () => {
    const router = express.Router();

    router.get("/", async (req: Request, resp: Response) => {
        try {
            const users = await prisma.user.findMany();
            resp.json(users);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener los usuarios" });
        }
    })

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

    router.post("/", async (req: Request, resp: Response) => {
        try {
            const user = await prisma.user.create({
                data: req.body
            });
            resp.status(201).json(user);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear el usuario" });
        }
    })

    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const user = await prisma.user.update({
                where: { id: req.params.id as string },
                data: req.body
            });
            resp.json(user);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar el usuario" });
        }
    })

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
