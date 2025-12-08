import axios from "axios";
import { API_URL } from "../config";
import type { Category, Summary, Transaction, UploadedFile } from "../types";

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("finanzapp_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getSummary = (month: string) =>
  apiClient
    .get<Summary>("/transactions/summary", { params: { month } })
    .then((res) => res.data);

export const getCategories = () =>
  apiClient.get<Category[]>("/categories").then((res) => res.data);

export const createCategory = (data: { name: string; type: Category["type"]; color?: string }) =>
  apiClient.post<Category>("/categories", data).then((res) => res.data);

export type TransactionsQuery = {
  month?: string;
  categoryId?: number | string;
  kind?: Transaction["kind"] | "all";
};

export const getTransactions = (params?: TransactionsQuery) =>
  apiClient
    .get<Transaction[]>("/transactions", {
      params: {
        ...params,
        kind: params?.kind === "all" ? undefined : params?.kind,
        type: params?.kind === "all" ? undefined : params?.kind,
      },
    })
    .then((res) => res.data);

export type TransactionPayload = {
  kind: Transaction["kind"];
  type?: Transaction["kind"];
  amount: number;
  date: string;
  category_id?: number | string;
  description?: string;
  file_id?: number | string | null;
};

export const createTransaction = (data: TransactionPayload) =>
  apiClient
    .post<Transaction>("/transactions", { ...data, type: data.kind })
    .then((res) => res.data);

export const deleteTransaction = (id: number | string) =>
  apiClient.delete(`/transactions/${id}`).then((res) => res.data);

export const uploadFile = (formData: FormData) =>
  apiClient
    .post<UploadedFile>("/files", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);

export { apiClient };
