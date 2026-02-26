import { getRequestConfig } from 'next-intl/server';

const locales = ['fr', 'ar', 'en'];

export default getRequestConfig(async ({ locale }) => {
  // Sécurité : si la langue n'est pas trouvée, on force le français
  const validLocale = locales.includes(locale as any) ? (locale as string) : 'fr';

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
});