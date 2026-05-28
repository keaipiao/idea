"use client";

import { use } from "react";
import { AuthGate } from "@/app/_components/AuthGate";
import { ProjectSidebar } from "@/app/_components/ProjectSidebar";
import { IdeaList } from "@/app/_components/IdeaList";
import { useProjects } from "@/app/_hooks/useProjects";

/**
 * 项目详情:左侧栏 + 右侧想法列表。
 * PR-3 § 3.3。Next.js 16 params 是 Promise。
 */
export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projectId = Number(id);
  return (
    <AuthGate>
      <ProjectContent projectId={projectId} />
    </AuthGate>
  );
}

function ProjectContent({ projectId }: { projectId: number }) {
  const { projects } = useProjects();
  const project = projects.find((p) => p.id === projectId);

  return (
    <div className="grid h-screen grid-cols-1 lg:grid-cols-[240px_1fr]">
      <div className="hidden lg:block">
        <ProjectSidebar currentId={projectId} />
      </div>
      <main className="overflow-hidden bg-[var(--color-bg-primary)]">
        <IdeaList projectId={projectId} projectName={project?.name ?? "..."} />
      </main>
    </div>
  );
}
