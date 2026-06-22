import { UserRole, UserStatus } from "../generated/prisma/enums";

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
