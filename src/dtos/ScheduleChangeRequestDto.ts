import { RequestStatus } from "../generated/prisma/enums";

export interface CreateScheduleChangeRequestDto {
    userId: string;
    scheduleDayId: string;
    newCheckInTime?: string;
    newLunchStartTime?: string;
    newLunchEndTime?: string;
    newCheckOutTime?: string;
    reason: string;
}

export interface UpdateScheduleChangeRequestDto {
    newCheckInTime?: string;
    newLunchStartTime?: string;
    newLunchEndTime?: string;
    newCheckOutTime?: string;
    reason?: string;
    status?: RequestStatus;
    reviewedById?: string;
}
