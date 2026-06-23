import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // Fallback to 'ar' (Arabic) if no locale is detected
  const locale = await requestLocale || 'ar';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
