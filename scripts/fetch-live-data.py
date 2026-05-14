"""
NGED Live Data Fetcher - Pull real opportunities from NGED API to Neon DB

This script fetches real NGED trade opportunities and stores them in Neon PostgreSQL.
It preserves the existing schema and only adds real data.

Usage:
  python scripts/fetch-live-data.py daily      # Fetch Day-Ahead (this week)
  python scripts/fetch-live-data.py backfill   # Fetch ALL short-term opportunities
"""

import sys
import os
from datetime import datetime, timedelta, timezone
from dateutil import parser
import psycopg2
from psycopg2.extras import execute_values

# Add parent directory to path to import NGED API modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

from endpoints.ngedapi import NGEDAPI
from endpoints.nged_enums import TimeWindow, Horizon, OrderColumn, OrderDirection

# Neon database connection
NEON_DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://neondb_owner:npg_4xuzRdIin6Vc@ep-noisy-glitter-aqec9x6k.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require'
)


def get_neon_connection():
    """Create connection to Neon PostgreSQL"""
    return psycopg2.connect(NEON_DATABASE_URL)


def clear_existing_data(conn):
    """Clear dummy data from Neon database"""
    print("🧹 Clearing existing dummy data...")
    with conn.cursor() as cur:
        cur.execute('TRUNCATE public.trade_opportunity_versions CASCADE')
        conn.commit()
    print("✓ Dummy data cleared")


def store_opportunities(conn, opportunities):
    """
    Store opportunities in Neon database using existing schema
    
    Schema:
    - trade_opportunity_versions (opportunityId, opportunityName, cmzCode, 
      serviceResponseDirection, utilisationCeilingPrice, valid_to)
    - nged_windows (opportunity_version_id)
    - nged_delivery_periods (window_id, minRequiredCapacityMw, startDate, 
      startTime, endTime)
    """
    if not opportunities:
        print("No opportunities to store")
        return 0
    
    stored_count = 0
    
    with conn.cursor() as cur:
        for opp in opportunities:
            try:
                # Extract opportunity data
                opp_id = opp.get('opportunityId')
                opp_name = opp.get('opportunityName', 'Unknown')
                cmz_code = opp.get('cmzCode')
                
                # Skip if no CMZ code
                if not cmz_code:
                    continue
                
                # Get service response direction
                service_response = opp.get('serviceResponseDirection', 'GTU')
                
                # Get utilisation ceiling price (reward rate)
                utilisation_price = opp.get('utilisationCeilingPrice', 0)
                
                # Insert trade_opportunity_version
                cur.execute("""
                    INSERT INTO public.trade_opportunity_versions 
                    ("opportunityId", "opportunityName", "cmzCode", 
                     "serviceResponseDirection", "utilisationCeilingPrice", valid_to)
                    VALUES (%s, %s, %s, %s, %s, NULL)
                    RETURNING id
                """, (opp_id, opp_name, cmz_code, service_response, utilisation_price))
                
                tov_id = cur.fetchone()[0]
                
                # Process windows and delivery periods
                windows = opp.get('windows', [])
                
                for window in windows:
                    # Insert window
                    cur.execute("""
                        INSERT INTO public.nged_windows (opportunity_version_id)
                        VALUES (%s)
                        RETURNING id
                    """, (tov_id,))
                    
                    window_id = cur.fetchone()[0]
                    
                    # Process delivery periods
                    delivery_periods = window.get('deliveryPeriods', [])
                    
                    for period in delivery_periods:
                        # Extract period data
                        min_capacity = period.get('minRequiredCapacityMw', 0.005)
                        start_date_str = period.get('startDate')
                        start_time = period.get('startTime', '00:00')
                        end_time = period.get('endTime', '00:00')
                        
                        # Parse start date
                        if start_date_str:
                            try:
                                start_date = parser.parse(start_date_str).date()
                            except:
                                continue
                        else:
                            continue
                        
                        # Insert delivery period
                        cur.execute("""
                            INSERT INTO public.nged_delivery_periods 
                            (window_id, "minRequiredCapacityMw", "startDate", 
                             "startTime", "endTime")
                            VALUES (%s, %s, %s, %s, %s)
                        """, (window_id, min_capacity, start_date, start_time, end_time))
                
                stored_count += 1
                
            except Exception as e:
                print(f"⚠ Error storing opportunity {opp.get('opportunityId')}: {e}")
                continue
        
        conn.commit()
    
    return stored_count


