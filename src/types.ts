export type UserRole = "user" | "admin";

export interface User {
  id: number;
  uuid?: string;
  name: string;
  email: string;
  role: UserRole;
}

export type CategoryType = "income" | "expense";

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  color?: string | null;
  icon?: string | null;
  is_default?: number | boolean;
}

export interface UploadedFile {
  id: number | string;
  original_name?: string | null;
  mime_type?: string | null;
  size?: number | null;
  url?: string | null;
}

export interface Transaction {
  id: number;
  kind: CategoryType;
  type?: CategoryType;
  amount: number;
  date: string;
  description?: string | null;
  category_id?: number | null;
  category?: Category | null;
  file_id?: number | string | null;
  file?: UploadedFile | null;
  created_at?: string;
  updated_at?: string;
}

export interface SummaryByCategory {
  categoryId?: number | string | null;
  category?: string;
  total: number;
}

export interface Summary {
  month?: string;
  incomes: number;
  expenses: number;
  balance: number;
  byCategory?: SummaryByCategory[];
}
