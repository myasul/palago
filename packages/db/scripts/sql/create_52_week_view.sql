DROP MATERIALIZED VIEW IF EXISTS stock_52_week;

CREATE MATERIALIZED VIEW stock_52_week AS
SELECT
  stock_id,
  MAX(high_price) AS high_52w,
  MIN(low_price) AS low_52w,
  MAX(trade_date) AS as_of_date
FROM daily_prices
WHERE trade_date >= CURRENT_DATE - INTERVAL '52 weeks'
GROUP BY stock_id;

CREATE UNIQUE INDEX stock_52_week_stock_id_idx
  ON stock_52_week (stock_id);

-- Refresh with:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY stock_52_week;
