export interface UserListItemDto {
  id: number;
  nombre: string;
  email: string;
  estado: boolean;
  createdAt: string;
  roles: string[];
}

export interface PaginatedUsersDto {
  items: UserListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}
