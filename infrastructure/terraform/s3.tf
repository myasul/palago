resource "aws_s3_bucket" "palago_assets" {
  bucket = "palago-assets"
}

resource "aws_s3_bucket_public_access_block" "palago_assets" {
  bucket                  = aws_s3_bucket.palago_assets.id
  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "palago_assets_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::palago-assets/logos/*"]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "palago_assets" {
  bucket     = aws_s3_bucket.palago_assets.id
  policy     = data.aws_iam_policy_document.palago_assets_policy.json
  depends_on = [aws_s3_bucket_public_access_block.palago_assets]
}
