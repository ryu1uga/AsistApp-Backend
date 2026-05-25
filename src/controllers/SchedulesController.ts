import express, { Request, Response } from "express";
import prisma from "../config/db";

const SchedulesController = () => {
    const router = express.Router();

    router.get("/", async (req: Request, resp: Response) => {
        
    })

    router.get("/:id", async (req: Request, resp: Response) => {
        
    })

    router.post("/", async (req: Request, resp: Response) => {
        
    })

    router.put("/:id", async (req: Request, resp: Response) => {
        
    })

    router.delete("/:id", async (req: Request, resp: Response) => {
        
    })

    return router
};

export default SchedulesController;