import { NextRequest } from 'next/server';
import { processInterest } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const totalInterest = await processInterest();

    return Response.json({
      success: true,
      totalInterestAdded: totalInterest,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Interest cron error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
