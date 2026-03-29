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

output "ssh_command" {
  description = "SSH command for approved operators."
  value       = "ssh opc@${data.oci_core_vnic.website.public_ip_address}"
}
