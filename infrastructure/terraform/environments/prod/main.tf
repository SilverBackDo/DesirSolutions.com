module "website_host" {
  source = "../../modules/website_host"

  compartment_id           = var.compartment_id
  availability_domain_name = var.availability_domain_name
  project_name             = var.project_name
  vcn_cidr                 = var.vcn_cidr
  public_subnet_cidr       = var.public_subnet_cidr
  shape                    = var.shape
  instance_ocpus           = var.instance_ocpus
  instance_memory_gb       = var.instance_memory_gb
  boot_volume_size_gb      = var.boot_volume_size_gb
  ssh_authorized_keys      = var.ssh_authorized_keys
  ssh_allowed_cidrs        = var.ssh_allowed_cidrs
  repo_url                 = var.repo_url
  repo_ref                 = var.repo_ref
  website_directory        = var.website_directory
  website_container_name   = var.website_container_name
  website_host_port        = var.website_host_port
  custom_image_id          = var.custom_image_id
}
