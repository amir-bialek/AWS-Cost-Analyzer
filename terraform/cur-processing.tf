# Shared IAM Role for CUR Processing Lambdas
resource "aws_iam_role" "role_for_cur_processing" {
  name = "role-for-cur-processing"
  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "lambda.amazonaws.com"
        },
        "Action" : [
          "sts:AssumeRole"
        ]
      }
    ]
  })
}

# Shared IAM Policy for CUR Processing Lambdas
resource "aws_iam_role_policy" "policy_for_cur_processing" {
  name = "policy-for-cur-processing"
  role = aws_iam_role.role_for_cur_processing.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.cur_source_bucket}",
          "arn:aws:s3:::${var.cur_source_bucket}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_lambda_basic_execution_for_cur_processing" {
  role       = aws_iam_role.role_for_cur_processing.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function Module for Monthly CUR Processor
module "lambda_function_cur_monthly_processor" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "7.21.0"

  function_name = "cur-monthly-processor"
  description   = "Process monthly CUR report and copy to eks-ui path"
  handler       = "lambda_function.lambda_handler"
  publish       = true
  runtime       = "python3.12"
  lambda_role   = aws_iam_role.role_for_cur_processing.arn
  create_role   = false
  create_package         = true
  source_path = "functions/cur-monthly-processor"
  cloudwatch_logs_retention_in_days = 7
  timeout       = 60

  environment_variables = {
    SOURCE_BUCKET              = var.cur_source_bucket
    DESTINATION_BUCKET         = var.cur_destination_bucket
    SOURCE_PATH_PREFIX         = var.cur_source_path_prefix
    SOURCE_PATH_PATTERN        = "BILLING_PERIOD=YYYY-MM"
    SOURCE_FILENAME            = var.cur_source_filename
    DESTINATION_PATH_PREFIX    = var.cur_destination_path_prefix
    SLACK_WEBHOOK_URL          = var.slack_webhook_url
  }
}

# EventBridge Scheduler for Monthly CUR Processor
resource "aws_scheduler_schedule" "cur_monthly_processor_schedule" {
  name                = "cur-monthly-processor-schedule"
  schedule_expression = "cron(0 0 3 * ? *)"
  schedule_expression_timezone = "Asia/Jerusalem"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = module.lambda_function_cur_monthly_processor.lambda_function_arn
    role_arn = aws_iam_role.scheduler_role_cur_monthly_processor.arn
  }
}

# IAM Role for EventBridge Scheduler
resource "aws_iam_role" "scheduler_role_cur_monthly_processor" {
  name = "scheduler-role-for-cur-monthly-processor"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for EventBridge Scheduler
resource "aws_iam_role_policy" "scheduler_policy_cur_monthly_processor" {
  name = "scheduler-policy-for-cur-monthly-processor"
  role = aws_iam_role.scheduler_role_cur_monthly_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction",
          "scheduler:Invoke"
        ]
        Resource = module.lambda_function_cur_monthly_processor.lambda_function_arn
      }
    ]
  })
}

# Lambda Permission for EventBridge Scheduler
resource "aws_lambda_permission" "allow_scheduler_to_call_cur_monthly_processor" {
  statement_id  = "AllowExecutionFromScheduler"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_function_cur_monthly_processor.lambda_function_name
  principal     = "scheduler.amazonaws.com"
  source_arn    = aws_scheduler_schedule.cur_monthly_processor_schedule.arn
}

# Lambda Function Module for Historical CUR Sync
module "lambda_function_cur_historical_sync" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "7.21.0"

  function_name = "cur-historical-sync"
  description   = "Sync historical CUR files from source to destination"
  handler       = "lambda_function.lambda_handler"
  publish       = true
  runtime       = "python3.12"
  lambda_role   = aws_iam_role.role_for_cur_processing.arn
  create_role   = false
  create_package         = true
  source_path = "functions/cur-historical-sync"
  cloudwatch_logs_retention_in_days = 7
  timeout       = 300

  environment_variables = {
    SOURCE_BUCKET              = var.cur_source_bucket
    DESTINATION_BUCKET         = var.cur_destination_bucket
    SOURCE_PATH_PREFIX         = var.cur_source_path_prefix
    SOURCE_PATH_PATTERN        = "BILLING_PERIOD=YYYY-MM"
    SOURCE_FILENAME            = var.cur_source_filename
    DESTINATION_PATH_PREFIX    = var.cur_destination_path_prefix
  }
}

