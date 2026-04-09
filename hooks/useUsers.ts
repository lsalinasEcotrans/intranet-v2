// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_ENDPOINTS } from '@/lib/api-config';
import type { User, Role, RoleListItem, UserFormData } from '@/types/admin';

export const USERS_QUERY_KEY = 'users';
export const ROLES_QUERY_KEY = 'roles';
export const ROLES_LIST_QUERY_KEY = 'rolesList';

export function useUsers() {
  return useQuery({
    queryKey: [USERS_QUERY_KEY],
    queryFn: () => axios.get<User[]>(API_ENDPOINTS.users).then(res => res.data),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: [ROLES_QUERY_KEY],
    queryFn: () => axios.get<Role[]>(API_ENDPOINTS.roles).then(res => res.data),
  });
}

export function useRolesList() {
  return useQuery({
    queryKey: [ROLES_LIST_QUERY_KEY],
    queryFn: () => axios.get<RoleListItem[]>(API_ENDPOINTS.rolesList).then(res => res.data),
  });
}

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: ['permissionsCatalog'],
    queryFn: async () => {
      const rolesRes = await axios.get<Role[]>(API_ENDPOINTS.roles);
      const allMenus = rolesRes.data.flatMap((r) => r.json_menu ?? []);

      const normalizeMenu = (menus: any[]): any[] => {
        return menus.map((m) => ({
          title: m.name ?? m.title,
          url: m.url ?? "",
          icon: m.icon
            ? m.icon.charAt(0).toUpperCase() + m.icon.slice(1)
            : undefined,
          items: m.children
            ? normalizeMenu(m.children)
            : m.items
              ? normalizeMenu(m.items)
              : [],
        }));
      };

      const dedupeMenu = (menus: any[]): any[] => {
        const map = new Map<string, any>();
        for (const m of menus) {
          if (!map.has(m.title)) {
            map.set(m.title, {
              ...m,
              items: dedupeMenu(m.items || []),
            });
          }
        }
        return Array.from(map.values());
      };

      const sortMenu = (menus: any[]): any[] => {
        return menus
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((m) => ({
            ...m,
            items: sortMenu(m.items || []),
          }));
      };

      const normalized = normalizeMenu(allMenus);
      const unique = dedupeMenu(normalized);
      const sorted = sortMenu(unique);

      return sorted;
    },
  });
}

// Mutations
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserFormData) =>
      axios.post(API_ENDPOINTS.users, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserFormData }) =>
      axios.put(`${API_ENDPOINTS.users}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      axios.delete(`${API_ENDPOINTS.users}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}