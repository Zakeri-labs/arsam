

import { initializeDBIfNeeded } from './lib/db';

async function main() {
  console.log('Initializing database...');
  await initializeDBIfNeeded();
  console.log('Done!');
}

main().catch(console.error);
