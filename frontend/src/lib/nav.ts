/**
 * Which screens are pushed on top of a tab rather than being one.
 *
 * A pushed screen carries a back button, so the floating nav is both redundant
 * and in the way — it used to sit on top of the last rows of these pages. One
 * list drives both hiding the nav and how far the screen scrolls. The welcome
 * screen belongs here too: it is the way in, not a destination you tab back to.
 */
const PUSHED = ['/welcome', '/new', '/run', '/limits', '/about'];

export const isPushed = (pathname: string) => PUSHED.some((p) => pathname.startsWith(p));
