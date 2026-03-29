output "instance_id" {
  description = "OCI instance OCID."
  value       = oci_core_instance.website.id
}

output "public_ip" {
  description = "Public IP address for the website instance."
  value       = data.oci_core_vnic.website.public_ip_address
}

output "public_url" {
  description = "HTTP URL for the deployed website."
  value       = "http://${data.oci_core_vnic.website.public_ip_address}"
}

output "healthcheck_url" {
  description = "HTTP health endpoint for bootstrap validation."
  value       = "http://${data.oci_core_vnic.website.public_ip_address}/healthz"
}

output "ssh_command" {
  description = "SSH command for approved operators."
  value       = "ssh opc@${data.oci_core_vnic.website.public_ip_address}"
}

output "network_security_group_id" {
  description = "OCI NSG protecting the website host."
  value       = oci_core_network_security_group.website.id
}

output "public_subnet_id" {
  description = "Public subnet ID used by the website instance."
  value       = oci_core_subnet.public.id
}
