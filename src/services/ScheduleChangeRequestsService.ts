import prisma from "../config/db";
import { CreateScheduleChangeRequestDto, UpdateScheduleChangeRequestDto } from "../dtos";
import { RequestStatus } from "../generated/prisma/enums";
import { parseTime } from "../utils/formatters";
import { ValidationError } from "../utils/validation";

class ScheduleChangeRequestsService {
    findAll(filters?: { userId?: string; organizationId?: string }) {
        return prisma.scheduleChangeRequest.findMany({
            where: {
                ...(filters?.userId && { userId: filters.userId }),
                ...(filters?.organizationId && {
                    scheduleDay: { schedule: { organizationId: filters.organizationId } },
                }),
            },
            include: { scheduleDay: true },
            orderBy: { createdAt: "desc" },
        });
    }

    findById(id: string) {
        return prisma.scheduleChangeRequest.findUnique({
            where: { id },
            include: { scheduleDay: true },
        });
    }

    create(data: CreateScheduleChangeRequestDto) {
        if (!data.userId || !data.scheduleDayId || !data.reason) {
            throw new ValidationError("userId, scheduleDayId y reason son obligatorios");
        }
        return prisma.scheduleChangeRequest.create({
            data: {
                ...data,
                newCheckInTime: parseTime(data.newCheckInTime),
                newLunchStartTime: parseTime(data.newLunchStartTime),
                newLunchEndTime: parseTime(data.newLunchEndTime),
                newCheckOutTime: parseTime(data.newCheckOutTime),
                status: RequestStatus.pending,
            },
            include: { scheduleDay: true },
        });
    }

    async update(id: string, data: UpdateScheduleChangeRequestDto) {
        if (data.status !== RequestStatus.approved) {
            return prisma.scheduleChangeRequest.update({
                where: { id },
                data,
                include: { scheduleDay: true },
            });
        }

        const existing = await prisma.scheduleChangeRequest.findUniqueOrThrow({ where: { id } });

        return prisma.$transaction(async (tx) => {
            await tx.scheduleDay.update({
                where: { id: existing.scheduleDayId },
                data: {
                    ...(existing.newCheckInTime != null && { checkInTime: existing.newCheckInTime }),
                    ...(existing.newLunchStartTime != null && { lunchStartTime: existing.newLunchStartTime }),
                    ...(existing.newLunchEndTime != null && { lunchEndTime: existing.newLunchEndTime }),
                    ...(existing.newCheckOutTime != null && { checkOutTime: existing.newCheckOutTime }),
                },
            });

            return tx.scheduleChangeRequest.update({
                where: { id },
                data,
                include: { scheduleDay: true },
            });
        });
    }

    remove(id: string) {
        return prisma.scheduleChangeRequest.delete({ where: { id } });
    }
}

export default new ScheduleChangeRequestsService();
