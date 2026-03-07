output "intraday_snapshot_lambda_arn" {
  value = aws_lambda_function.ingestion["palago-intraday-snapshot"].arn
}

output "eod_prices_lambda_arn" {
  value = aws_lambda_function.ingestion["palago-eod-prices"].arn
}

output "sync_indices_lambda_arn" {
  value = aws_lambda_function.ingestion["palago-sync-indices"].arn
}

output "sync_dividends_lambda_arn" {
  value = aws_lambda_function.ingestion["palago-sync-dividends"].arn
}

output "sync_stock_list_lambda_arn" {
  value = aws_lambda_function.ingestion["palago-sync-stock-list"].arn
}

output "backfill_all_lambda_arn" {
  value = aws_lambda_function.ingestion["palago-backfill-all"].arn
}
