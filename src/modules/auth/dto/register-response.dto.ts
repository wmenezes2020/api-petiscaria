export class RegisterResponseDto {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
    companyName: string;
    tenantId: string;
  };
  accessToken: string;
  refreshToken: string;
}



