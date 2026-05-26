import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { processLogin, getDashboardData } from '@/lib/actions';
import { createSnapshot } from '@/lib/db';
import { calculateDailyInterest } from '@/lib/game-engine';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Process daily login streak
    await processLogin();

    // Get current dashboard data
    const data = await getDashboardData();
    if (!data) {
      return Response.json({ error: 'No player data found' }, { status: 404 });
    }

    const { player, bosses, totalDebt, monthlyPaid, dailyBudget, monthlyBudget, estimatedPayoff } = data;

    // Calculate daily interest total
    const dailyInterest = bosses
      .filter((b) => !b.is_defeated)
      .reduce((sum, b) => sum + calculateDailyInterest(b), 0);

    // Calculate total paid across all bosses
    const totalPaid = bosses.reduce((sum, b) => sum + (b.original_hp - (b.is_defeated ? 0 : b.current_hp)), 0);

    // Count defeated bosses
    const bossesDefeated = bosses.filter((b) => b.is_defeated).length;

    // Create daily snapshot
    const today = new Date().toISOString().split('T')[0];
    const snapshot = createSnapshot({
      id: uuidv4(),
      snapshot_date: today,
      total_debt: totalDebt,
      total_paid: totalPaid,
      daily_interest: dailyInterest,
      monthly_paid: monthlyPaid,
      daily_budget: dailyBudget,
      monthly_budget: monthlyBudget,
      player_level: player.level,
      player_xp: player.xp,
      bosses_defeated: bossesDefeated,
      estimated_payoff: estimatedPayoff,
    });

    return Response.json({
      success: true,
      snapshot_date: today,
      summary: {
        totalDebt,
        totalPaid,
        dailyInterest,
        monthlyPaid,
        dailyBudget,
        monthlyBudget,
        playerLevel: player.level,
        playerXp: player.xp,
        bossesDefeated,
        estimatedPayoff,
      },
    });
  } catch (error) {
    console.error('Morning cron error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
