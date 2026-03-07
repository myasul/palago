locals {
  scheduled_jobs = {
    "palago-intraday" = {
      lambda_name = "palago-intraday-snapshot"
      schedule    = "cron(*/15 1-7 ? * MON-FRI *)"
    }
    "palago-eod-prices" = {
      lambda_name = "palago-eod-prices"
      schedule    = "cron(0 8 ? * MON-FRI *)"
    }
    "palago-sync-indices" = {
      lambda_name = "palago-sync-indices"
      schedule    = "cron(15 8 ? * MON-FRI *)"
    }
    "palago-sync-dividends" = {
      lambda_name = "palago-sync-dividends"
      schedule    = "cron(0 0 ? * SUN *)"
    }
    "palago-sync-stock-list" = {
      lambda_name = "palago-sync-stock-list"
      schedule    = "cron(0 1 ? * SUN *)"
    }
  }
}

resource "aws_cloudwatch_event_rule" "scheduled" {
  for_each = local.scheduled_jobs

  name                = each.key
  schedule_expression = each.value.schedule
}

resource "aws_cloudwatch_event_target" "lambda" {
  for_each = local.scheduled_jobs

  target_id = "${each.key}-target"
  arn  = aws_lambda_function.ingestion[each.value.lambda_name].arn
  rule = aws_cloudwatch_event_rule.scheduled[each.key].name
}

resource "aws_lambda_permission" "allow_eventbridge" {
  for_each = local.scheduled_jobs

  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingestion[each.value.lambda_name].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.scheduled[each.key].arn
  statement_id  = "${replace(each.key, "-", "_")}_eventbridge"
}
