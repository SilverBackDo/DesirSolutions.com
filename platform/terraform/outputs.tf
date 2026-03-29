output "instance_ocid" {
  value       = local.instance_id
  description = "OCI instance OCID for the platform host."
}

output "public_ip" {
  value       = try(data.oci_core_vnic.primary.public_ip_address, null)
  description = "Public IP address assigned to the compute instance."
}

output "ssh_command" {
  value       = try(data.oci_core_vnic.primary.public_ip_address, null) != null ? "ssh opc@${data.oci_core_vnic.primary.public_ip_address}" : null
  description = "Convenience SSH command for the platform host."
}

output "website_url" {
  value       = "https://${var.desirsolutions_domain}"
  description = "Public URL served by the platform."
}

output "healthcheck_url" {
  value       = "https://${var.desirsolutions_domain}/healthz"
  description = "Health endpoint for the public website after DNS and TLS cutover."
}

output "network_ids" {
  value = {
    vcn              = local.vcn_id
    subnet           = local.subnet_id
    internet_gateway = local.internet_gateway_id
    route_table      = local.route_table_id
    security_list    = local.security_list_id
  }
  description = "Resolved OCI network resource IDs in use by the deployment."
}
