/**
 * DEAD FILE — intentionally empty. Safe to delete.
 *
 * This wrapped the router's NavLink for a navigation the app never had. Nothing
 * imported it: Vite never pulled it into a bundle, which is why removing the router
 * package left the build passing. The body was deleted rather than the file because
 * deleting files in this repo is Angad's call, not an agent's.
 *
 * It is emptied rather than left in place so that neither `vite build` nor
 * `tsc --noEmit` can reference the removed routing package.
 *
 * If a navigation bar is ever needed, write it against plain anchors; a single-screen
 * game does not need a router to underline the current link.
 */
export {};
