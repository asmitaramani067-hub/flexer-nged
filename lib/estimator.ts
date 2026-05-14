/**
 * NGED CMZ Earning Estimator — TypeScript port of the updated Python service.
 *
 * UP trades  (increase grid headroom): battery discharge + solar + EV/HP turn-off
 * DOWN trades (absorb excess energy):  battery charging  + EV/HP turn-on
 * Participation capped at 2 h per opportunity.
 * Only historical data (past 12 months, no future dates).
 */

import { Pool } from 'pg';

// ─── Constants ────────────────────────────────────────────────────────────────
const BATTERY_EFFICIENCY          = 0.95;
const NGED_MAX_PARTICIPATION_HOURS = 2.0;
const SOLAR_CAPACITY_FACTOR        = 0.3;   // 30% average UK capacity factor

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Asset {
  id: string;
  name: string;
  type: string;
  capacity_kw: number;
  direction: 'UP' | 'DOWN' | 'BOTH';
}

export interface AssetGroup {
  total_capacity_kw: number;
  assets: Asset[];
}

export interface CompetitionResult {
  opportunity_id: string;
  name: string;
  direction: 'UP' | 'DOWN';
  reward_rate: number;
  duration_h: number;
  eligible_capacity_kw: number;
  earnings_gbp: number;
  date: string;
}

export interface EarningEstimationResponse {
  cmz_code: string;
  up_assets: AssetGroup;
  down_assets: AssetGroup;
  up_competitions: CompetitionResult[];
  down_competitions: CompetitionResult[];
  up_total_earnings: number;
  down_total_earnings: number;
  grand_total_earnings: number;
}

export interface EstimatorInput {
  cmz_code: string;
  battery_kwh: number;
  inverter_kw: number;
  solar_kw: number;
  ev_kw: number;
  heat_pump_kw: number;
}

// ─── Asset builder ────────────────────────────────────────────────────────────
// Matches updated Python build_user_assets():
//   Battery → BOTH  (discharge UP, charge DOWN)
//   Solar   → UP only
//   EV      → BOTH  (turn-off UP, turn-on DOWN)
//   HP      → BOTH  (turn-off UP, turn-on DOWN)
//   Inverter is NOT a separate asset — it caps battery power only
function buildAssets(input: EstimatorInput): Asset[] {
  const { battery_kwh, inverter_kw, solar_kw, ev_kw, heat_pump_kw } = input;
  const assets: Asset[] = [];

  if (battery_kwh > 0) {
    const battPower = inverter_kw > 0 ? inverter_kw : battery_kwh;
    assets.push({ id: 'input_batt', name: 'Home Battery',  type: 'battery',    capacity_kw: battPower,    direction: 'BOTH' });
  }
  if (solar_kw > 0) {
    assets.push({ id: 'input_solar', name: 'Solar Array',  type: 'solar',      capacity_kw: solar_kw,     direction: 'UP' });
  }
  if (ev_kw > 0) {
    assets.push({ id: 'input_ev',   name: 'EV Charger',    type: 'ev_charger', capacity_kw: ev_kw,        direction: 'BOTH' });
  }
  if (heat_pump_kw > 0) {
    assets.push({ id: 'input_hp',   name: 'Heat Pump',     type: 'heat_pump',  capacity_kw: heat_pump_kw, direction: 'BOTH' });
  }

  return assets;
}

// ─── Classify & aggregate ─────────────────────────────────────────────────────
function classifyAndAggregate(assets: Asset[]): [AssetGroup, AssetGroup] {
  const up:   AssetGroup = { total_capacity_kw: 0, assets: [] };
  const down: AssetGroup = { total_capacity_kw: 0, assets: [] };

  for (const asset of assets) {
    if (asset.direction === 'UP' || asset.direction === 'BOTH') {
      up.assets.push(asset);
      up.total_capacity_kw += asset.capacity_kw;
    }
    if (asset.direction === 'DOWN' || asset.direction === 'BOTH') {
      down.assets.push(asset);
      down.total_capacity_kw += asset.capacity_kw;
    }
  }

  return [up, down];
}

// ─── Parse HH:MM duration ────────────────────────────────────────────────────
function parseDurationHours(startTime: string, endTime: string): number {
  try {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let duration = (eh * 60 + em - (sh * 60 + sm)) / 60;
    if (duration < 0) duration += 24;
    return duration;
  } catch {
    return 1.0;
  }
}

// ─── DB row type ─────────────────────────────────────────────────────────────
interface RawRow {
  opportunity_id: string;
  opportunity_name: string;
  service_response_direction: string;
  utilisation_ceiling_price: number;
  min_required_capacity_mw: number;
  start_date: Date | string;
  start_time: string;
  end_time: string;
}

// ─── DB query — public schema (matches Python SQLAlchemy default) ─────────────
async function fetchRows(pool: Pool, cmzCode: string): Promise<RawRow[]> {
  const query = `
    SELECT
      tov."opportunityId"            AS opportunity_id,
      tov."opportunityName"          AS opportunity_name,
      tov."serviceResponseDirection" AS service_response_direction,
      tov."utilisationCeilingPrice"  AS utilisation_ceiling_price,
      dp."minRequiredCapacityMw"     AS min_required_capacity_mw,
      dp."startDate"                 AS start_date,
      dp."startTime"                 AS start_time,
      dp."endTime"                   AS end_time
    FROM   public.trade_opportunity_versions tov
    JOIN   public.nged_windows               w   ON w.opportunity_version_id = tov.id
    JOIN   public.nged_delivery_periods      dp  ON dp.window_id             = w.id
    WHERE  tov."cmzCode"  = $1
    AND    tov.valid_to IS NULL
  `;
  const result = await pool.query<RawRow>(query, [cmzCode]);
  return result.rows;
}

