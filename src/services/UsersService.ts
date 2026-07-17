import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { CreateUserDto, UpdateUserDto } from "../dtos";
import type { User } from "../generated/prisma/client";
import { isValidEmail, isValidRole, isValidStatus, ValidationError, ForbiddenError, NotFoundError } from "../utils/validation";
import { JWT_SECRET } from "../config/auth";

type PublicUser = Omit<User, "passwordHash">;

const withoutPassword = (user: User): PublicUser => {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};

class UsersService {
    async findAll(filters?: { organizationId?: string }) {
        const users = await prisma.user.findMany({
            where: {
                ...(filters?.organizationId && { organizationId: filters.organizationId }),
            },
        });
        return users.map(withoutPassword);
    }

    async findById(id: string) {
        const user = await prisma.user.findUnique({ where: { id } });
        return user ? withoutPassword(user) : null;
    }

    async register(data: CreateUserDto) {
        const requiredFields: (keyof Omit<CreateUserDto, "status">)[] = [
            "firstName",
            "lastName",
            "institutionalEmail",
            "phoneNumber",
            "role",
            "password"
        ];
        for (const field of requiredFields) {
            if (!data[field]) throw new ValidationError(`El campo '${field}' es obligatorio`);
        }
        data.firstName = data.firstName.trim();
        data.lastName = data.lastName.trim();
        data.institutionalEmail = data.institutionalEmail.trim();
        if (!isValidEmail(data.institutionalEmail)) {
            throw new ValidationError("El formato del correo institucional no es válido");
        }
        if (!isValidRole(data.role)) {
            throw new ValidationError("El campo 'role' debe ser 'admin' o 'trainee'");
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                institutionalEmail: data.institutionalEmail,
                phoneNumber: data.phoneNumber,
                career: data.career,
                cycle: data.cycle,
                organizationId: data.organizationId,
                role: data.role,
                status: data.role === "admin" ? "active" : "pending",
                deviceToken: data.deviceToken,
                passwordHash
            }
        });
        return {
            token: jwt.sign({ id: user.id, email: user.institutionalEmail, role: user.role }, JWT_SECRET, { expiresIn: "30d" }),
            user: withoutPassword(user),
        };
    }

    async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { institutionalEmail: email } });
        if (!user) return null;
        if (!await bcrypt.compare(password, user.passwordHash)) return false;
        return {
            token: jwt.sign({ id: user.id, email: user.institutionalEmail, role: user.role }, JWT_SECRET, { expiresIn: "30d" }),
            user: withoutPassword(user)
        };
    }

    /**
     * @param preloadedTarget Usuario objetivo ya obtenido previamente por el
     * controller (p. ej. para armar el email de notificación). Si se pasa,
     * se evita un segundo `findUnique` redundante contra la misma fila.
     */
    async update(
        id: string,
        data: UpdateUserDto,
        currentUser?: { id: string; role: string; organizationId?: string | null },
        preloadedTarget?: { organizationId: string | null } | null
    ) {
        const targetUser = preloadedTarget !== undefined ? preloadedTarget : await prisma.user.findUnique({ where: { id } });
        if (!targetUser) {
            throw new NotFoundError("Usuario no encontrado");
        }

        // Reglas de Autorización y Negocio
        if (currentUser) {
            if (currentUser.role === "trainee") {
                if (currentUser.id !== id) {
                    throw new ForbiddenError("No tienes permiso para actualizar este usuario");
                }
                if (data.role) delete data.role;

                if (data.organizationId !== undefined) {
                    if (targetUser.organizationId !== null) {
                        delete data.organizationId;
                        if (data.status) delete data.status;
                    } else {
                        data.status = "pending";
                    }
                } else {
                    if (data.status) delete data.status;
                }
            } else {
                // El usuario que realiza la actualización es un Administrador
                if (id !== currentUser.id) {
                    // El administrador está actualizando a OTRO usuario
                    const adminDb = await prisma.user.findUnique({ where: { id: currentUser.id } });
                    if (!adminDb || !adminDb.organizationId || adminDb.organizationId !== targetUser.organizationId) {
                        throw new ForbiddenError("No tienes permiso para actualizar este usuario");
                    }
                    if (
                        data.organizationId !== undefined &&
                        data.organizationId !== null &&
                        data.organizationId !== adminDb.organizationId
                    ) {
                        throw new ForbiddenError("No puedes asignar este usuario a otra organización");
                    }
                } else {
                    // El administrador se está actualizando a SÍ MISMO
                    if (
                        data.organizationId !== undefined &&
                        targetUser.organizationId !== null &&
                        data.organizationId !== targetUser.organizationId
                    ) {
                        throw new ForbiddenError("No puedes cambiar de organización una vez asignada");
                    }
                }
            }
        }

        // Validaciones de formato y lógica de actualización
        const prismaData: any = { ...data };

        if (prismaData.firstName) prismaData.firstName = prismaData.firstName.trim();
        if (prismaData.lastName) prismaData.lastName = prismaData.lastName.trim();

        if (prismaData.institutionalEmail) {
            prismaData.institutionalEmail = prismaData.institutionalEmail.trim();
            if (!isValidEmail(prismaData.institutionalEmail)) {
                throw new ValidationError("El formato del correo institucional no es válido");
            }
        }

        if (prismaData.role && !isValidRole(prismaData.role)) {
            throw new ValidationError("El campo 'role' debe ser 'admin' o 'trainee'");
        }

        if (prismaData.status && !isValidStatus(prismaData.status)) {
            throw new ValidationError("El campo 'status' debe ser 'pending', 'active' o 'rejected'");
        }

        if (prismaData.password !== undefined) {
            if (prismaData.password.trim() === "") {
                throw new ValidationError("La contraseña no puede estar vacía");
            }
            prismaData.passwordHash = await bcrypt.hash(prismaData.password, 10);
            delete prismaData.password;
        }

        const user = await prisma.user.update({
            where: { id },
            data: prismaData
        });
        return withoutPassword(user);
    }

    remove(id: string) {
        return prisma.user.delete({ where: { id } });
    }
}

export default new UsersService();
