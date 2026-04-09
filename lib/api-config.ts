// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  "https://ecotrans-intranet-370980788525.europe-west1.run.app";

export const API_ENDPOINTS = {
  users: `${API_BASE_URL}/usuarios`,
  roles: `${API_BASE_URL}/roles`,
  rolesList: `${API_BASE_URL}/roles/list`,
} as const;
