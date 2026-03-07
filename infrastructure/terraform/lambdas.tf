locals {
  lambda_functions = {
    "palago-intraday-snapshot" = {
      handler     = "jobs/intraday-snapshot.handler"
      memory_size = 256
      timeout     = 120
      environment = {}
    }
    "palago-eod-prices" = {
      handler     = "jobs/eod-prices.handler"
      memory_size = 256
      timeout     = 300
      environment = {}
    }
    "palago-sync-indices" = {
      handler     = "jobs/sync-indices.handler"
      memory_size = 256
      timeout     = 120
      environment = {}
    }
    "palago-sync-dividends" = {
      handler     = "jobs/sync-dividends.handler"
      memory_size = 256
      timeout     = 300
      environment = {
        EODHD_API_KEY = data.aws_ssm_parameter.eodhd_api_key.value
      }
    }
    "palago-sync-stock-list" = {
      handler     = "jobs/sync-stock-list.handler"
      memory_size = 256
      timeout     = 120
      environment = {
        EODHD_API_KEY = data.aws_ssm_parameter.eodhd_api_key.value
      }
    }
    "palago-backfill-all" = {
      handler     = "jobs/backfill-all.handler"
      memory_size = 512
      timeout     = 900
      environment = {}
    }
  }
}

data "archive_file" "ingestion_zip" {
  output_path = "${path.module}/ingestion.zip"
  source_dir  = "${path.module}/../../apps/ingestion/dist"
  type        = "zip"
}

data "aws_ssm_parameter" "database_url" {
  name = "/palago/${var.environment}/DATABASE_URL"
}

data "aws_ssm_parameter" "eodhd_api_key" {
  name = "/palago/${var.environment}/EODHD_API_KEY"
}

resource "aws_lambda_function" "ingestion" {
  for_each = local.lambda_functions

  filename         = data.archive_file.ingestion_zip.output_path
  function_name    = each.key
  handler          = each.value.handler
  memory_size      = each.value.memory_size
  role             = aws_iam_role.lambda_exec_role.arn
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.ingestion_zip.output_base64sha256
  timeout          = each.value.timeout

  environment {
    variables = merge(
      {
        DATABASE_URL = data.aws_ssm_parameter.database_url.value
      },
      each.value.environment,
    )
  }
}
