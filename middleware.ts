import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['fr', 'ar', 'en'],
  defaultLocale: 'fr'
});
 
export const config = {
  // Applique le middleware sur toutes les pages sauf les fichiers statiques (images, api...)
  matcher: ['/', '/(fr|ar|en)/:path*']
};