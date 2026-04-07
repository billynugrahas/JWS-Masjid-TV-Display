#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    cat << EOF
Masjid Display - Development Mode

Usage: ./dev.sh [ACTION]

Actions:
  up      Start development containers (default)
  down    Stop development containers
  rebuild Rebuild and restart development containers
  logs    Show container logs (follow mode)
  status  Show container status
  help    Show this help message

Examples:
  ./dev.sh           # Start dev environment
  ./dev.sh rebuild   # Rebuild after dependency changes
  ./dev.sh logs      # Watch logs
  ./dev.sh down      # Stop containers

Development mode features:
  - Hot reload enabled (nodemon)
  - Code changes auto-reload without rebuild
  - server.js, public/, package.json mounted as volumes

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

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"

case "$ACTION" in
    up)
        echo "Starting development containers..."
        docker compose $COMPOSE_FILES up -d
        echo ""
        echo "✓ Development environment started!"
        echo "  Display:    http://localhost:5000/display"
        echo "  Admin:      http://localhost:5000/admin"
        echo "  Hot reload: Enabled (nodemon)"
        echo ""
        echo "Tip: Use './dev.sh logs' to watch logs"
        ;;
        
    down)
        echo "Stopping development containers..."
        docker compose $COMPOSE_FILES down
        echo "✓ Development containers stopped"
        ;;
        
    rebuild)
        echo "Rebuilding development containers..."
        docker compose $COMPOSE_FILES down
        docker compose $COMPOSE_FILES up -d --build
        echo ""
        echo "✓ Development environment rebuilt and started!"
        echo "  Display:    http://localhost:5000/display"
        echo "  Admin:      http://localhost:5000/admin"
        echo "  Hot reload: Enabled (nodemon)"
        ;;
        
    logs)
        echo "Showing development logs (Ctrl+C to exit)..."
        docker compose $COMPOSE_FILES logs -f
        ;;
        
    status)
        docker compose $COMPOSE_FILES ps
        ;;
        
    *)
        echo "Error: Invalid action '$ACTION'"
        echo "Valid actions: up, down, rebuild, logs, status, help"
        exit 1
        ;;
esac
