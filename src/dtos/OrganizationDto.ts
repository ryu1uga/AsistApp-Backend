export interface CreateOrganizationDto {
    name: string;
    photoUrl?: string;
    description?: string;
    lateTimeLimit: number;
}

export interface UpdateOrganizationDto extends Partial<CreateOrganizationDto> {}
