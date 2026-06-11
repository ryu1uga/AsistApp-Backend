import express, { Request, Response } from "express";
import prisma from "../config/db";

const OrganizationsController = () => {
    const router = express.Router();

    router.get("/", async (req: Request, resp: Response) => {
        try {
            const organizations = await prisma.organization.findMany();
            resp.json(organizations);
        } catch (error) {
            resp.status(500).json({ error: "Error al obtener las organizaciones" });
        }
    })

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

    router.post("/", async (req: Request, resp: Response) => {
        try {
            const organization = await prisma.organization.create({
                data: req.body
            });
            resp.status(201).json(organization);
        } catch (error) {
            resp.status(500).json({ error: "Error al crear la organización" });
        }
    })

    router.put("/:id", async (req: Request, resp: Response) => {
        try {
            const organization = await prisma.organization.update({
                where: { id: req.params.id as string },
                data: req.body
            });
            resp.json(organization);
        } catch (error) {
            resp.status(500).json({ error: "Error al actualizar la organización" });
        }
    })

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
