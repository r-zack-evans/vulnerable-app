#!/bin/sh
set -e

# Define functions for logging
log_info() {
  echo "[INFO] $1"
}

log_error() {
  echo "[ERROR] $1"
}

log_success() {
  echo "[SUCCESS] $1"
}

# Wait for database to be ready
wait_for_db() {
  log_info "Checking database..."
  
  DB_PATH=${DB_PATH:-"./vuln_app.sqlite"}
  
  # Check if we need to initialize the database
  if [ ! -f "$DB_PATH" ]; then
    log_info "Database file not found. Running initialization..."
    npm run db:init
  fi
  
  # Verify database is usable
  node ./src/migrations/verify-db.js
  if [ $? -ne 0 ]; then
    log_error "Database verification failed"
    exit 1
  fi
  
  log_success "Database ready"
}

# Initialize database schema and run migrations
run_migrations() {
  log_info "Running migrations..."
  
  node ./src/migrations/run-migrations.js
  if [ $? -ne 0 ]; then
    log_error "Migrations failed"
    exit 1
  fi
  
  log_success "Migrations completed successfully"
}

# Seed the database according to profile
run_seeding() {
  log_info "Running database seeding (profile: ${SEED_PROFILE:-default})..."
  
  node ./src/seeds/index.js
  if [ $? -ne 0 ]; then
    log_error "Seeding failed"
    exit 1
  fi
  
  log_success "Database seeded successfully"
}

# Main execution sequence
main() {
  log_info "Starting application initialization..."
  
  # First, check/initialize database
  wait_for_db
  
  # Run schema migrations
  run_migrations
  
  # Seed the database
  run_seeding
  
  # Set permissions on healthcheck (can be an issue in some Docker setups)
  chmod +x ./healthcheck.js
  
  log_success "Initialization complete, starting application..."
  
  # Start application
  exec npm start
}

# Run the initialization sequence
main