output "public_ip" {
  value = module.website_host.public_ip
}

output "public_url" {
  value = module.website_host.public_url
}

output "ssh_command" {
  value = module.website_host.ssh_command
}
