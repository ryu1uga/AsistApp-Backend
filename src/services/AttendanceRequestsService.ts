import prisma from "../config/db";
import { CreateAttendanceRequestDto, UpdateAttendanceRequestDto } from "../dtos";
import { RequestStatus } from "../generated/prisma/enums";
import { ValidationError } from "../utils/validation";

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
        if (!data.userId || !data.organizationId || !data.requestedDate || !data.reason) {
            throw new ValidationError("userId, organizationId, requestedDate y reason son obligatorios");
        }
        return prisma.attendanceRequest.create({
            data: {
                ...data,
                requestedDate: new Date(data.requestedDate),
                status: RequestStatus.pending,
            },
        });
    }

    update(id: string, data: UpdateAttendanceRequestDto) {
        const prismaData: any = { ...data };
        if (data.requestedDate !== undefined) prismaData.requestedDate = new Date(data.requestedDate);
        return prisma.attendanceRequest.update({ where: { id }, data: prismaData });
    }

    remove(id: string) {
        return prisma.attendanceRequest.delete({ where: { id } });
    }
}

export default new AttendanceRequestsService();
