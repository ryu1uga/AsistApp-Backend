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
        return prisma.organization.update({ where: { id }, data });
    }

    remove(id: string) {
        return prisma.organization.delete({ where: { id } });
    }
}

export default new OrganizationsService();
