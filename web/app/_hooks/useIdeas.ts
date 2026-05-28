"use client";

import useSWR, { type KeyedMutator } from "swr";
import { api } from "@/lib/api";
import type {
  IdeaVO,
  IdeaCreateReq,
  IdeaUpdateReq,
  PageResult,
} from "@/lib/types";

const key = (projectId: number | null): string | null =>
  projectId ? `ideas-${projectId}` : null;

const fetcher = (projectId: number) => (): Promise<PageResult<IdeaVO>> =>
  api<PageResult<IdeaVO>>(`/api/projects/${projectId}/ideas?page=1&size=200`);

export interface UseIdeasResult {
  ideas: IdeaVO[];
  isLoading: boolean;
  error: Error | undefined;
  refetch: KeyedMutator<PageResult<IdeaVO>>;
  create: (content: string) => Promise<IdeaVO>;
  update: (id: number, req: IdeaUpdateReq) => Promise<IdeaVO>;
  toggleComplete: (id: number, current: boolean) => Promise<IdeaVO>;
  remove: (id: number) => Promise<void>;
  /** 调 reorder API,不动 SWR cache(乐观更新由调用方做) */
  reorderApi: (ids: number[]) => Promise<void>;
  /** 直接覆盖本地 records(乐观更新 + 拖拽 revert 用) */
  setLocal: (records: IdeaVO[]) => Promise<void>;
}

/**
 * 想法列表 + CRUD + 重排。PR-3 ADR-15 + ADR-17。
 */
export function useIdeas(projectId: number | null): UseIdeasResult {
  const swrKey = key(projectId);
  const { data, error, isLoading, mutate } = useSWR<PageResult<IdeaVO>>(
    swrKey,
    projectId ? fetcher(projectId) : null,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const ideas = data?.records ?? [];

  const create = async (content: string): Promise<IdeaVO> => {
    if (!projectId) throw new Error("no project");
    const body: IdeaCreateReq = { content };
    const i = await api<IdeaVO>(`/api/projects/${projectId}/ideas`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    await mutate();
    return i;
  };

  const update = async (id: number, req: IdeaUpdateReq): Promise<IdeaVO> => {
    const i = await api<IdeaVO>(`/api/ideas/${id}`, {
      method: "PUT",
      body: JSON.stringify(req),
    });
    await mutate();
    return i;
  };

  const toggleComplete = async (id: number, current: boolean): Promise<IdeaVO> =>
    update(id, { completed: !current });

  const remove = async (id: number): Promise<void> => {
    await api<void>(`/api/ideas/${id}`, { method: "DELETE" });
    await mutate();
  };

  const reorderApi = async (ids: number[]): Promise<void> => {
    if (!projectId) return;
    await api<void>(`/api/projects/${projectId}/ideas/reorder`, {
      method: "PUT",
      body: JSON.stringify({ ids }),
    });
  };

  const setLocal = async (records: IdeaVO[]): Promise<void> => {
    if (!data) return;
    await mutate({ ...data, records }, { revalidate: false });
  };

  return {
    ideas,
    isLoading,
    error,
    refetch: mutate,
    create,
    update,
    toggleComplete,
    remove,
    reorderApi,
    setLocal,
  };
}
