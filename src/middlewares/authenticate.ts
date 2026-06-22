import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../generated/prisma/enums";

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export const authenticate = (
    req: Request,
    resp: Response,
    next: NextFunction
) => {
    const authorization = req.headers.authorization;
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
        return resp.status(401).json({ error: "Token requerido" });
    }

    try {
        const payload = jwt.verify(token, process.env.TOKEN || "PROGRAMOVIL");

        if (
            typeof payload === "string" ||
            typeof payload.id !== "string" ||
            typeof payload.email !== "string" ||
            (payload.role !== "admin" && payload.role !== "trainee")
        ) {
            return resp.status(401).json({ error: "Token inválido" });
        }

        req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role
        };

        next();
    } catch {
        return resp.status(401).json({ error: "Token inválido o expirado" });
    }
};
