import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { question, dataSize, chartType } = await req.json();

    // Log to database if you want persistent storage
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        // Create a query record for tracking
        await prisma.query.create({
          data: {
            userId: user.id,
            question: question || 'No question provided',
            dataInfo: JSON.stringify({ dataSize, chartType }),
          },
        });
      }
    }

    // Always log to console for Vercel logs
    console.log('[Question Log]', {
      timestamp: new Date().toISOString(),
      question,
      dataSize,
      chartType,
      userEmail: session?.user?.email || 'anonymous',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Question Log Error]', error);
    return NextResponse.json({ success: false });
  }
}