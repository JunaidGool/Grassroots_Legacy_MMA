export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface DashboardStats {
  totalFighters: number;
  weighedIn: number;
  totalBouts: number;
  scored: number;
}
