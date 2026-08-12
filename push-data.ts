import { servicesListEN, servicesListFA, servicesListAR, uaeServiceIds, omanServiceIds } from './lib/content';
import { supabase } from './lib/supabase';

async function main() {
  console.log('Seeding relational "services" table row by row...');

  const enMap = new Map(servicesListEN.map(s => [s.id, s]));
  const faMap = new Map(servicesListFA.map(s => [s.id, s]));
  const arMap = new Map(servicesListAR.map(s => [s.id, s]));

  // Get all unique service IDs across all lists
  const allServiceIds = Array.from(
    new Set([
      ...servicesListEN.map(s => s.id),
      ...servicesListFA.map(s => s.id),
      ...servicesListAR.map(s => s.id),
    ])
  );

  console.log(`Found ${allServiceIds.length} unique services to insert as individual database rows.`);

  const uaeSet = new Set(uaeServiceIds);
  const omanSet = new Set(omanServiceIds);

  const rowsToInsert = allServiceIds.map(id => {
    const en = enMap.get(id);
    const fa = faMap.get(id);
    const ar = arMap.get(id);

    const category = en?.category || fa?.category || ar?.category || 'General Services';
    const imageUrl = en?.imageUrl || fa?.imageUrl || ar?.imageUrl || '';

    return {
      id,
      category,
      image_url: imageUrl,

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

  // Upsert all rows into 'services' table
  const { data, error } = await supabase
    .from('services')
    .upsert(rowsToInsert, { onConflict: 'id' });

  if (error) {
    console.error('Failed to seed services table:', error);
    process.exit(1);
  }

  console.log(`Successfully inserted/updated ${rowsToInsert.length} individual service rows in "services" table!`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
