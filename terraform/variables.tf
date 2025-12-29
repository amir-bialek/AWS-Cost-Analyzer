variable "cur_source_bucket" {
    type = string
    description = "S3 bucket where AWS CUR reports are generated"
    default = "devops-cost-data"
}

variable "cur_destination_bucket" {
    type = string
    description = "S3 bucket where processed CUR files are stored for the cost analyzer application"
    default = "devops-cost-data"
}

variable "cur_source_path_prefix" {
    type = string
    description = "S3 path prefix where AWS generates CUR reports"
    default = "parquet-monthly/devops-data-export/data"
}

variable "cur_source_filename" {
    type = string
    description = "Filename pattern for AWS CUR report files"
    default = "devops-data-export-00001.snappy.parquet"
}

variable "cur_destination_path_prefix" {
    type = string
    description = "S3 path prefix where the cost analyzer application reads CUR files"
    default = "eks-ui"
}

variable "slack_webhook_url" {
    type = string
    description = "Slack webhook URL for CUR processing notifications"
    default = ""
}

