output "public_ip" {
  value = module.website_host.public_ip
}

output "public_url" {
  value = module.website_host.public_url
}

output "healthcheck_url" {
  value = module.website_host.healthcheck_url
}

output "ssh_command" {
  value = module.website_host.ssh_command
}

output "network_security_group_id" {
  value = module.website_host.network_security_group_id
}

output "public_subnet_id" {
  value = module.website_host.public_subnet_id
}
