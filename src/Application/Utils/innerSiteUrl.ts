const INNER_SITE_URL_PROD = 'https://antoninpicard-inner.vercel.app/';
const INNER_SITE_URL_DEV = 'http://localhost:3000/';

/**
 * Resolves the URL of the inner site (the Windows 95-style portfolio).
 * Warning: the dev URL only works if the inner site's dev server is running
 * on localhost:3000, and browsers may flag mixed-content issues in the iframe.
 */
export function getInnerSiteUrl(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('dev') ? INNER_SITE_URL_DEV : INNER_SITE_URL_PROD;
}
