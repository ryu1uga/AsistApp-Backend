import prisma from "../config/db";
import { CreateAttendanceRecordDto, UpdateAttendanceRecordDto } from "../dtos";
import { AttendanceStatus } from "../generated/prisma/enums";

class AttendanceRecordsService {
    findAll() {
        return prisma.attendanceRecord.findMany();
    }

    findById(id: string) {
        return prisma.attendanceRecord.findUnique({ where: { id } });
    }

    create(data: CreateAttendanceRecordDto) {
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
