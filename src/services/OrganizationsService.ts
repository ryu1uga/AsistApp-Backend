import prisma from "../config/db";
import { CreateOrganizationDto, UpdateOrganizationDto } from "../dtos";

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
        let code: string = "";
        for (let attempts = 0; attempts < 5; attempts++) {
            code = this.generateCode(data.name);
            const existing = await prisma.organization.findFirst({ where: { code } });
            if (!existing) break;
        }
        return prisma.organization.create({ data: { ...data, code } });
    }

    update(id: string, data: UpdateOrganizationDto) {
        const prismaData: any = { ...data };
        if (prismaData.name) prismaData.name = prismaData.name.trim();
        return prisma.organization.update({ where: { id }, data: prismaData });
    }

    remove(id: string) {
        return prisma.organization.delete({ where: { id } });
    }
}

export default new OrganizationsService();
