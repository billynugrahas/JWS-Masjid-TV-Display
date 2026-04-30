#!/bin/bash
# Masjid Display - Remote Access Setup
# Installs Tailscale (VPN) and Avahi (mDNS) for remote management
# Run this on the deployed PC (the masjid display device)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

show_help() {
    cat << EOF
Masjid Display - Remote Access Setup

Usage: ./setup-remote.sh [ACTION]

Actions:
  tailscale   Install and setup Tailscale VPN
  mdns        Install and setup mDNS (Avahi) for local domain
  all         Install everything (default)
  status      Show current remote access status
  help        Show this help message

What this sets up:

  1. Tailscale - Lightweight mesh VPN for remote SSH and admin access
     - Access from anywhere via Tailscale network
     - No port forwarding or public IP needed
     - ~20MB RAM usage

  2. mDNS (Avahi) - Local domain name via .local
     - Access via http://<hostname>.local:5000 on LAN
     - No IP memorization needed
     - ~2MB RAM usage

Requirements:
  - Linux (Debian/Ubuntu-based)
  - Internet connection
  - sudo privileges

EOF
}

# ─── Tailscale ────────────────────────────────────────────

setup_tailscale() {
    echo ""
    info "=== Setting up Tailscale VPN ==="
    echo ""

    if command -v tailscale &>/dev/null; then
        ok "Tailscale is already installed ($(tailscale version 2>/dev/null | head -1))"
        local status
        status=$(tailscale status 2>/dev/null || true)
        if echo "$status" | grep -q "logged out" 2>/dev/null || [[ -z "$status" ]]; then
            warn "Tailscale is installed but not logged in."
            echo ""
            info "Run the following to authenticate:"
            echo "  sudo tailscale up"
        else
            ok "Tailscale is running:"
            tailscale status 2>/dev/null | head -5
        fi
        return 0
    fi

    info "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh

    ok "Tailscale installed successfully!"
    echo ""
    info "Authenticating with Tailscale..."
    info "A browser link will appear — open it on any device to approve."
    echo ""
    sudo tailscale up

    echo ""
    ok "Tailscale is connected!"
    echo ""

    local ts_ip
    ts_ip=$(tailscale ip -4 2>/dev/null || echo "N/A")
    ok "Your Tailscale IP: $ts_ip"
    echo ""
    info "You can now access this device remotely:"
    echo "  SSH:    ssh ${USER}@${ts_ip}"
    echo "  Display: http://${ts_ip}:5000/display"
    echo "  Admin:   http://${ts_ip}:5000/admin"
}

# ─── mDNS (Avahi) ────────────────────────────────────────

setup_mdns() {
    echo ""
    info "=== Setting up mDNS (Avahi) ==="
    echo ""

    local hostname
    hostname=$(hostname)

    info "Current hostname: $hostname"
    echo ""
    read -rp "Enter hostname for this device [default: $hostname]: " new_hostname
    new_hostname="${new_hostname:-$hostname}"

    # Validate hostname (mDNS allows lowercase letters, digits, hyphens)
    if ! echo "$new_hostname" | grep -qE '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'; then
        error "Invalid hostname. Use lowercase letters, digits, and hyphens only."
        error "Example: masjid, masjid-jws, masjid1"
        exit 1
    fi

    if [[ "$new_hostname" != "$hostname" ]]; then
        info "Setting hostname to '$new_hostname'..."
        sudo hostnamectl set-hostname "$new_hostname"
        ok "Hostname updated to '$new_hostname'"
    fi

    if systemctl is-active --quiet avahi-daemon 2>/dev/null; then
        ok "Avahi daemon is already running"
    else
        info "Installing Avahi daemon..."
        sudo apt-get update -qq
        sudo apt-get install -y -qq avahi-daemon

        sudo systemctl enable avahi-daemon
        sudo systemctl start avahi-daemon
        ok "Avahi daemon installed and started"
    fi

    echo ""
    ok "mDNS is configured!"
    echo ""
    ok "This device is now accessible on LAN as:"
    echo "  http://${new_hostname}.local:5000/display"
    echo "  http://${new_hostname}.local:5000/admin"
    echo ""
    info "Works from any device on the same network (phone, laptop, etc.)"
}

# ─── Status ───────────────────────────────────────────────

show_status() {
    echo ""
    info "=== Remote Access Status ==="
    echo ""

    # Tailscale
    if command -v tailscale &>/dev/null; then
        local ts_ip ts_status
        ts_ip=$(tailscale ip -4 2>/dev/null || echo "N/A")
        ts_status=$(tailscale status -json 2>/dev/null | grep -o '"Online":true' || echo "")
        if [[ -n "$ts_status" ]]; then
            ok "Tailscale: Connected ($ts_ip)"
        else
            warn "Tailscale: Installed but not connected"
            echo "         Run: sudo tailscale up"
        fi
    else
        warn "Tailscale: Not installed"
        echo "         Run: ./setup-remote.sh tailscale"
    fi
    echo ""

    # mDNS / Avahi
    if systemctl is-active --quiet avahi-daemon 2>/dev/null; then
        ok "mDNS (Avahi): Running"
        echo "         http://$(hostname).local:5000/display"
        echo "         http://$(hostname).local:5000/admin"
    else
        warn "mDNS (Avahi): Not running"
        echo "         Run: ./setup-remote.sh mdns"
    fi
    echo ""

    # Quick access summary
    echo "─────────────────────────────────────────"
    info "Quick Access Summary:"
    echo ""

    if command -v tailscale &>/dev/null; then
        ts_ip=$(tailscale ip -4 2>/dev/null || echo "")
        if [[ -n "$ts_ip" ]]; then
            echo "  Remote (via Tailscale):"
            echo "    SSH:      ssh ${USER}@${ts_ip}"
            echo "    Display:  http://${ts_ip}:5000/display"
            echo "    Admin:    http://${ts_ip}:5000/admin"
            echo ""
        fi
    fi

    if systemctl is-active --quiet avahi-daemon 2>/dev/null; then
        echo "  Local (via mDNS):"
        echo "    Display:  http://$(hostname).local:5000/display"
        echo "    Admin:    http://$(hostname).local:5000/admin"
        echo ""
    fi
}

# ─── Main ─────────────────────────────────────────────────

ACTION="${1:-all}"

if [[ "$ACTION" == "help" ]] || [[ "$ACTION" == "--help" ]] || [[ "$ACTION" == "-h" ]]; then
    show_help
    exit 0
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Masjid Display - Remote Access Setup    ║"
echo "╚══════════════════════════════════════════╝"

case "$ACTION" in
    tailscale)
        setup_tailscale
        ;;
    mdns)
        setup_mdns
        ;;
    all)
        setup_tailscale
        setup_mdns
        echo ""
        echo "╔══════════════════════════════════════════╗"
        echo "║        Setup Complete!                   ║"
        echo "╚══════════════════════════════════════════╝"
        echo ""
        info "To update the display system remotely:"
        echo "  1. From your laptop, SSH into this device via Tailscale IP"
        echo "  2. cd $(pwd)"
        echo "  3. git pull"
        echo "  4. docker compose up -d --build"
        echo ""
        info "To check status anytime: ./setup-remote.sh status"
        ;;
    status)
        show_status
        ;;
    *)
        error "Invalid action '$ACTION'"
        echo "Valid actions: tailscale, mdns, all, status, help"
        exit 1
        ;;
esac
