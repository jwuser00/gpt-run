# --- Latest Ubuntu 22.04 ARM Image ---

data "oci_core_images" "ubuntu_arm" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"

  filter {
    name   = "display_name"
    values = ["^${var.os_image_name}.*aarch64.*"]
    regex  = true
  }
}

# --- Cloud-Init Config ---

data "cloudinit_config" "server" {
  gzip          = true
  base64_encode = true

  part {
    content_type = "text/cloud-config"
    content      = file("${path.module}/cloud-init.yaml")
    filename     = "cloud-init.yaml"
  }
}

# --- Compute Instances ---

locals {
  instances = {
    "small-1" = { ocpus = 1, memory = 6, boot_volume = 50 }
    "small-2" = { ocpus = 1, memory = 6, boot_volume = 50 }
    "medium"  = { ocpus = 2, memory = 12, boot_volume = 100 }
  }
}

resource "oci_core_instance" "server" {
  for_each = local.instances

  compartment_id      = var.compartment_ocid
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  shape               = var.instance_shape
  display_name        = "${var.project_name}-${each.key}"

  shape_config {
    ocpus         = each.value.ocpus
    memory_in_gbs = each.value.memory
  }

  source_details {
    source_type             = "image"
    source_id               = data.oci_core_images.ubuntu_arm.images[0].id
    boot_volume_size_in_gbs = each.value.boot_volume
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.public.id
    assign_public_ip = true
    display_name     = "${var.project_name}-${each.key}-vnic"
  }

  metadata = {
    ssh_authorized_keys = file(pathexpand(var.ssh_public_key_path))
    user_data           = data.cloudinit_config.server.rendered
  }

  lifecycle {
    ignore_changes = [source_details[0].source_id]
  }
}

# --- Availability Domains ---

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_ocid
}
