import fs from 'fs';
import path from 'path';
import { Service } from './content';

// Define the database structure
export interface ServicesDB {
  en: Service[];
  fa: Service[];
  ar: Service[];
  uaeServiceIds: string[];
  omanServiceIds: string[];
}

const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel
  ? path.join('/tmp', 'services.json')
  : path.join(process.cwd(), 'lib', 'services.json');

// Ensure that we copy the existing committed services from static to /tmp if it doesn't exist yet
async function ensureDBFile() {
  if (isVercel && !fs.existsSync(DB_PATH)) {
    try {
      const staticPath = path.join(process.cwd(), 'lib', 'services.json');
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(staticPath)) {
        const data = fs.readFileSync(staticPath, 'utf8');
        fs.writeFileSync(DB_PATH, data, 'utf8');
      } else {
        // Fallback: Initializing from content.ts
        const defaults = await getDefaultData();
        fs.writeFileSync(DB_PATH, JSON.stringify(defaults, null, 2), 'utf8');
      }
    } catch (e) {
      console.error('Error seeding services in /tmp:', e);
    }
  }
}

// Safely get default values by importing them dynamically at run-time if needed
// to prevent compile-time static circular references
async function getDefaultData(): Promise<ServicesDB> {
  const contentModule = await import('./content');
  
  return {
    en: (contentModule as any).servicesListEN || [],
    fa: (contentModule as any).servicesListFA || [],
    ar: (contentModule as any).servicesListAR || [],
    uaeServiceIds: (contentModule as any).uaeServiceIds || [],
    omanServiceIds: (contentModule as any).omanServiceIds || [],
  };
}

export function getServicesDB(): ServicesDB {
  try {
    // Synchronous fallback copy for getServicesDB if running on Vercel and file is missing
    if (isVercel && !fs.existsSync(DB_PATH)) {
      const staticPath = path.join(process.cwd(), 'lib', 'services.json');
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(staticPath)) {
        const data = fs.readFileSync(staticPath, 'utf8');
        fs.writeFileSync(DB_PATH, data, 'utf8');
      }
    }

    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data) as ServicesDB;
    }
  } catch (error) {
    console.error('Error reading services DB, falling back to static content:', error);
  }

  // Fallback: If file doesn't exist, we will return empty dynamic structure
  return {
    en: [],
    fa: [],
    ar: [],
    uaeServiceIds: [],
    omanServiceIds: [],
  };
}

export async function initializeDBIfNeeded(): Promise<ServicesDB> {
  await ensureDBFile();
  if (!fs.existsSync(DB_PATH)) {
    console.log('Services JSON database not found. Initializing from content.ts...');
    const defaults = await getDefaultData();
    saveServicesDB(defaults);
    return defaults;
  }
  return getServicesDB();
}

export function saveServicesDB(db: ServicesDB): boolean {
  try {
    // Ensure dir exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to save services DB:', error);
    return false;
  }
}
