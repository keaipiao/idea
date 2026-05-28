"use client";

import useSWR, { type KeyedMutator } from "swr";
import { api } from "@/lib/api";
import type {
  PageResult,
  ProjectVO,
  ProjectCreateReq,
  ProjectUpdateReq,
} from "@/lib/types";

const KEY = "projects";

const fetcher = (): Promise<PageResult<ProjectVO>> =>
  api<PageResult<ProjectVO>>("/api/projects?page=1&size=200");

export interface UseProjectsResult {
  projects: ProjectVO[];
  isLoading: boolean;
  error: Error | undefined;
  refetch: KeyedMutator<PageResult<ProjectVO>>;
  create: (name: string) => Promise<ProjectVO>;
  update: (id: number, req: ProjectUpdateReq) => Promise<ProjectVO>;
  remove: (id: number) => Promise<void>;
}

/**
 * 项目列表 + CRUD。PR-3 ADR-15。
 */
export function useProjects(): UseProjectsResult {
  const { data, error, isLoading, mutate } = useSWR<PageResult<ProjectVO>>(KEY, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const projects = data?.records ?? [];

  const create = async (name: string): Promise<ProjectVO> => {
    const body: ProjectCreateReq = { name };
    const p = await api<ProjectVO>("/api/projects", {
      method: "POST",
      body: JSON.stringify(body),
    });
    await mutate();
    return p;
  };

  const update = async (id: number, req: ProjectUpdateReq): Promise<ProjectVO> => {
    const p = await api<ProjectVO>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    });
    await mutate();
    return p;
  };

  const remove = async (id: number): Promise<void> => {
    await api<void>(`/api/projects/${id}`, { method: "DELETE" });
    await mutate();
  };

  return { projects, isLoading, error, refetch: mutate, create, update, remove };
}
