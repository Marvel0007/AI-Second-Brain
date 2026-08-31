import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireCurrentWorkspace() {
  const user = await requireUser();

  let workspace = await prisma.workspace.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "My Workspace",
        userId: user.id,
      },
    });
  }

  return workspace;
}