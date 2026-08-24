import { getInnerSiteUrl } from '../Utils/innerSiteUrl';

/**
 * Mounts a fullscreen iframe to the inner site, which opens "My Showcase"
 * automatically on load. Used instead of bootstrapping the Three.js Application
 * on mobile, where the 3D scene is unnecessary and too heavy.
 */
export function renderMobileShowcase(): void {
    const iframe = document.createElement('iframe');

    iframe.src = getInnerSiteUrl();
    iframe.style.position = 'fixed';
    iframe.style.inset = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100dvh';
    iframe.style.border = '0';
    iframe.frameBorder = '0';
    iframe.id = 'mobile-showcase';

    document.body.appendChild(iframe);
}
