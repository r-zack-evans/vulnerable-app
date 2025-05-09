import seedUsers from './seed-users';
import seedDatabase from './seed-db';

// Export all seed functions
export {
  seedUsers,
  seedDatabase
};

// Default export to run all seed functions
export default function seedAll() {
  console.log('Starting complete database seeding process...');
  
  // Run the main seed function which also calls seedUsers internally
  seedDatabase();
}