output "instance_public_ip" {
  description = "Public IP of the compute instance"
  value       = oci_core_instance.server.public_ip
}

output "instance_id" {
  description = "OCID of the compute instance"
  value       = oci_core_instance.server.id
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/oci_arm ubuntu@${oci_core_instance.server.public_ip}"
}

output "ubuntu_image" {
  description = "Ubuntu image used"
  value       = data.oci_core_images.ubuntu_arm.images[0].display_name
}
