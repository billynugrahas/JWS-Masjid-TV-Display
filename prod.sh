#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    cat << EOF
Masjid Display - Production Mode

Usage: ./prod.sh [ACTION]

Actions:
  up      Start production containers (default)
  down    Stop production containers
  rebuild Rebuild and restart production containers
  logs    Show container logs (follow mode)
  status  Show container status
  help    Show this help message

Examples:
  ./prod.sh           # Start production
  ./prod.sh rebuild   # Rebuild and restart
  ./prod.sh logs      # Watch logs
  ./prod.sh down      # Stop containers

Production mode:
  - Optimized build
  - No hot reload
  - Suitable for deployment

Access:
  Display: http://localhost:5000/display
  Admin:   http://localhost:5000/admin
EOF
}

ACTION="${1:-up}"

if [[ "$ACTION" == "help" ]] || [[ "$ACTION" == "--help" ]] || [[ "$ACTION" == "-h" ]]; then
    show_help
    exit 0
fi

case "$ACTION" in
    up)
        echo "Starting production containers..."
        docker compose up -d
        echo ""
        echo "✓ Production environment started!"
        echo "  Display: http://localhost:5000/display"
        echo "  Admin:   http://localhost:5000/admin"
        echo "  Mode:    Production"
        echo ""
        echo "Tip: Use './prod.sh logs' to watch logs"
        ;;
        
    down)
        echo "Stopping production containers..."
        docker compose down
        echo "✓ Production containers stopped"
        ;;
        
    rebuild)
        echo "Rebuilding production containers..."
        docker compose down
        docker compose up -d --build
        echo ""
        echo "✓ Production environment rebuilt and started!"
        echo "  Display: http://localhost:5000/display"
        echo "  Admin:   http://localhost:5000/admin"
        echo "  Mode:    Production"
        ;;
        
    logs)
        echo "Showing production logs (Ctrl+C to exit)..."
        docker compose logs -f
        ;;
        
    status)
        docker compose ps
        ;;
        
    *)
        echo "Error: Invalid action '$ACTION'"
        echo "Valid actions: up, down, rebuild, logs, status, help"
        exit 1
        ;;
esac
