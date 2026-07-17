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
        return prisma.attendanceRecord.create({
            data: {
                ...data,
                date: new Date(data.date),
                checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
                lunchStart: data.lunchStart ? new Date(data.lunchStart) : undefined,
                lunchEnd: data.lunchEnd ? new Date(data.lunchEnd) : undefined,
                checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
                status: AttendanceStatus.pending,
            },
        });
    }

    update(id: string, data: UpdateAttendanceRecordDto) {
        const prismaData: any = { ...data };
        if (data.date !== undefined) prismaData.date = new Date(data.date);
        if (data.checkIn !== undefined) prismaData.checkIn = data.checkIn ? new Date(data.checkIn) : null;
        if (data.lunchStart !== undefined) prismaData.lunchStart = data.lunchStart ? new Date(data.lunchStart) : null;
        if (data.lunchEnd !== undefined) prismaData.lunchEnd = data.lunchEnd ? new Date(data.lunchEnd) : null;
        if (data.checkOut !== undefined) prismaData.checkOut = data.checkOut ? new Date(data.checkOut) : null;
        return prisma.attendanceRecord.update({ where: { id }, data: prismaData });
    }

    remove(id: string) {
        return prisma.attendanceRecord.delete({ where: { id } });
    }
}

export default new AttendanceRecordsService();
