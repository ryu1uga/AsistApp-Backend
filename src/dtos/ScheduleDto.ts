import { DayOfWeek, ScheduleStatus } from "../generated/prisma/enums";

export interface CreateScheduleDayInput {
    day: DayOfWeek;
    checkInTime: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
    checkOutTime: string;
}

export interface CreateScheduleDto {
    userId: string;
    organizationId: string;
    weeklyHours: number;
    status: ScheduleStatus;
    days?: CreateScheduleDayInput[];
}

export interface UpdateScheduleDto extends Partial<CreateScheduleDto> {}
