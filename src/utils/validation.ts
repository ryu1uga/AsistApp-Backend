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
