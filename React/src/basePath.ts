const intelligentFormsMountPath = '/intelligent-forms-doc-generation/react';

/**
 * Keep one build usable both through the GCP vanity path and directly
 * from the Azure App Service root.
 *
 * Note: `/intelligent-forms-doc-generation/` (no `/react` suffix) is a separate
 * landing page served by a different service. This React app is mounted
 * only under `/intelligent-forms-doc-generation/react/`.
 */
export function getPublicBasePath(pathname = window.location.pathname) {
  return pathname === intelligentFormsMountPath ||
    pathname.startsWith(`${intelligentFormsMountPath}/`)
    ? intelligentFormsMountPath
    : '/';
}
