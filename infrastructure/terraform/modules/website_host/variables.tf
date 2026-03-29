variable "compartment_id" {
  description = "OCI compartment OCID for the website infrastructure."
  type        = string
}

variable "availability_domain_name" {
  description = "Optional availability domain name. If null, the first AD is used."
  type        = string
  default     = null
}

variable "project_name" {
  description = "Short project name used for OCI resource naming."
  type        = string
}

variable "vcn_cidr" {
  description = "CIDR block for the VCN."
  type        = string
  default     = "10.40.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet."
  type        = string
  default     = "10.40.10.0/24"
}

variable "shape" {
  description = "OCI compute shape."
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "instance_ocpus" {
  description = "Number of OCPUs for the website instance."
  type        = number
  default     = 2
}

variable "instance_memory_gb" {
  description = "Amount of memory in GB for the website instance."
  type        = number
  default     = 12
}

variable "boot_volume_size_gb" {
  description = "Boot volume size in GB."
  type        = number
  default     = 80
}

variable "ssh_authorized_keys" {
  description = "Public SSH keys allowed on the instance."
  type        = list(string)

  validation {
    condition     = length(var.ssh_authorized_keys) > 0
    error_message = "Provide at least one SSH public key."
  }
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to reach SSH."
  type        = list(string)

  validation {
    condition     = length(var.ssh_allowed_cidrs) > 0
    error_message = "Provide at least one admin CIDR for SSH access."
  }

  validation {
    condition     = !contains(var.ssh_allowed_cidrs, "0.0.0.0/0")
    error_message = "Do not allow SSH from 0.0.0.0/0. Use a specific admin or VPN CIDR."
  }
}

variable "repo_url" {
  description = "Git repository URL that contains the website/ folder."
  type        = string
}

variable "repo_ref" {
  description = "Git branch, tag, or commit to deploy."
  type        = string
  default     = "main"
}

variable "website_directory" {
  description = "Relative path to the website package inside the repository."
  type        = string
  default     = "website"
}

variable "website_container_name" {
  description = "Container name used for the website."
  type        = string
  default     = "desirsolutions-website"
}

variable "website_image" {
  description = "OCI host runtime image for the website container."
  type        = string
  default     = "ghcr.io/silverbackdo/desirsolutions-website:latest"
}

variable "website_host_port" {
  description = "Host port exposed by Docker Compose for the website container."
  type        = number
  default     = 80
}

variable "custom_image_id" {
  description = "Optional custom image OCID. If null, the latest Oracle Linux 9 image is used."
  type        = string
  default     = null
}
