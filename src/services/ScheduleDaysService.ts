import prisma from "../config/db";
import { CreateScheduleDayDto, UpdateScheduleDayDto } from "../dtos";

class ScheduleDaysService {
    findAll() {
        return prisma.scheduleDay.findMany();
    }

    findByScheduleId(scheduleId: string) {
        return prisma.scheduleDay.findMany({ where: { scheduleId } });
    }

    findById(id: string) {
        return prisma.scheduleDay.findUnique({ where: { id } });
    }

    create(data: CreateScheduleDayDto) {
        return prisma.scheduleDay.create({ data });
    }

    update(id: string, data: UpdateScheduleDayDto) {
        return prisma.scheduleDay.update({ where: { id }, data });
    }

    remove(id: string) {
        return prisma.scheduleDay.delete({ where: { id } });
    }
}

export default new ScheduleDaysService();
