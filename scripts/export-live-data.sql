-- Export NGED data from live database
-- Run this on your live database (10.2.0.13:15432) to export data
-- Then import into Neon

-- Export trade_opportunity_versions
\copy (SELECT id, "opportunityId", "opportunityName", "cmzCode", "serviceResponseDirection", "utilisationCeilingPrice", valid_to, created_at FROM public.trade_opportunity_versions ORDER BY id) TO '/tmp/trade_opportunity_versions.csv' WITH CSV HEADER;

-- Export nged_windows
\copy (SELECT id, opportunity_version_id, created_at FROM public.nged_windows ORDER BY id) TO '/tmp/nged_windows.csv' WITH CSV HEADER;

-- Export nged_delivery_periods
\copy (SELECT id, window_id, "minRequiredCapacityMw", "startDate", "startTime", "endTime", created_at FROM public.nged_delivery_periods ORDER BY id) TO '/tmp/nged_delivery_periods.csv' WITH CSV HEADER;

-- To import into Neon, run these commands on Neon database:
-- TRUNCATE public.trade_opportunity_versions CASCADE;
-- \copy public.trade_opportunity_versions FROM '/tmp/trade_opportunity_versions.csv' WITH CSV HEADER;
-- \copy public.nged_windows FROM '/tmp/nged_windows.csv' WITH CSV HEADER;
-- \copy public.nged_delivery_periods FROM '/tmp/nged_delivery_periods.csv' WITH CSV HEADER;
