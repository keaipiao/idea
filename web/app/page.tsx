"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "./_components/AuthGate";
import { useProjects } from "./_hooks/useProjects";
import { ProjectSidebar } from "./_components/ProjectSidebar";
import { EmptyState } from "./_components/EmptyState";
import { Skeleton } from "./_components/Skeleton";
import { COPY } from "@/lib/copy";

/**
 * 首页 /:鉴权后看项目。有项目则跳第一个,无项目显示 EmptyState。
 * PR-3 § 3.3 路由结构。
 */
export default function Home() {
  return (
    <AuthGate>
      <HomeContent />
    </AuthGate>
  );
}

function HomeContent() {
  const router = useRouter();
  const { projects, isLoading, error } = useProjects();

  useEffect(() => {
    if (!isLoading && !error && projects.length > 0) {
      router.replace(`/projects/${projects[0].id}`);
    }
  }, [isLoading, error, projects, router]);

  return (
    <div className="grid h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
      <div className="hidden lg:block">
        <ProjectSidebar currentId={null} />
      </div>
      <main className="flex items-center justify-center">
        {isLoading && <Skeleton className="h-16 w-64" />}
        {error && <div className="text-[var(--color-danger)]">{COPY.networkError}</div>}
        {!isLoading && !error && projects.length === 0 && (
          <EmptyState message={COPY.projectEmpty} />
        )}
      </main>
    </div>
  );
}
