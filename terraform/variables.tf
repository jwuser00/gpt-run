variable "region" {
  description = "OCI region"
  type        = string
  default     = "ap-chuncheon-1"
}

variable "compartment_ocid" {
  description = "Compartment OCID (필수 입력)"
  type        = string
}

variable "instance_shape" {
  description = "Compute instance shape"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "boot_volume_size_in_gbs" {
  description = "Boot volume size in GBs (Always Free: up to 200GB total)"
  type        = number
  default     = 100
}

variable "os_image_name" {
  description = "OS image name filter"
  type        = string
  default     = "Canonical-Ubuntu-22.04"
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key for instance access"
  type        = string
  default     = "~/.ssh/oci_arm.pub"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "running-manager"
}
