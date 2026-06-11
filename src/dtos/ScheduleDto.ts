import { ScheduleStatus } from "../generated/prisma/enums";

export interface CreateScheduleDto {
    userId: string;
    organizationId: string;
    weeklyHours: number;
    status: ScheduleStatus;
}

export interface UpdateScheduleDto extends Partial<CreateScheduleDto> {}
