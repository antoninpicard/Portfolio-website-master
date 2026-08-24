const MOBILE_MAX_WIDTH = 768;

/**
 * A device is considered mobile only when it combines a coarse (touch) pointer
 * with a narrow viewport, so a resized desktop browser window never triggers it.
 */
export function isMobileDevice(): boolean {
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isNarrowViewport = window.innerWidth <= MOBILE_MAX_WIDTH;

    return hasCoarsePointer && isNarrowViewport;
}
