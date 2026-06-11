import { LogCategory } from "../generated/prisma/enums";

export interface CreateActivityLogDto {
    organizationId: string;
    performedById: string;
    affectedUserId: string;
    title: string;
    category: LogCategory;
}

export interface UpdateActivityLogDto extends Partial<CreateActivityLogDto> {}
