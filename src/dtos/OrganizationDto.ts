export interface CreateOrganizationDto {
    name: string;
    code: string;
    photoUrl?: string;
    description?: string;
    lateTimeLimit: number;
}

export interface UpdateOrganizationDto extends Partial<CreateOrganizationDto> {}
