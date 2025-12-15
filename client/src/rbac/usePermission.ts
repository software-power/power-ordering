import { jwtDecode } from "jwt-decode";

import { useAuth } from '../auth/AuthContext';

export function usePermission(action: string) {
  const { state } = useAuth();
  if (!state.accessToken) return false;
  const payload: any = jwtDecode(state.accessToken);
  const perms: string[] = payload.perms || [];
  return perms.includes(action);
}
