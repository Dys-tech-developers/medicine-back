export interface UserPublicDto {
  id: number;
  nombre: string;
  email: string;
  estado: boolean;
  createdAt: string;
  roles: string[];
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserPublicDto;
}

export interface LogoutResponseDto {
  message: string;
}
