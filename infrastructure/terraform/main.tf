# Bauimperium - Terraform Infrastructure
# Provider: Hetzner Cloud (or AWS/GCP/Azure)

terraform {
  required_version = ">= 1.5"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  sensitive   = true
}

variable "domain" {
  description = "Domain name"
  default     = "bauimperium.de"
}

# Create server
resource "hcloud_server" "bauimperium" {
  name        = "bauimperium-prod"
  image       = "ubuntu-22.04"
  server_type = "cpx31"  # 4 vCPU, 8GB RAM
  location    = "nbg1"    # Nuremberg
  ssh_keys    = [var.hcloud_ssh_key_id]

  user_data = <<-EOF
    #cloud-config
    packages:
      - docker.io
      - docker-compose-v2
      - nginx
    runcmd:
      - systemctl enable docker
      - systemctl start docker
      - mkdir -p /opt/bauimperium
  EOF
}

# Firewall
resource "hcloud_firewall" "bauimperium" {
  name = "bauimperium-firewall"

  rule {
    direction = "in"
    protocol  = "tcp"
    source_ips = ["0.0.0.0/0", "::/0"]
    port      = "80"
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    source_ips = ["0.0.0.0/0", "::/0"]
    port      = "443"
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    source_ips = ["0.0.0.0/0", "::/0"]
    port      = "22"
  }
}

resource "hcloud_firewall_attachment" "bauimperium" {
  firewall_id = hcloud_firewall.bauimperium.id
  server_ids  = [hcloud_server.bauimperium.id]
}

# Cloudflare DNS
resource "cloudflare_record" "bauimperium" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = hcloud_server.bauimperium.ipv4_address
  type    = "A"
  proxied = true
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = hcloud_server.bauimperium.ipv4_address
  type    = "A"
  proxied = true
}

# Output
output "server_ip" {
  value = hcloud_server.bauimperium.ipv4_address
}

output "domain" {
  value = var.domain
}
