import { Service } from './content';
import { supabase } from './supabase';

// Define the database structure expected by frontend
export interface ServicesDB {
  en: Service[];
  fa: Service[];
  ar: Service[];
  uaeServiceIds: string[];
  omanServiceIds: string[];
}

export interface ServiceRow {
  id: string;
  category: string;
  image_url?: string;

  title_en?: string;
  title_fa?: string;
  title_ar?: string;

  description_en?: string;
  description_fa?: string;
  description_ar?: string;

  service_fee_en?: string;
  service_fee_fa?: string;
  service_fee_ar?: string;

  government_fees_en?: string;
  government_fees_fa?: string;
  government_fees_ar?: string;

  working_days_en?: string;
  working_days_fa?: string;
  working_days_ar?: string;

  requirements_en?: string[];
  requirements_fa?: string[];
  requirements_ar?: string[];

  is_uae?: boolean;
  is_oman?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Safely get default fallback values from content.ts if DB is empty
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

/**
 * Reads all individual service rows from `public.services` table
 * and transforms them into multilingual lists (`en`, `fa`, `ar`, `uaeServiceIds`, `omanServiceIds`).
 */
export async function getServicesDB(): Promise<ServicesDB> {
  try {
    const { data: rows, error } = await supabase
      .from('services')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error reading services table from Supabase:', error);
      throw error;
    }

    if (rows && rows.length > 0) {
      const en: Service[] = [];
      const fa: Service[] = [];
      const ar: Service[] = [];
      const uaeServiceIds: string[] = [];
      const omanServiceIds: string[] = [];

      for (const row of rows as ServiceRow[]) {
        if (row.is_uae) uaeServiceIds.push(row.id);
        if (row.is_oman) omanServiceIds.push(row.id);

        en.push({
          id: row.id,
          title: row.title_en || '',
          description: row.description_en || '',
          serviceFee: row.service_fee_en,
          governmentFees: row.government_fees_en,
          workingDays: row.working_days_en,
          requirements: row.requirements_en || [],
          category: row.category,
          imageUrl: row.image_url
        });

        fa.push({
          id: row.id,
          title: row.title_fa || '',
          description: row.description_fa || '',
          serviceFee: row.service_fee_fa,
          governmentFees: row.government_fees_fa,
          workingDays: row.working_days_fa,
          requirements: row.requirements_fa || [],
          category: row.category,
          imageUrl: row.image_url
        });

        ar.push({
          id: row.id,
          title: row.title_ar || '',
          description: row.description_ar || '',
          serviceFee: row.service_fee_ar,
          governmentFees: row.government_fees_ar,
          workingDays: row.working_days_ar,
          requirements: row.requirements_ar || [],
          category: row.category,
          imageUrl: row.image_url
        });
      }

      return { en, fa, ar, uaeServiceIds, omanServiceIds };
    }
  } catch (error) {
    console.error('Error reading services DB:', error);
  }

  return { en: [], fa: [], ar: [], uaeServiceIds: [], omanServiceIds: [] };
}

export async function initializeDBIfNeeded(): Promise<ServicesDB> {
  try {
    const db = await getServicesDB();
    if (db.en.length === 0 && db.fa.length === 0) {
      console.log('Services database empty. Initializing from content.ts...');
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

/**
 * Saves or updates ServicesDB into individual rows in the `public.services` table.
 */
export async function saveServicesDB(db: ServicesDB): Promise<boolean> {
  try {
    const enMap = new Map(db.en.map(s => [s.id, s]));
    const faMap = new Map(db.fa.map(s => [s.id, s]));
    const arMap = new Map(db.ar.map(s => [s.id, s]));
    const uaeSet = new Set(db.uaeServiceIds || []);
    const omanSet = new Set(db.omanServiceIds || []);

    const allIds = Array.from(
      new Set([...db.en.map(s => s.id), ...db.fa.map(s => s.id), ...db.ar.map(s => s.id)])
    );

    const rows: ServiceRow[] = allIds.map(id => {
      const en = enMap.get(id);
      const fa = faMap.get(id);
      const ar = arMap.get(id);

      return {
        id,
        category: en?.category || fa?.category || ar?.category || 'General Services',
        image_url: en?.imageUrl || fa?.imageUrl || ar?.imageUrl || '',
        title_en: en?.title || '',
        title_fa: fa?.title || '',
        title_ar: ar?.title || '',
        description_en: en?.description || '',
        description_fa: fa?.description || '',
        description_ar: ar?.description || '',
        service_fee_en: en?.serviceFee || '',
        service_fee_fa: fa?.serviceFee || '',
        service_fee_ar: ar?.serviceFee || '',
        government_fees_en: en?.governmentFees || '',
        government_fees_fa: fa?.governmentFees || '',
        government_fees_ar: ar?.governmentFees || '',
        working_days_en: en?.workingDays || '',
        working_days_fa: fa?.workingDays || '',
        working_days_ar: ar?.workingDays || '',
        requirements_en: en?.requirements || [],
        requirements_fa: fa?.requirements || [],
        requirements_ar: ar?.requirements || [],
        is_uae: uaeSet.has(id),
        is_oman: omanSet.has(id),
        updated_at: new Date().toISOString()
      };
    });

    const { error } = await supabase.from('services').upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save services rows to Supabase:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Exception in saveServicesDB:', error);
    return false;
  }
}

/**
 * Direct CRUD operations for individual service rows
 */
export async function getRawServicesRows(): Promise<ServiceRow[]> {
  const { data, error } = await supabase.from('services').select('*').order('id', { ascending: true });
  if (error) {
    console.error('Error fetching raw service rows:', error);
    return [];
  }
  return data || [];
}

export async function upsertServiceRow(row: ServiceRow): Promise<boolean> {
  const { error } = await supabase.from('services').upsert([{ ...row, updated_at: new Date().toISOString() }], { onConflict: 'id' });
  if (error) {
    console.error('Error upserting service row:', error);
    return false;
  }
  return true;
}

export async function deleteServiceRow(id: string): Promise<boolean> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) {
    console.error('Error deleting service row:', error);
    return false;
  }
  return true;
}
