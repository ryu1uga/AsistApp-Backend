import prisma from "../config/db";
import { CreateScheduleDayDto, UpdateScheduleDayDto } from "../dtos";
import { parseTime } from "../utils/formatters";
import { ValidationError } from "../utils/validation";

class ScheduleDaysService {
    findAll(filters?: { organizationId?: string; userId?: string }) {
        return prisma.scheduleDay.findMany({
            where: {
                ...(filters?.organizationId && { schedule: { organizationId: filters.organizationId } }),
                ...(filters?.userId && { schedule: { userId: filters.userId } }),
            },
        });
    }

    findByScheduleId(scheduleId: string) {
        return prisma.scheduleDay.findMany({ where: { scheduleId } });
    }

    findById(id: string) {
        return prisma.scheduleDay.findUnique({ where: { id }, include: { schedule: true } });
    }

    create(data: CreateScheduleDayDto) {
        if (!data.scheduleId || !data.day || !data.checkInTime || !data.checkOutTime) {
            throw new ValidationError("scheduleId, day, checkInTime y checkOutTime son obligatorios");
        }
        return prisma.scheduleDay.create({
            data: {
                ...data,
                checkInTime: parseTime(data.checkInTime)!,
                lunchStartTime: parseTime(data.lunchStartTime),
                lunchEndTime: parseTime(data.lunchEndTime),
                checkOutTime: parseTime(data.checkOutTime)!,
            },
        });
    }

    update(id: string, data: UpdateScheduleDayDto) {
        const { checkInTime, lunchStartTime, lunchEndTime, checkOutTime, ...rest } = data;
        return prisma.scheduleDay.update({
            where: { id },
            data: {
                ...rest,
                ...(checkInTime !== undefined && { checkInTime: parseTime(checkInTime)! }),
                ...(lunchStartTime !== undefined && { lunchStartTime: parseTime(lunchStartTime) }),
                ...(lunchEndTime !== undefined && { lunchEndTime: parseTime(lunchEndTime) }),
                ...(checkOutTime !== undefined && { checkOutTime: parseTime(checkOutTime)! }),
            },
        });
    }

    remove(id: string) {
        return prisma.scheduleDay.delete({ where: { id } });
    }
}

export default new ScheduleDaysService();
