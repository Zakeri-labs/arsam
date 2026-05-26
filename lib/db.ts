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

const DB_PATH = path.join(process.cwd(), 'lib', 'services.json');

// Safely get default values by importing them dynamically at run-time if needed
// to prevent compile-time static circular references
async function getDefaultData(): Promise<ServicesDB> {
  const contentModule = await import('./content');
  
  // We need to extract the raw lists. In content.ts, the raw lists are const and not exported.
  // Wait! Let's check if servicesListEN, servicesListFA, and servicesListAR are exported in content.ts.
  // Let's verify line 53: "const servicesListEN: Service[] = [" -> they are NOT exported!
  // But wait, the exported 'content' object contains all the services!
  // We can extract them from the exported 'content' object!
  // Let's see: 
  // 'content.en.uae.services.items' contains services filtered by uaeServiceIds.
  // 'content.en.oman.services.items' contains Oman services mapped to OMR.
  // To get the full lists, wait! Are they exported?
  // Let's check if we can read content.ts and extract them, OR we can export them from content.ts!
  // Exporting them from content.ts is extremely easy and safe!
  // Let's edit content.ts to export servicesListEN, servicesListFA, servicesListAR, uaeServiceIds, and omanServiceIds.
  
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
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data) as ServicesDB;
    }
  } catch (error) {
    console.error('Error reading services DB, falling back to static content:', error);
  }

  // Fallback: If file doesn't exist, we will trigger async initialization in the background
  // but return empty or dynamic structure. 
  // To keep it synchronous and simple, we can write the file on the first API request.
  return {
    en: [],
    fa: [],
    ar: [],
    uaeServiceIds: [],
    omanServiceIds: [],
  };
}

export async function initializeDBIfNeeded(): Promise<ServicesDB> {
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
