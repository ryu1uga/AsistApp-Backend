import { AttendanceStatus } from "../generated/prisma/enums";

export interface CreateAttendanceRecordDto {
    userId: string;
    organizationId: string;
    date: string;
    checkIn?: string;
    lunchStart?: string;
    lunchEnd?: string;
    checkOut?: string;
    autoCheckout: boolean;
    lateMinutes?: number;
    totalMinutes?: number;
}

export interface UpdateAttendanceRecordDto {
    date?: string;
    checkIn?: string;
    lunchStart?: string;
    lunchEnd?: string;
    checkOut?: string;
    autoCheckout?: boolean;
    lateMinutes?: number;
    totalMinutes?: number;
    status?: AttendanceStatus;
    validatedById?: string;
}
