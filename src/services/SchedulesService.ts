import prisma from "../config/db";
import { CreateScheduleDto, UpdateScheduleDto } from "../dtos";
import { parseTime } from "../utils/formatters";
import { ValidationError } from "../utils/validation";

class SchedulesService {
    findAll(filters?: { userId?: string; organizationId?: string }) {
        return prisma.schedule.findMany({
            where: {
                ...(filters?.userId && { userId: filters.userId }),
                ...(filters?.organizationId && { organizationId: filters.organizationId }),
            },
            include: { days: true },
            orderBy: { createdAt: "desc" },
        });
    }

    findById(id: string) {
        return prisma.schedule.findUnique({ where: { id }, include: { days: true } });
    }

    create(data: CreateScheduleDto) {
        if (!data.userId || !data.organizationId || !data.status || typeof data.weeklyHours !== "number") {
            throw new ValidationError("userId, organizationId, weeklyHours y status son obligatorios");
        }
        const { days, ...scheduleData } = data;
        return prisma.schedule.create({
            data: {
                ...scheduleData,
                ...(days && days.length > 0 && {
                    days: {
                        create: days.map((d) => ({
                            day: d.day,
                            checkInTime: parseTime(d.checkInTime)!,
                            lunchStartTime: parseTime(d.lunchStartTime),
                            lunchEndTime: parseTime(d.lunchEndTime),
                            checkOutTime: parseTime(d.checkOutTime)!,
                        })),
                    },
                }),
            },
            include: { days: true },
        });
    }

    update(id: string, data: UpdateScheduleDto) {
        const { days, ...scheduleData } = data;
        if (!days) {
            return prisma.schedule.update({ where: { id }, data: scheduleData, include: { days: true } });
        }

        return prisma.$transaction(async (tx) => {
            await tx.scheduleDay.deleteMany({ where: { scheduleId: id } });
            return tx.schedule.update({
                where: { id },
                data: {
                    ...scheduleData,
                    days: {
                        create: days.map((d) => ({
                            day: d.day,
                            checkInTime: parseTime(d.checkInTime)!,
                            lunchStartTime: parseTime(d.lunchStartTime),
                            lunchEndTime: parseTime(d.lunchEndTime),
                            checkOutTime: parseTime(d.checkOutTime)!,
                        })),
                    },
                },
                include: { days: true },
            });
        });
    }

    remove(id: string) {
        return prisma.schedule.delete({ where: { id } });
    }
}

export default new SchedulesService();
