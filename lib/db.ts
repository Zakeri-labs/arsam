import { Service } from './content';
import { supabase } from './supabase';

// Define the database structure
export interface ServicesDB {
  en: Service[];
  fa: Service[];
  ar: Service[];
  uaeServiceIds: string[];
  omanServiceIds: string[];
}

const DEFAULT_DB_ID = 'main_services_db';

// Safely get default values by importing them dynamically at run-time if needed
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

export async function getServicesDB(): Promise<ServicesDB> {
  try {
    const { data, error } = await supabase
      .from('services_data')
      .select('data')
      .eq('id', DEFAULT_DB_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Row not found
        return { en: [], fa: [], ar: [], uaeServiceIds: [], omanServiceIds: [] };
      }
      console.error('Error reading services DB from Supabase:', error);
      throw error;
    }

    if (data && data.data) {
      return data.data as ServicesDB;
    }
  } catch (error) {
    console.error('Error reading services DB:', error);
  }

  return { en: [], fa: [], ar: [], uaeServiceIds: [], omanServiceIds: [] };
}

export async function initializeDBIfNeeded(): Promise<ServicesDB> {
  try {
    const db = await getServicesDB();
    // If it's completely empty, initialize it
    if (db.en.length === 0 && db.fa.length === 0) {
      console.log('Services database not found or empty. Initializing from content.ts...');
      const defaults = await getDefaultData();
      await saveServicesDB(defaults);
      return defaults;
    }
    return db;
  } catch (error) {
    console.error('Failed to initialize DB:', error);
    return await getDefaultData();
  }
}

export async function saveServicesDB(db: ServicesDB): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('services_data')
      .upsert({ id: DEFAULT_DB_ID, data: db });

    if (error) {
      console.error('Failed to save services DB to Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Exception in saveServicesDB:', error);
    return false;
  }
}
