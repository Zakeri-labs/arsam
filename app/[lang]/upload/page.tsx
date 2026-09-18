import { redirect } from 'next/navigation';

export default async function LanguageUploadPage({
  params
}: {
  params: Promise<{ lang: string }> | { lang: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const lang = resolvedParams?.lang || 'fa';
  const validLang = ['en', 'fa', 'ar'].includes(lang) ? lang : 'fa';
  
  redirect(`/?lang=${validLang}&service=other-services`);
}
