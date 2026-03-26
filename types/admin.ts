// Types for Admin Panel

export interface Permission {
  title: string;
  url?: string;
  icon?: string;
}

export interface Module {
  title: string;
  icon?: string;
  items?: Permission[];
}

export interface ExtraPermissions {
  modules: Module[];
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role_id: number;
  role_name: string;
  extra_permissions: ExtraPermissions | null;
}

export interface Role {
  id: number;
  name: string;
  json_menu: Module[];
}

export interface RoleListItem {
  id: number;
  name: string;
}

export interface UserFormData {
  username: string;
  full_name: string;
  role_id: number;
  extra_permissions: ExtraPermissions | null;
}

// Pagination
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationState;
  totalPages: number;
}
