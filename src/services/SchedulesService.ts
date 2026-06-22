import prisma from "../config/db";
import { CreateScheduleDto, UpdateScheduleDto } from "../dtos";

class SchedulesService {
    findAll() {
        return prisma.schedule.findMany();
    }

    findById(id: string) {
        return prisma.schedule.findUnique({ where: { id } });
    }

    create(data: CreateScheduleDto) {
        return prisma.schedule.create({ data });
    }

    update(id: string, data: UpdateScheduleDto) {
        return prisma.schedule.update({ where: { id }, data });
    }

    remove(id: string) {
        return prisma.schedule.delete({ where: { id } });
    }
}

export default new SchedulesService();