// ─── Main estimator ───────────────────────────────────────────────────────────
export async function calculateEarnings(
  pool: Pool,
  input: EstimatorInput
): Promise<EarningEstimationResponse> {
  const { cmz_code, battery_kwh, inverter_kw, solar_kw, ev_kw, heat_pump_kw } = input;

  // 1. Build & classify assets
  const assets = buildAssets(input);
  const [upAssets, downAssets] = classifyAndAggregate(assets);

  // 2. Fetch from DB
  const rows = await fetchRows(pool, cmz_code);

  // 3. Date bounds — only past 12 months, NO future dates
  const now = new Date();
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  // Battery power cap (same as Python: min(inverter_kw, battery_kwh / duration))
  // We compute per-row below since duration varies.

  const dailyMap = new Map<string, CompetitionResult[]>();

  for (const row of rows) {
    // Parse & validate date
    let startDt: Date;
    try {
      startDt = row.start_date instanceof Date ? row.start_date : new Date(row.start_date);
      if (isNaN(startDt.getTime())) continue;
    } catch {
      continue;
    }

    // ── Filter: only historical, no future ──────────────────────────────────
    if (startDt < twelveMonthsAgo || startDt > now) continue;

    const dateStr = startDt.toISOString().split('T')[0];

    // Direction
    const dirRaw = row.service_response_direction || '';
    const direction: 'UP' | 'DOWN' =
      dirRaw.includes('DTU') || dirRaw.includes('GTD') ? 'DOWN' : 'UP';

    // Duration & participation cap
    const fullDuration    = parseDurationHours(row.start_time, row.end_time);
    const participation   = Math.min(fullDuration, NGED_MAX_PARTICIPATION_HOURS);

    // Battery power for this slot
    const batteryKw = battery_kwh > 0
      ? (inverter_kw > 0
          ? inverter_kw
          : (fullDuration > 0 ? Math.min(battery_kwh / fullDuration, battery_kwh) : 0))
      : 0;

    // Available capacity — matches updated Python logic
    let availableKw: number;
    if (direction === 'UP') {
      const solarOutput  = solar_kw    > 0 ? solar_kw    * SOLAR_CAPACITY_FACTOR : 0;
      const evContrib    = ev_kw       > 0 ? ev_kw       * 0.5 : 0;
      const hpContrib    = heat_pump_kw > 0 ? heat_pump_kw * 0.5 : 0;
      availableKw = batteryKw + solarOutput + evContrib + hpContrib;
    } else {
      // DOWN: battery charging + EV/HP turn-on (no solar)
      const evContrib    = ev_kw       > 0 ? ev_kw       * 0.5 : 0;
      const hpContrib    = heat_pump_kw > 0 ? heat_pump_kw * 0.5 : 0;
      availableKw = batteryKw + evContrib + hpContrib;
    }

    const availableMw  = (availableKw / 1000) * BATTERY_EFFICIENCY;
    const minMw        = Number(row.min_required_capacity_mw) || 0;
    const rewardRate   = Number(row.utilisation_ceiling_price) || 0;

    const earnings = availableMw >= minMw
      ? rewardRate * availableMw * participation
      : 0;

    const comp: CompetitionResult = {
      opportunity_id:       String(row.opportunity_id),
      name:                 row.opportunity_name || 'Unknown',
      direction,
      reward_rate:          rewardRate,
      duration_h:           participation,
      eligible_capacity_kw: availableKw,
      earnings_gbp:         Math.round(earnings * 10000) / 10000,
      date:                 dateStr,
    };

    if (!dailyMap.has(dateStr)) dailyMap.set(dateStr, []);
    dailyMap.get(dateStr)!.push(comp);
  }

  // 4. Top-2 per day, positive earnings only
  const upResults:   CompetitionResult[] = [];
  const downResults: CompetitionResult[] = [];
  let upTotal   = 0;
  let downTotal = 0;

  for (const [, dayComps] of dailyMap) {
    dayComps.sort((a, b) => b.earnings_gbp - a.earnings_gbp);
    for (const res of dayComps.slice(0, 2)) {
      if (res.earnings_gbp <= 0) continue;
      if (res.direction === 'UP') {
        upResults.push(res);
        upTotal += res.earnings_gbp;
      } else {
        downResults.push(res);
        downTotal += res.earnings_gbp;
      }
    }
  }

  return {
    cmz_code,
    up_assets:            upAssets,
    down_assets:          downAssets,
    up_competitions:      upResults,
    down_competitions:    downResults,
    up_total_earnings:    Math.round(upTotal   * 100) / 100,
    down_total_earnings:  Math.round(downTotal * 100) / 100,
    grand_total_earnings: Math.round((upTotal + downTotal) * 100) / 100,
  };
}
