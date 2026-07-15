import prisma from "../config/db";
import { CreateAttendanceRequestDto, UpdateAttendanceRequestDto } from "../dtos";
import { RequestStatus } from "../generated/prisma/enums";

class AttendanceRequestsService {
    findAll(filters?: { userId?: string; organizationId?: string }) {
        return prisma.attendanceRequest.findMany({
            where: {
                ...(filters?.userId && { userId: filters.userId }),
                ...(filters?.organizationId && { organizationId: filters.organizationId }),
            },
            orderBy: { createdAt: "desc" },
        });
    }

    findById(id: string) {
        return prisma.attendanceRequest.findUnique({ where: { id } });
    }

    create(data: CreateAttendanceRequestDto) {
        return prisma.attendanceRequest.create({ data: { ...data, status: RequestStatus.pending } });
    }

    update(id: string, data: UpdateAttendanceRequestDto) {
        return prisma.attendanceRequest.update({ where: { id }, data });
    }

    remove(id: string) {
        return prisma.attendanceRequest.delete({ where: { id } });
    }
}

export default new AttendanceRequestsService();
