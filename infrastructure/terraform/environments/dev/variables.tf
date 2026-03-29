variable "tenancy_ocid" { type = string }
variable "user_ocid" { type = string }
variable "fingerprint" { type = string }
variable "private_key_path" { type = string }
variable "region" { type = string }

variable "compartment_id" { type = string }
variable "availability_domain_name" {
  type    = string
  default = null
}

variable "project_name" { type = string }
variable "vcn_cidr" { type = string }
variable "public_subnet_cidr" { type = string }
variable "shape" { type = string }
variable "instance_ocpus" { type = number }
variable "instance_memory_gb" { type = number }
variable "boot_volume_size_gb" { type = number }
variable "ssh_authorized_keys" { type = list(string) }
variable "ssh_allowed_cidrs" { type = list(string) }
variable "repo_url" { type = string }
variable "repo_ref" { type = string }
variable "website_directory" { type = string }
variable "website_container_name" { type = string }
variable "website_host_port" { type = number }
variable "custom_image_id" {
  type    = string
  default = null
}
