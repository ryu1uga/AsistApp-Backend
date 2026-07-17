import prisma from "../config/db";
import { CreateActivityLogDto, UpdateActivityLogDto } from "../dtos";

class ActivityLogsService {
    findAll(filters?: { organizationId?: string }) {
        return prisma.activityLog.findMany({
            where: {
                ...(filters?.organizationId && { organizationId: filters.organizationId }),
            },
            orderBy: { createdAt: "desc" },
        });
    }

    findById(id: string) {
        return prisma.activityLog.findUnique({ where: { id } });
    }

    create(data: CreateActivityLogDto) {
        return prisma.activityLog.create({ data });
    }

    /**
     * Registra una actividad sin propagar errores: si el registro falla,
     * se deja constancia en consola pero no se interrumpe el flujo del
     * endpoint que lo invocó.
     */
    log(data: CreateActivityLogDto) {
        return this.create(data).catch((error) => {
            console.error("[ActivityLog]", error);
            return null;
        });
    }

    update(id: string, data: UpdateActivityLogDto) {
        return prisma.activityLog.update({ where: { id }, data });
    }

    remove(id: string) {
        return prisma.activityLog.delete({ where: { id } });
    }
}

export default new ActivityLogsService();
