import type { Response } from "express";
import { UserRole, UserStatus } from "../generated/prisma/enums";

/**
 * Error de validación de negocio. Los controllers la atrapan y la traducen
 * a un 400 en vez de dejar que caiga como un 500 genérico.
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

/**
 * Error de autorización de negocio (403).
 */
export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ForbiddenError";
    }
}

/**
 * Error de recurso no encontrado (404).
 */
export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}

/**
 * Valida si un correo electrónico tiene formato correcto.
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valida si un rol es correcto según los enums de Prisma.
 */
export const isValidRole = (role: any): role is UserRole => {
    return role === UserRole.admin || role === UserRole.trainee;
};

/**
 * Valida si un estado de usuario es correcto según los enums de Prisma.
 */
export const isValidStatus = (status: any): status is UserStatus => {
    return status === UserStatus.pending || status === UserStatus.active || status === UserStatus.rejected;
};

/**
 * Manejo de errores centralizado para controllers. Traduce los errores de
 * negocio (ValidationError/ForbiddenError/NotFoundError) y los errores
 * conocidos de Prisma (P2025 = registro no encontrado) al status HTTP y
 * forma de respuesta correctos, y deja todo lo demás como 500 genérico con
 * log en consola. Se usa en todos los controllers para que el manejo de
 * errores sea uniforme en toda la API.
 */
export const handleControllerError = (
    resp: Response,
    error: any,
    options: { fallback: string; notFound?: string; context?: string }
) => {
    if (error instanceof ValidationError) {
        return resp.status(400).json({ error: error.message });
    }
    if (error instanceof ForbiddenError) {
        return resp.status(403).json({ error: error.message });
    }
    if (error instanceof NotFoundError) {
        return resp.status(404).json({ error: error.message });
    }
    if (
        options.notFound &&
        (error?.code === "P2025" || error?.message?.includes?.("Record to update not found") || error?.message?.includes?.("Record to delete does not exist"))
    ) {
        return resp.status(404).json({ error: options.notFound });
    }
    console.error(`[${options.context ?? "Controller"}]`, error);
    return resp.status(500).json({ error: options.fallback });
};
