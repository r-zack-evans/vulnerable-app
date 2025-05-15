#!/usr/bin/env ts-node

// Import using standard TypeScript import syntax
import { SeedingPipeline } from './index';

// Run the complete seed process
const config = {
  database: { path: process.env.DB_PATH || 'vuln_app.sqlite' },
  profiles: {
    minimal: ['users', 'core-projects'],
    demo: ['users', 'core-projects', 'enterprise-projects', 'tasks'],
    full: ['users', 'core-projects', 'enterprise-projects', 'tasks', 'extended-data'],
  },
  activeProfile: process.env.SEED_PROFILE || 'demo',
};

// We need to use the imported class correctly
const pipeline = new SeedingPipeline(config);
pipeline.run().then(() => {
  console.log('Seed script execution completed.');
}).catch(error => {
  console.error('Error running seed pipeline:', error);
});

console.log('Seed script execution initiated.');