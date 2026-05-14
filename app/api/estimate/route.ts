import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { calculateEarnings } from '@/lib/estimator';
import { EstimatorInput } from '@/lib/estimator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<EstimatorInput>;

    // Validate required field
    if (!body.cmz_code || typeof body.cmz_code !== 'string' || !body.cmz_code.trim()) {
      return NextResponse.json(
        { error: 'cmz_code is required' },
        { status: 400 }
      );
    }

    const input: EstimatorInput = {
      cmz_code:     body.cmz_code.trim().toUpperCase(),
      battery_kwh:  Number(body.battery_kwh)  || 0,
      inverter_kw:  Number(body.inverter_kw)  || 0,
      solar_kw:     Number(body.solar_kw)     || 0,
      ev_kw:        Number(body.ev_kw)        || 0,
      heat_pump_kw: Number(body.heat_pump_kw) || 0,
    };

    const pool = getPool();
    const result = await calculateEarnings(pool, input);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[estimate] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
