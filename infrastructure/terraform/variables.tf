variable "aws_region" {
  description = "AWS region for Palago infrastructure."
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "prod"
}
