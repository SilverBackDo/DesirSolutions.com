variable "tenancy_ocid" {
  type        = string
  description = "OCI tenancy OCID."
}

variable "compartment_ocid" {
  type        = string
  description = "OCI compartment OCID where the platform resources live."
}

variable "user_ocid" {
  type        = string
  description = "OCI user OCID for API key authentication."
}

variable "fingerprint" {
  type        = string
  description = "Fingerprint for the OCI API signing key."
}

variable "private_key_path" {
  type        = string
  description = "Path to the OCI API private key used by Terraform."
}

variable "region" {
  type        = string
  description = "OCI region, for example us-phoenix-1."
}

variable "availability_domain_name" {
  type        = string
  description = "Optional AD override for the compute instance."
  default     = null
}

variable "ssh_public_key" {
  type        = string
  description = "SSH public key injected into the instance metadata."
}

variable "platform_repo_url" {
  type        = string
  description = "GitHub repository URL for this platform repo."
  default     = "https://github.com/SilverBackDo/DesirSolutions.com.git"
}

variable "platform_repo_ref" {
  type        = string
  description = "Git ref checked out on first boot."
  default     = "main"
}

variable "letsencrypt_email" {
  type        = string
  description = "Email used by Traefik ACME registration."
}

variable "traefik_dashboard_host" {
  type        = string
  description = "Hostname used for the Traefik dashboard."
  default     = "traefik.alcines.com"
}

variable "traefik_dashboard_users" {
  type        = string
  description = "Traefik basic-auth users string in htpasswd format."
}

variable "timezone" {
  type        = string
  description = "Host timezone written into the platform env file."
  default     = "America/Los_Angeles"
}

variable "bellahburger_domain" {
  type        = string
  description = "Primary hostname for the first website."
  default     = "bellahburger.com"
}

variable "bellahburger_repo_url" {
  type        = string
  description = "GitHub repository for the first website."
}

variable "bellahburger_repo_branch" {
  type        = string
  description = "Git branch for the first website repo."
  default     = "main"
}

variable "bellahburger_public_subdir" {
  type        = string
  description = "Optional publish subdirectory for the first website repo."
  default     = ""
}

variable "desirsolutions_domain" {
  type        = string
  description = "Primary hostname for the Desir Solutions site."
  default     = "desirsolutions.com"
}

variable "desirsolutions_repo_url" {
  type        = string
  description = "GitHub repository for the Desir Solutions site."
  default     = "https://github.com/SilverBackDo/DesirSolutions.com.git"
}

variable "desirsolutions_repo_branch" {
  type        = string
  description = "Git branch for the Desir Solutions repo."
  default     = "main"
}

variable "desirsolutions_public_subdir" {
  type        = string
  description = "Optional publish subdirectory for the Desir Solutions repo."
  default     = ""
}

variable "alcines_domain" {
  type        = string
  description = "Primary hostname for the consultant profile site."
  default     = "alcines.com"
}

variable "vcn_display_name" {
  type        = string
  description = "Display name used to discover or create the VCN."
  default     = "consulting-mini-cloud-vcn"
}

variable "subnet_display_name" {
  type        = string
  description = "Display name used to discover or create the public subnet."
  default     = "consulting-mini-cloud-public-subnet"
}

variable "internet_gateway_display_name" {
  type        = string
  description = "Display name used to discover or create the internet gateway."
  default     = "consulting-mini-cloud-igw"
}

variable "route_table_display_name" {
  type        = string
  description = "Display name used to discover or create the route table."
  default     = "consulting-mini-cloud-rt"
}

variable "security_list_display_name" {
  type        = string
  description = "Display name used to discover or create the security list."
  default     = "consulting-mini-cloud-sl"
}

variable "instance_display_name" {
  type        = string
  description = "Display name used to discover or create the compute instance."
  default     = "consulting-mini-cloud"
}

variable "instance_hostname_label" {
  type        = string
  description = "Hostname label for the instance primary VNIC."
  default     = "consultvm"
}

variable "vcn_cidr" {
  type        = string
  description = "CIDR block for the VCN."
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  type        = string
  description = "CIDR block for the public subnet."
  default     = "10.0.1.0/24"
}

variable "vcn_dns_label" {
  type        = string
  description = "DNS label for the VCN."
  default     = "consultnet"
}

variable "subnet_dns_label" {
  type        = string
  description = "DNS label for the public subnet."
  default     = "publicsn"
}

variable "instance_shape" {
  type        = string
  description = "Compute shape for the OCI instance."
  default     = "VM.Standard.A1.Flex"
}

variable "ocpus" {
  type        = number
  description = "OCPU count for the instance."
  default     = 2
}

variable "memory_in_gbs" {
  type        = number
  description = "Memory size for the instance."
  default     = 12
}

variable "boot_volume_size_in_gbs" {
  type        = number
  description = "Boot volume size in GBs."
  default     = 50
}

variable "assign_public_ip" {
  type        = bool
  description = "Whether to assign a public IP to the primary VNIC."
  default     = true
}

variable "image_ocid" {
  type        = string
  description = "Optional explicit Oracle Linux image OCID override."
  default     = null
}

variable "image_operating_system" {
  type        = string
  description = "Operating system used when discovering the latest platform image."
  default     = "Oracle Linux"
}

variable "image_operating_system_version" {
  type        = string
  description = "Operating system version used when discovering the latest platform image."
  default     = "9"
}

variable "existing_vcn_id" {
  type        = string
  description = "Optional explicit VCN OCID to reuse."
  default     = null
}

variable "existing_subnet_id" {
  type        = string
  description = "Optional explicit subnet OCID to reuse."
  default     = null
}

variable "existing_internet_gateway_id" {
  type        = string
  description = "Optional explicit internet gateway OCID to reuse."
  default     = null
}

variable "existing_route_table_id" {
  type        = string
  description = "Optional explicit route table OCID to reuse."
  default     = null
}

variable "existing_security_list_id" {
  type        = string
  description = "Optional explicit security list OCID to reuse."
  default     = null
}

variable "existing_instance_id" {
  type        = string
  description = "Optional explicit compute instance OCID to reuse."
  default     = null
}

variable "freeform_tags" {
  type        = map(string)
  description = "Additional freeform tags applied to created OCI resources."
  default     = {}
}
