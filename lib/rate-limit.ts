import { prisma } from '@/lib/prisma';

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  isPro: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { allowed: false, remaining: 0, isPro: false };
  }

  // Check if user has active subscription
  const isPro = user.stripeSubscriptionId &&
    user.stripeCurrentPeriodEnd &&
    user.stripeCurrentPeriodEnd > new Date();

  if (isPro) {
    return { allowed: true, remaining: -1, isPro: true }; // Unlimited
  }

  // Free tier: 10 queries
  const remaining = Math.max(0, 10 - user.freeQueriesUsed);
  return {
    allowed: remaining > 0,
    remaining,
    isPro: false
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return;

  // Check if pro user
  const isPro = user.stripeSubscriptionId &&
    user.stripeCurrentPeriodEnd &&
    user.stripeCurrentPeriodEnd > new Date();

  await prisma.user.update({
    where: { id: userId },
    data: {
      totalQueries: { increment: 1 },
      freeQueriesUsed: isPro ? user.freeQueriesUsed : { increment: 1 },
    },
  });

  // Log the query
  await prisma.query.create({
    data: {
      userId,
      question: 'Data analysis query',
    },
  });
}