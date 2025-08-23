export class RegisterResponseDto {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
    companyName: string;
  };
  accessToken: string;
  refreshToken: string;
}



