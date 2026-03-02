output "instances" {
  description = "Created instances with public IPs"
  value = {
    for k, v in oci_core_instance.server : k => {
      public_ip = v.public_ip
      ocpus     = v.shape_config[0].ocpus
      memory    = v.shape_config[0].memory_in_gbs
      state     = v.state
    }
  }
}

output "ssh_commands" {
  description = "SSH commands for each instance"
  value = {
    for k, v in oci_core_instance.server : k =>
    "ssh -i ~/.ssh/oci_arm ubuntu@${v.public_ip}"
  }
}

output "ubuntu_image" {
  description = "Ubuntu image used"
  value       = data.oci_core_images.ubuntu_arm.images[0].display_name
}
