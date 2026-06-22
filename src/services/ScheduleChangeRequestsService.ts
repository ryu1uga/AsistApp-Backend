import prisma from "../config/db";
import { CreateScheduleChangeRequestDto, UpdateScheduleChangeRequestDto } from "../dtos";
import { RequestStatus } from "../generated/prisma/enums";

class ScheduleChangeRequestsService {
    findAll() {
        return prisma.scheduleChangeRequest.findMany();
    }

    findById(id: string) {
        return prisma.scheduleChangeRequest.findUnique({ where: { id } });
    }

    create(data: CreateScheduleChangeRequestDto) {
        return prisma.scheduleChangeRequest.create({ data: { ...data, status: RequestStatus.pending } });
    }

    update(id: string, data: UpdateScheduleChangeRequestDto) {
        return prisma.scheduleChangeRequest.update({ where: { id }, data });
    }

    remove(id: string) {
        return prisma.scheduleChangeRequest.delete({ where: { id } });
    }
}

export default new ScheduleChangeRequestsService();
