// Re-export the shared Auth types so they can be imported from a single location.
export type { UserRole, AccountStatus, AuthUser } from "./express.js";

// Generic paginated response shape.
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Generic API response envelope (mirrors ApiResponse class shape).
export interface ApiEnvelope<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

// Generic query params shared across paginated routes.
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
