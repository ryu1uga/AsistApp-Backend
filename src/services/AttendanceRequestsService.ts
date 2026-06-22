import prisma from "../config/db";
import { CreateAttendanceRequestDto, UpdateAttendanceRequestDto } from "../dtos";
import { RequestStatus } from "../generated/prisma/enums";

class AttendanceRequestsService {
    findAll() {
        return prisma.attendanceRequest.findMany();
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
