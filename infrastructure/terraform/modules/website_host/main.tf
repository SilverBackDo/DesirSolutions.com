data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

data "oci_core_images" "oracle_linux" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  operating_system_version = "9"
  shape                    = var.shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

locals {
  availability_domain = coalesce(
    var.availability_domain_name,
    data.oci_identity_availability_domains.ads.availability_domains[0].name,
  )

  image_id = coalesce(
    var.custom_image_id,
    data.oci_core_images.oracle_linux.images[0].id,
  )
}

resource "oci_core_vcn" "this" {
  compartment_id = var.compartment_id
  cidr_blocks    = [var.vcn_cidr]
  display_name   = "${var.project_name}-vcn"
  dns_label      = substr(replace(lower(var.project_name), "-", ""), 0, 15)
}

resource "oci_core_internet_gateway" "this" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.project_name}-igw"
  enabled        = true
}

resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.this.id
  display_name   = "${var.project_name}-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.this.id
  }
}

resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_id
  display_name   = "${var.project_name}-public-sl"
  vcn_id         = oci_core_vcn.this.id

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

resource "oci_core_subnet" "public" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.this.id
  display_name               = "${var.project_name}-public-subnet"
  cidr_block                 = var.public_subnet_cidr
  route_table_id             = oci_core_route_table.public.id
  security_list_ids          = [oci_core_security_list.public.id]
  prohibit_public_ip_on_vnic = false
}

resource "oci_core_network_security_group" "website" {
  compartment_id = var.compartment_id
  display_name   = "${var.project_name}-website-nsg"
  vcn_id         = oci_core_vcn.this.id
}

resource "oci_core_network_security_group_security_rule" "http_ingress" {
  network_security_group_id = oci_core_network_security_group.website.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = "0.0.0.0/0"
  source_type               = "CIDR_BLOCK"
  description               = "Allow public HTTP traffic"

  tcp_options {
    destination_port_range {
      min = 80
      max = 80
    }
  }
}

resource "oci_core_network_security_group_security_rule" "ssh_ingress" {
  for_each                  = toset(var.ssh_allowed_cidrs)
  network_security_group_id = oci_core_network_security_group.website.id
  direction                 = "INGRESS"
  protocol                  = "6"
  source                    = each.value
  source_type               = "CIDR_BLOCK"
  description               = "Allow SSH from approved admin CIDR"

  tcp_options {
    destination_port_range {
      min = 22
      max = 22
    }
  }
}

resource "oci_core_network_security_group_security_rule" "egress_all" {
  network_security_group_id = oci_core_network_security_group.website.id
  direction                 = "EGRESS"
  protocol                  = "all"
  destination               = "0.0.0.0/0"
  destination_type          = "CIDR_BLOCK"
  description               = "Allow outbound access for package install and git clone"
}

resource "oci_core_instance" "website" {
  availability_domain = local.availability_domain
  compartment_id      = var.compartment_id
  display_name        = "${var.project_name}-website"
  shape               = var.shape

  shape_config {
    ocpus         = var.instance_ocpus
    memory_in_gbs = var.instance_memory_gb
  }

  create_vnic_details {
    assign_public_ip = true
    subnet_id        = oci_core_subnet.public.id
    nsg_ids          = [oci_core_network_security_group.website.id]
    display_name     = "${var.project_name}-website-vnic"
  }

  metadata = {
    ssh_authorized_keys = join("\n", var.ssh_authorized_keys)
    user_data = base64encode(templatefile("${path.module}/cloud-init.tftpl", {
      repo_url               = var.repo_url
      repo_ref               = var.repo_ref
      website_directory      = var.website_directory
      website_container_name = var.website_container_name
    }))
  }

  source_details {
    source_type             = "image"
    source_id               = local.image_id
    boot_volume_size_in_gbs = var.boot_volume_size_gb
  }
}

data "oci_core_vnic_attachments" "website" {
  compartment_id = var.compartment_id
  instance_id    = oci_core_instance.website.id
}

data "oci_core_vnic" "website" {
  vnic_id = data.oci_core_vnic_attachments.website.vnic_attachments[0].vnic_id
}
