data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      identifiers = ["lambda.amazonaws.com"]
      type        = "Service"
    }
  }
}

resource "aws_iam_role" "lambda_exec_role" {
  name               = "palago-lambda-exec-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_exec_role.name
}

data "aws_iam_policy_document" "lambda_ssm_access" {
  statement {
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
    ]

    resources = [
      "arn:aws:ssm:ap-southeast-1:*:parameter/palago/*",
    ]
  }
}

resource "aws_iam_role_policy" "lambda_ssm_access" {
  name   = "palago-lambda-ssm-access"
  role   = aws_iam_role.lambda_exec_role.id
  policy = data.aws_iam_policy_document.lambda_ssm_access.json
}

data "aws_iam_policy_document" "lambda_s3_assets_put_object" {
  statement {
    actions = ["s3:PutObject"]

    resources = [
      "arn:aws:s3:::palago-assets/logos/*",
    ]
  }
}

resource "aws_iam_role_policy" "lambda_s3_assets_put_object" {
  name   = "palago-lambda-s3-assets-put-object"
  role   = aws_iam_role.lambda_exec_role.id
  policy = data.aws_iam_policy_document.lambda_s3_assets_put_object.json
}
