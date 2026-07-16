import { UserRole, UserStatus } from "../generated/prisma/enums";

export interface CreateUserDto {
    firstName: string;
    lastName: string;
    institutionalEmail: string;
    phoneNumber: string;
    career?: string;
    cycle?: number;
    organizationId?: string;
    role: UserRole;
    status?: UserStatus;
    deviceToken?: string;
    password: string;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}
