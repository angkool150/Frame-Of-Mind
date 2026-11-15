/* Small, dependency-free DOM helpers shared by the archive and its dialog. */

export const CATEGORY_LABELS = Object.freeze({
  movie: 'Movie',
  tv: 'TV Show',
  anime: 'Anime',
});

const SAFE_POSTER = /^images\/[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
const FALLBACK_POSTER = 'images/poster-fallback.svg';

export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function categoryLabel(value) {
  return CATEGORY_LABELS[value] || 'Story';
}

export function safePoster(value) {
  return typeof value === 'string' && SAFE_POSTER.test(value) && !value.includes('..')
    ? value
    : FALLBACK_POSTER;
}

export function attachPosterFallback(image) {
  image.addEventListener(
    'error',
    () => {
      if (!image.src.endsWith(FALLBACK_POSTER)) {
        image.src = FALLBACK_POSTER;
      }
    },
    { once: true }
  );
}

export function debounce(fn, wait = 160) {
  let timer = 0;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