def run_day_ahead():
    """Fetch Day-Ahead opportunities for THIS MONDAY to NEXT MONDAY (7-day window)"""
    print("📅 Fetching Day-Ahead opportunities (this week)...\n")
    
    # Calculate this Monday to next Monday
    today = datetime.now(timezone.utc)
    days_since_monday = today.weekday()
    this_monday = today - timedelta(days=days_since_monday)
    this_monday = this_monday.replace(hour=0, minute=0, second=0, microsecond=0)
    next_monday = this_monday + timedelta(days=7)
    
    print(f"Date range: {this_monday.date()} to {next_monday.date()}")
    
    # Fetch from NGED API
    connector = NGEDAPI()
    day_ahead = connector.get_trade_opportunities(
        horizon=Horizon.DAY_AHEAD,
        time_window=TimeWindow.UPCOMING,
        page_count=100,
        order_column=OrderColumn.TRADE_CLOSING_DATE,
        order_direction=OrderDirection.ASC
    )
    
    # Filter to this week
    filtered_opportunities = []
    for opp in day_ahead:
        try:
            closing_date_str = opp.get("tradeClosingDate")
            if not closing_date_str:
                continue
            
            closing_date = parser.parse(closing_date_str)
            if closing_date.tzinfo is None:
                closing_date = closing_date.replace(tzinfo=timezone.utc)
            else:
                closing_date = closing_date.astimezone(timezone.utc)
            
            if this_monday <= closing_date <= next_monday:
                filtered_opportunities.append(opp)
        except:
            continue
    
    print(f"✓ Fetched {len(filtered_opportunities)} Day-Ahead opportunities\n")
    
    # Store in Neon
    conn = get_neon_connection()
    try:
        clear_existing_data(conn)
        stored = store_opportunities(conn, filtered_opportunities)
        print(f"\n✅ Stored {stored} opportunities in Neon database")
    finally:
        conn.close()
    
    return stored


def run_backfill():
    """Backfill ALL short-term opportunities (Day-Ahead + Weekly)"""
    print("📦 Fetching ALL short-term opportunities (backfill)...\n")
    
    # Fetch from NGED API
    connector = NGEDAPI()
    
    print("Fetching Day-Ahead opportunities...")
    day_ahead = connector.get_trade_opportunities(
        horizon=Horizon.DAY_AHEAD,
        time_window=TimeWindow.UPCOMING,
        page_count=100,
        order_column=OrderColumn.TRADE_CLOSING_DATE,
        order_direction=OrderDirection.ASC
    )
    print(f"✓ Fetched {len(day_ahead)} Day-Ahead opportunities")
    
    print("Fetching Weekly opportunities...")
    weekly = connector.get_trade_opportunities(
        horizon=Horizon.WEEKLY,
        time_window=TimeWindow.UPCOMING,
        page_count=100,
        order_column=OrderColumn.TRADE_CLOSING_DATE,
        order_direction=OrderDirection.ASC
    )
    print(f"✓ Fetched {len(weekly)} Weekly opportunities")
    
    all_shortterm = day_ahead + weekly
    print(f"\n✓ Total: {len(all_shortterm)} opportunities\n")
    
    # Store in Neon
    conn = get_neon_connection()
    try:
        clear_existing_data(conn)
        stored = store_opportunities(conn, all_shortterm)
        print(f"\n✅ Stored {stored} opportunities in Neon database")
    finally:
        conn.close()
    
    return stored


def verify_data(conn):
    """Verify data was stored correctly"""
    print("\n🔍 Verifying stored data...")
    
    with conn.cursor() as cur:
        # Count opportunities by CMZ code
        cur.execute("""
            SELECT 
                "cmzCode",
                COUNT(DISTINCT tov.id) as opportunities,
                COUNT(DISTINCT w.id) as windows,
                COUNT(dp.id) as periods
            FROM public.trade_opportunity_versions tov
            LEFT JOIN public.nged_windows w ON w.opportunity_version_id = tov.id
            LEFT JOIN public.nged_delivery_periods dp ON dp.window_id = w.id
            WHERE tov.valid_to IS NULL
            GROUP BY "cmzCode"
            ORDER BY opportunities DESC
            LIMIT 10
        """)
        
        results = cur.fetchall()
        
        if results:
            print("\nTop CMZ codes by opportunity count:")
            for row in results:
                print(f"  {row[0]}: {row[1]} opportunities, {row[2]} windows, {row[3]} periods")
        else:
            print("  No data found")


def main():
    """
    Main function
    
    Commands:
    - daily: Fetch Day-Ahead opportunities THIS MONDAY to NEXT MONDAY
    - backfill: Fetch ALL short-term opportunities (Day-Ahead + Weekly)
    """
    print("=" * 60)
    print("NGED Live Data Fetcher → Neon PostgreSQL")
    print("=" * 60 + "\n")
    
    command = sys.argv[1] if len(sys.argv) > 1 else "backfill"
    
    try:
        if command == "daily":
            run_day_ahead()
        elif command == "backfill":
            run_backfill()
        else:
            print(f"❌ Unknown command: {command}")
            print("\nUsage:")
            print("  python scripts/fetch-live-data.py daily      # This week only")
            print("  python scripts/fetch-live-data.py backfill   # All opportunities")
            return
        
        # Verify the data
        conn = get_neon_connection()
        try:
            verify_data(conn)
        finally:
            conn.close()
        
        print("\n" + "=" * 60)
        print("✅ SUCCESS - Live data loaded into Neon database")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
