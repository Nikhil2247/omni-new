// Common types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type UserRole =
  | "ADMIN_SYSTEM"
  | "OPERATIONAL_ADMIN"
  | "OPERATIONAL_MANAGER"
  | "OPERATIONAL_ASSISTANT"
  | "MARKETING_SERVICES_ADMIN"
  | "CONTENT_WRITER"
  | "MULTI_MEDIA_MANAGER"
  | "SALES_MANAGER"
  | "BUSINESS_ADMIN"
  | "USER";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
