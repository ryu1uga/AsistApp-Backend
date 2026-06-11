import { DayOfWeek } from "../generated/prisma/enums";

export interface CreateScheduleDayDto {
    scheduleId: string;
    day: DayOfWeek;
    checkInTime: string;
    lunchStartTime?: string;
    lunchEndTime?: string;
    checkOutTime: string;
}

export interface UpdateScheduleDayDto extends Partial<CreateScheduleDayDto> {}
