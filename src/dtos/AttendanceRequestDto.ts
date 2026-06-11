import { RequestStatus } from "../generated/prisma/enums";

export interface CreateAttendanceRequestDto {
    userId: string;
    organizationId: string;
    requestedDate: string;
    reason: string;
}

export interface UpdateAttendanceRequestDto {
    requestedDate?: string;
    reason?: string;
    status?: RequestStatus;
    reviewedById?: string;
}
