/* Public page bootstrapping: navigation, collection state, and story dialog. */

import { media } from '../data/media.js';
import { StoryDialog, renderStories } from './media.js';
import { debounce, prefersReducedMotion, qs, qsa } from './ui.js';

const state = {
  entries: [],
  filter: 'all',
  query: '',
  actionMode: null,
};

const grid = qs('[data-collection-grid]');
const resultCount = qs('[data-result-count]');
const statePanel = qs('[data-collection-state]');
const stateEyebrow = qs('[data-state-eyebrow]');
const stateTitle = qs('[data-state-title]');
const stateText = qs('[data-state-text]');
const stateAction = qs('[data-state-action]');
const filters = qsa('[data-filter]');
const searchInput = qs('#story-search');
const searchClear = qs('[data-search-clear]');
const header = qs('[data-header]');

function normalise(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function animateCounter(node, target) {
  if (!node) return;
  const padded = (value) => String(value).padStart(2, '0');
  if (prefersReducedMotion() || target <= 0) {
    node.textContent = padded(target);
    return;
  }

  const duration = 900;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = padded(Math.round(target * eased));
    if (progress < 1) window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
}

function updateCounts() {
  const counts = { all: state.entries.length, movie: 0, tv: 0, anime: 0 };
  for (const entry of state.entries) {
    if (counts[entry.category] !== undefined) counts[entry.category] += 1;
  }

  qsa('[data-count-filter]').forEach((node) => {
    const key = node.dataset.countFilter;
    node.textContent = String(counts[key] ?? 0);
  });

  animateCounter(qs('[data-count="entries"]'), counts.all);
}

function hideState() {
  statePanel.hidden = true;
  state.actionMode = null;
}

function showState({ eyebrow, title, text, action = null, mode = null }) {
  stateEyebrow.textContent = eyebrow;
  stateTitle.textContent = title;
  stateText.textContent = text;
  state.actionMode = mode;
  if (action) {
    stateAction.textContent = action;
    stateAction.hidden = false;
  } else {
    stateAction.hidden = true;
  }
  statePanel.hidden = false;
}

function pluralCategory(filter) {
  if (filter === 'movie') return 'movies';
  if (filter === 'tv') return 'TV shows';
  if (filter === 'anime') return 'anime';
  return 'stories';
}

function updateResultCount(count) {
  const parts = [`${count} ${count === 1 ? 'story' : 'stories'}`];
  if (state.filter !== 'all') parts.push(`· ${pluralCategory(state.filter)}`);
  if (state.query) parts.push(`for “${state.query}”`);
  resultCount.textContent = parts.join(' ');
}

function applyFilters() {
  const term = normalise(state.query);
  const entries = state.entries.filter((entry) => {
    const categoryMatches = state.filter === 'all' || entry.category === state.filter;
    const titleMatches = !term || normalise(entry.title).includes(term);
    return categoryMatches && titleMatches;
  });

  renderStories(grid, entries);
  updateResultCount(entries.length);

  if (entries.length > 0) {
    hideState();
    return;
  }

  if (state.entries.length === 0) {
    showState({
      eyebrow: 'The archive',
      title: 'The reel is still blank.',
      text: 'No stories have been published yet. The first reflection will appear here soon.',
    });
    return;
  }

  if (state.query) {
    showState({
      eyebrow: 'No matches',
      title: 'Nothing in this frame.',
      text: `No titles match “${state.query}”. Try a different word, or clear the filters.`,
      action: 'Clear filters',
      mode: 'clear',
    });
    return;
  }

  showState({
    eyebrow: 'No results',
    title: 'Nothing in this frame.',
    text: `There are no ${pluralCategory(state.filter)} in the archive yet.`,
    action: 'Show all stories',
    mode: 'clear',
  });
}

function setFilter(filter) {
  state.filter = filter;
  filters.forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  applyFilters();
}

function clearFilters() {
  state.query = '';
  searchInput.value = '';
  searchClear.hidden = true;
  setFilter('all');
}

function loadStories() {
  hideState();
  grid.hidden = false;
  grid.setAttribute('aria-busy', 'true');

  // The collection lives in data/media.js. Anything marked as a draft stays
  // out of the public archive.
  state.entries = media.filter((entry) => (entry.status || 'published') === 'published');

  updateCounts();
  applyFilters();
  grid.setAttribute('aria-busy', 'false');
}

/* --- Search & filters --------------------------------------------------- */

const runSearch = debounce(() => {
  state.query = searchInput.value.trim();
  applyFilters();
}, 160);

searchInput.addEventListener('input', () => {
  searchClear.hidden = searchInput.value.length === 0;
  runSearch();
});

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && searchInput.value) {
    event.preventDefault();
    clearFilters();
    searchInput.focus();
  }
});

searchClear.addEventListener('click', () => {
  clearFilters();
  searchInput.focus();
});

filters.forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

stateAction.addEventListener('click', () => {
  clearFilters();
});

/* --- Header, mobile menu, active section -------------------------------- */

function setMenu(open) {
  if (!header) return;
  header.classList.toggle('is-menu-open', open);
  const toggle = qs('[data-nav-toggle]');
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(open));
    const label = qs('.sr-only', toggle);
    if (label) label.textContent = open ? 'Close menu' : 'Open menu';
  }
}

if (header) {
  const toggle = qs('[data-nav-toggle]');
  toggle?.addEventListener('click', () => {
    setMenu(!header.classList.contains('is-menu-open'));
  });

  qsa('.nav-link').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('click', (event) => {
    if (
      header.classList.contains('is-menu-open') &&
      event.target instanceof Node &&
      !header.contains(event.target)
    ) {
      setMenu(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('is-menu-open')) {
      setMenu(false);
      toggle?.focus();
    }
  });

  window
    .matchMedia('(min-width: 901px)')
    .addEventListener('change', (event) => {
      if (event.matches) setMenu(false);
    });

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 16);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const navLinks = qsa('.nav-link[data-nav]');
function setActiveSection(id) {
  navLinks.forEach((link) => {
    const active = link.dataset.nav === id;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries.find((entry) => entry.isIntersecting);
    if (visible) setActiveSection(visible.target.id);
  },
  { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
);

['home', 'collection', 'about', 'credits'].forEach((id) => {
  const section = document.getElementById(id);
  if (section) sectionObserver.observe(section);
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => setActiveSection(link.dataset.nav));
});

/* --- Story dialog ------------------------------------------------------- */

const storyDialog = new StoryDialog({
  dialog: qs('[data-story-dialog]'),
  body: qs('[data-story-body]'),
  closeButton: qs('[data-story-close]'),
});

grid.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest('.story-card__link');
  if (!link) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return;
  }
  event.preventDefault();
  const card = link.closest('.story-card');
  const id = card?.dataset.id;
  if (id) storyDialog.open(id);
});

/* --- Page chrome -------------------------------------------------------- */

const yearNode = qs('[data-year]');
if (yearNode) yearNode.textContent = String(new Date().getFullYear());

loadStories();
storyDialog.openFromHash();
