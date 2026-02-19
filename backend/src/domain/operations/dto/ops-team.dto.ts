import { IsOptional, IsString } from 'class-validator';

export class GetTeamMembersDto {
  @IsOptional()
  @IsString()
  role?: 'OPERATIONAL_MANAGER' | 'OPERATIONAL_ASSISTANT';

  @IsOptional()
  @IsString()
  status?: string;
}
