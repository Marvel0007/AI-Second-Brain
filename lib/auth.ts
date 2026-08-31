import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: {
      clerkId: userId,
    },
  });

  if (!user) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        const name =
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          "User";

        user = await prisma.user.upsert({
          where: { clerkId: userId },
          update: { email, name },
          create: { clerkId: userId, email, name },
        });
      }
    }
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function getCurrentWorkspace() {
  const user = await requireUser();

  return prisma.workspace.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function requireWorkspace() {
  const workspace = await getCurrentWorkspace();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return workspace;
}