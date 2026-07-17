import prisma from "../config/db";
import { CreateAttendanceRecordDto, UpdateAttendanceRecordDto } from "../dtos";
import { AttendanceStatus } from "../generated/prisma/enums";
import { ValidationError } from "../utils/validation";

class AttendanceRecordsService {
    findAll(filters?: { userId?: string; organizationId?: string }) {
        return prisma.attendanceRecord.findMany({
            where: {
                ...(filters?.userId && { userId: filters.userId }),
                ...(filters?.organizationId && { organizationId: filters.organizationId }),
            },
            orderBy: { date: "desc" },
        });
    }

    findById(id: string) {
        return prisma.attendanceRecord.findUnique({ where: { id } });
    }

    create(data: CreateAttendanceRecordDto) {
        if (!data.userId || !data.organizationId || !data.date || typeof data.autoCheckout !== "boolean") {
            throw new ValidationError("userId, organizationId, date y autoCheckout son obligatorios");
        }
        return prisma.attendanceRecord.create({ data: { ...data, status: AttendanceStatus.pending } });
    }

    update(id: string, data: UpdateAttendanceRecordDto) {
        return prisma.attendanceRecord.update({ where: { id }, data });
    }

    remove(id: string) {
        return prisma.attendanceRecord.delete({ where: { id } });
    }
}

export default new AttendanceRecordsService();
