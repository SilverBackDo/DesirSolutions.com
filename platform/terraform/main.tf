provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

data "oci_core_images" "oracle_linux_9" {
  compartment_id           = var.compartment_ocid
  operating_system         = var.image_operating_system
  operating_system_version = var.image_operating_system_version
  shape                    = var.instance_shape
}

locals {
  managed_tags = merge(
    {
      managed-by = "terraform"
      project    = "consulting-mini-cloud"
    },
    var.freeform_tags,
  )

  availability_domain_name = var.availability_domain_name != null ? var.availability_domain_name : data.oci_identity_availability_domains.ads.availability_domains[0].name
  image_id                 = var.image_ocid != null ? var.image_ocid : data.oci_core_images.oracle_linux_9.images[0].id
  is_flex_shape            = endswith(var.instance_shape, ".Flex")
}

resource "oci_core_vcn" "platform" {
  count          = var.existing_vcn_id == null ? 1 : 0
  compartment_id = var.compartment_ocid
  display_name   = var.vcn_display_name
  cidr_blocks    = [var.vcn_cidr]
  dns_label      = var.vcn_dns_label
  freeform_tags  = local.managed_tags
}

locals {
  vcn_id = var.existing_vcn_id != null ? var.existing_vcn_id : oci_core_vcn.platform[0].id
}

resource "oci_core_internet_gateway" "platform" {
  count          = var.existing_internet_gateway_id == null ? 1 : 0
  compartment_id = var.compartment_ocid
  display_name   = var.internet_gateway_display_name
  enabled        = true
  vcn_id         = local.vcn_id
  freeform_tags  = local.managed_tags
}

locals {
  internet_gateway_id = var.existing_internet_gateway_id != null ? var.existing_internet_gateway_id : oci_core_internet_gateway.platform[0].id
}

resource "oci_core_route_table" "platform" {
  count          = var.existing_route_table_id == null ? 1 : 0
  compartment_id = var.compartment_ocid
  vcn_id         = local.vcn_id
  display_name   = var.route_table_display_name
  freeform_tags  = local.managed_tags

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = local.internet_gateway_id
  }
}

locals {
  route_table_id = var.existing_route_table_id != null ? var.existing_route_table_id : oci_core_route_table.platform[0].id
}

resource "oci_core_security_list" "platform" {
  count          = var.existing_security_list_id == null ? 1 : 0
  compartment_id = var.compartment_ocid
  vcn_id         = local.vcn_id
  display_name   = var.security_list_display_name
  freeform_tags  = local.managed_tags

  dynamic "ingress_security_rules" {
    for_each = var.ssh_allowed_cidrs

    content {
      protocol    = "6"
      source      = ingress_security_rules.value
      description = "Allow SSH from approved admin CIDR"

      tcp_options {
        min = 22
        max = 22
      }
    }
  }

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "Allow HTTP"

    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol    = "6"
    source      = "0.0.0.0/0"
    description = "Allow HTTPS"

    tcp_options {
      min = 443
      max = 443
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
    description = "Allow all outbound traffic"
  }
}

locals {
  security_list_id = var.existing_security_list_id != null ? var.existing_security_list_id : oci_core_security_list.platform[0].id
}

resource "oci_core_subnet" "platform" {
  count                      = var.existing_subnet_id == null ? 1 : 0
  compartment_id             = var.compartment_ocid
  vcn_id                     = local.vcn_id
  display_name               = var.subnet_display_name
  cidr_block                 = var.subnet_cidr
  dns_label                  = var.subnet_dns_label
  prohibit_public_ip_on_vnic = false
  route_table_id             = local.route_table_id
  security_list_ids          = [local.security_list_id]
  freeform_tags              = local.managed_tags
}

locals {
  subnet_id = var.existing_subnet_id != null ? var.existing_subnet_id : oci_core_subnet.platform[0].id
}

resource "oci_core_instance" "platform" {
  count               = var.existing_instance_id == null ? 1 : 0
  availability_domain = local.availability_domain_name
  compartment_id      = var.compartment_ocid
  display_name        = var.instance_display_name
  shape               = var.instance_shape
  freeform_tags       = local.managed_tags

  dynamic "shape_config" {
    for_each = local.is_flex_shape ? [1] : []

    content {
      ocpus         = var.ocpus
      memory_in_gbs = var.memory_in_gbs
    }
  }

  create_vnic_details {
    assign_public_ip = var.assign_public_ip
    display_name     = "${var.instance_display_name}-primary-vnic"
    hostname_label   = var.instance_hostname_label
    subnet_id        = local.subnet_id
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data = base64encode(templatefile("${path.module}/user_data.sh.tftpl", {
      platform_repo_url            = var.platform_repo_url
      platform_repo_ref            = var.platform_repo_ref
      letsencrypt_email            = var.letsencrypt_email
      traefik_dashboard_host       = var.traefik_dashboard_host
      traefik_dashboard_users      = var.traefik_dashboard_users
      timezone                     = var.timezone
      bellahburger_domain          = var.bellahburger_domain
      bellahburger_repo_url        = var.bellahburger_repo_url
      bellahburger_repo_branch     = var.bellahburger_repo_branch
      bellahburger_public_subdir   = var.bellahburger_public_subdir
      desirsolutions_domain        = var.desirsolutions_domain
      desirsolutions_repo_url      = var.desirsolutions_repo_url
      desirsolutions_repo_branch   = var.desirsolutions_repo_branch
      desirsolutions_public_subdir = var.desirsolutions_public_subdir
      alcines_domain               = var.alcines_domain
    }))
  }

  source_details {
    source_type             = "image"
    source_id               = local.image_id
    boot_volume_size_in_gbs = var.boot_volume_size_in_gbs
  }
}

locals {
  instance_id = var.existing_instance_id != null ? var.existing_instance_id : (length(oci_core_instance.platform) > 0 ? oci_core_instance.platform[0].id : null)
}

data "oci_core_vnic_attachments" "primary" {
  compartment_id = var.compartment_ocid
  instance_id    = local.instance_id
}

data "oci_core_vnic" "primary" {
  vnic_id = data.oci_core_vnic_attachments.primary.vnic_attachments[0].vnic_id
}

