#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    cat << EOF
Masjid Display Docker Management Script

Usage: ./docker.sh [MODE] [ACTION]

Modes:
  prod    Production mode (default)
  dev     Development mode with hot reload

Actions:
  up      Start containers (build if needed)
  down    Stop containers
  rebuild Rebuild and restart containers
  logs    Show container logs (follow mode)
  status  Show container status
  help    Show this help message

Examples:
  ./docker.sh                # Production: build and start
  ./docker.sh prod up        # Production: start
  ./docker.sh dev up         # Development: start with hot reload
  ./docker.sh dev rebuild    # Development: rebuild and restart
  ./docker.sh logs           # Show production logs
  ./docker.sh dev logs       # Show development logs
  ./docker.sh down           # Stop production containers
  ./docker.sh dev down       # Stop development containers

Production:  http://localhost:5000
Development: http://localhost:5000 (with hot reload)
Admin Panel: http://localhost:5000/admin
Display:     http://localhost:5000/display
EOF
}

MODE="${1:-prod}"
ACTION="${2:-up}"

if [[ "$MODE" == "help" ]] || [[ "$MODE" == "--help" ]] || [[ "$MODE" == "-h" ]]; then
    show_help
    exit 0
fi

if [[ "$MODE" != "prod" ]] && [[ "$MODE" != "dev" ]]; then
    echo "Error: Invalid mode '$MODE'"
    echo "Use 'prod' or 'dev'"
    exit 1
fi

COMPOSE_FILES="-f docker-compose.yml"
if [[ "$MODE" == "dev" ]]; then
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
fi

case "$ACTION" in
    up)
        echo "Starting $MODE containers..."
        docker compose $COMPOSE_FILES up -d
        echo ""
        echo "✓ Containers started!"
        echo "  Display: http://localhost:5000/display"
        echo "  Admin:   http://localhost:5000/admin"
        if [[ "$MODE" == "dev" ]]; then
            echo "  Mode:    Development (hot reload enabled)"
        else
            echo "  Mode:    Production"
        fi
        ;;
        
    down)
        echo "Stopping $MODE containers..."
        docker compose $COMPOSE_FILES down
        echo "✓ Containers stopped"
        ;;
        
    rebuild)
        echo "Rebuilding $MODE containers..."
        docker compose $COMPOSE_FILES down
        docker compose $COMPOSE_FILES up -d --build
        echo ""
        echo "✓ Containers rebuilt and started!"
        echo "  Display: http://localhost:5000/display"
        echo "  Admin:   http://localhost:5000/admin"
        if [[ "$MODE" == "dev" ]]; then
            echo "  Mode:    Development (hot reload enabled)"
        else
            echo "  Mode:    Production"
        fi
        ;;
        
    logs)
        echo "Showing $MODE logs (Ctrl+C to exit)..."
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
