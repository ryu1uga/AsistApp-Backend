import prisma from "../config/db";
import { CreateOrganizationDto, UpdateOrganizationDto } from "../dtos";

class OrganizationsService {
    findAll() {
        return prisma.organization.findMany();
    }

    findById(id: string) {
        return prisma.organization.findUnique({ where: { id } });
    }

    create(data: CreateOrganizationDto) {
        return prisma.organization.create({ data });
    }

    update(id: string, data: UpdateOrganizationDto) {
        const prismaData: any = { ...data };
        if (prismaData.name) prismaData.name = prismaData.name.trim();
        if (prismaData.code) prismaData.code = prismaData.code.trim();
        return prisma.organization.update({ where: { id }, data: prismaData });
    }

    remove(id: string) {
        return prisma.organization.delete({ where: { id } });
    }
}

export default new OrganizationsService();
