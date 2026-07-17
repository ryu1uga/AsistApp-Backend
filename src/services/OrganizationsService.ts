import prisma from "../config/db";
import { CreateOrganizationDto, UpdateOrganizationDto } from "../dtos";
import { ValidationError, ForbiddenError, NotFoundError } from "../utils/validation";

class OrganizationsService {
    findAll() {
        return prisma.organization.findMany();
    }

    findByCode(code: string) {
        return prisma.organization.findFirst({ where: { code } });
    }

    findById(id: string) {
        return prisma.organization.findUnique({ where: { id } });
    }

    private generateCode(name: string): string {
        const normalized = name.toUpperCase().replace(/[^A-Z0-9]/g, "").padEnd(1, "X");
        const prefix = normalized.substring(0, Math.min(6, normalized.length));
        const numericCode = 1000 + Math.floor(Math.random() * 9000);
        return `${prefix}-${numericCode}`;
    }

    async create(data: CreateOrganizationDto) {
        if (!data.name || data.name.trim() === "") {
            throw new ValidationError("El nombre de la organización no puede estar vacío");
        }
        if (typeof data.lateTimeLimit !== "number" || data.lateTimeLimit < 0) {
            throw new ValidationError("El límite de tiempo de tardanza debe ser un número entero mayor o igual a 0");
        }
        data.name = data.name.trim();

        let code: string = "";
        for (let attempts = 0; attempts < 5; attempts++) {
            code = this.generateCode(data.name);
            const existing = await prisma.organization.findFirst({ where: { code } });
            if (!existing) break;
        }
        return prisma.organization.create({ data: { ...data, code } });
    }

    async update(id: string, data: UpdateOrganizationDto, currentUser?: { id: string; role: string; organizationId?: string | null }) {
        const targetOrg = await prisma.organization.findUnique({ where: { id } });
        if (!targetOrg) {
            throw new NotFoundError("Organización no encontrada");
        }

        // Reglas de Autorización y Negocio
        if (currentUser) {
            if (currentUser.role !== "admin") {
                throw new ForbiddenError("No tienes permiso para actualizar esta organización");
            }

            const userDb = await prisma.user.findUnique({ where: { id: currentUser.id } });
            if (!userDb || userDb.organizationId !== id) {
                throw new ForbiddenError("No tienes permiso para actualizar esta organización");
            }
        }

        // Validaciones de formato
        if (data.name !== undefined && data.name.trim() === "") {
            throw new ValidationError("El nombre de la organización no puede estar vacío");
        }

        if (data.lateTimeLimit !== undefined) {
            if (typeof data.lateTimeLimit !== "number" || data.lateTimeLimit < 0) {
                throw new ValidationError("El límite de tiempo de tardanza debe ser un número entero mayor o igual a 0");
            }
        }

        const prismaData: any = { ...data };
        if (prismaData.name) prismaData.name = prismaData.name.trim();

        return prisma.organization.update({
            where: { id },
            data: prismaData
        });
    }

    remove(id: string) {
        return prisma.organization.delete({ where: { id } });
    }
}

export default new OrganizationsService();
