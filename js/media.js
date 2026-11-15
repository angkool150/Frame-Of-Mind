/* Collection cards and the editorial story dialog. */

import { media } from '../data/media.js';
import {
  attachPosterFallback,
  categoryLabel,
  el,
  safePoster,
} from './ui.js';

const ENTRIES = new Map(media.map((entry) => [entry.id, entry]));

const STORY_HASH = /^#story\/([a-z0-9][a-z0-9-]{0,79})$/;

function parseStoryHash() {
  const match = STORY_HASH.exec(window.location.hash);
  return match ? match[1] : null;
}

export function createStoryCard(entry) {
  const card = el('article', 'story-card');
  card.dataset.id = entry.id;

  const poster = el('div', 'story-card__poster');
  const image = el('img');
  image.src = safePoster(entry.poster);
  image.alt = `Poster artwork for ${entry.title}`;
  image.width = 800;
  image.height = 1200;
  image.loading = 'lazy';
  image.decoding = 'async';
  attachPosterFallback(image);
  poster.append(image);

  if (entry.featured) {
    poster.append(el('span', 'story-card__featured', 'Featured'));
  }

  const hoverCue = el('span', 'story-card__open');
  hoverCue.setAttribute('aria-hidden', 'true');
  hoverCue.append(document.createTextNode('Read reflection '));
  const hoverArrow = el('span', '', '→');
  hoverArrow.setAttribute('aria-hidden', 'true');
  hoverCue.append(hoverArrow);
  poster.append(hoverCue);

  const body = el('div', 'story-card__body');
  const meta = el('p', 'story-card__meta');
  meta.append(el('span', '', categoryLabel(entry.category)));
  const dot = el('span', 'dot', '·');
  dot.setAttribute('aria-hidden', 'true');
  meta.append(dot, el('span', '', String(entry.year)));
  body.append(meta);

  body.append(el('h3', 'story-card__title', entry.title));
  body.append(el('p', 'story-card__summary', entry.summary));

  const cta = el('span', 'story-card__cta');
  cta.append(document.createTextNode('Open story '));
  const arrow = el('span', '', '→');
  arrow.setAttribute('aria-hidden', 'true');
  cta.append(arrow);
  body.append(cta);

  const link = el('a', 'story-card__link');
  link.href = `#story/${entry.id}`;
  link.setAttribute('aria-label', `Read the reflection for ${entry.title}`);

  card.append(poster, body, link);
  return card;
}

export function renderStories(container, entries) {
  const cards = entries.map(createStoryCard);
  container.replaceChildren(...cards);
  container.hidden = cards.length === 0;
}

function storySection(label, text) {
  const section = el('div', 'story-section');
  section.append(el('p', 'story-section__label', label));
  section.append(el('p', 'story-section__text', text));
  return section;
}

export class StoryDialog {
  constructor({ dialog, body, closeButton }) {
    this.dialog = dialog;
    this.body = body;
    this.closeButton = closeButton;
    this.currentId = null;
    this.trigger = null;
    this.originalTitle = document.title;

    this.closeButton.addEventListener('click', () => this.requestClose());

    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.requestClose();
    });

    this.dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.requestClose();
    });

    this.dialog.addEventListener('close', () => this.handleClosed());

    window.addEventListener('popstate', () => this.syncFromLocation());
    window.addEventListener('hashchange', () => this.syncFromLocation());
  }

  isOpen() {
    return this.dialog.open;
  }

  openFromHash() {
    this.syncFromLocation();
  }

  syncFromLocation() {
    const id = parseStoryHash();
    if (!id) {
      if (this.dialog.open) this.closeNow();
      return;
    }
    if (!this.dialog.open || this.currentId !== id) {
      this.open(id, { push: false });
    }
  }

  open(id, { push = true } = {}) {
    if (!this.dialog.open) {
      this.trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.body.classList.add('has-dialog');
      if (typeof this.dialog.showModal === 'function') {
        this.dialog.showModal();
      } else {
        this.dialog.setAttribute('open', '');
      }
    }

    this.currentId = id;

    if (push) {
      const nextHash = `#story/${id}`;
      if (window.location.hash !== nextHash) {
        window.history.pushState({ story: id }, '', nextHash);
      }
    }

    this.body.scrollTop = 0;

    const entry = ENTRIES.get(id);
    if (entry) {
      this.render(entry);
    } else {
      this.renderError();
    }
  }

  render(entry) {
    this.dialog.setAttribute('aria-busy', 'false');
    document.title = `${entry.title} — FRAME OF MIND`;

    const view = el('section', 'story-view');

    const poster = el('div', 'story-view__poster');
    const image = el('img', 'story-view__image');
    image.src = safePoster(entry.poster);
    image.alt = `Poster artwork for ${entry.title}`;
    image.width = 800;
    image.height = 1200;
    attachPosterFallback(image);
    poster.append(image);

    const posterNote = el('p', 'story-view__poster-note');
    posterNote.append(el('span', '', 'From the archive'));
    posterNote.append(el('span', '', categoryLabel(entry.category)));
    poster.append(posterNote);

    const content = el('article', 'story-view__content');

    const meta = el('p', 'story-view__meta');
    meta.append(el('span', '', categoryLabel(entry.category)));
    const dot = el('span', 'dot', '·');
    dot.setAttribute('aria-hidden', 'true');
    meta.append(dot, el('span', '', String(entry.year)));
    if (entry.featured) {
      meta.append(el('span', 'story-view__featured', 'Featured'));
    }
    content.append(meta);

    const title = el('h2', 'story-view__title', entry.title);
    title.id = 'story-title';
    this.dialog.setAttribute('aria-labelledby', 'story-title');
    content.append(title);
    content.append(el('p', 'story-view__summary', entry.summary));
    content.append(el('div', 'story-view__rule'));

    content.append(storySection('Favorite character', entry.character));

    const quote = el('blockquote', 'story-quote');
    quote.append(el('p', '', entry.scene));
    quote.append(el('cite', '', 'Memorable scene or quote'));
    content.append(quote);

    content.append(storySection('What I learned', entry.lesson));
    content.append(storySection('How it affects my thinking', entry.thinking));

    const takeaway = el('aside', 'story-takeaway');
    takeaway.append(el('p', 'story-takeaway__label', 'Personal takeaway'));
    takeaway.append(el('p', '', entry.takeaway));
    content.append(takeaway);

    const footer = el('footer', 'story-view__footer');
    footer.append(el('span', '', 'FRAME OF MIND · Personal archive'));
    footer.append(el('span', '', 'Stories don’t end at the credits'));
    content.append(footer);

    view.append(poster, content);
    this.body.replaceChildren(view);
  }

  renderError() {
    this.dialog.setAttribute('aria-busy', 'false');
    document.title = 'Story unavailable — FRAME OF MIND';

    const wrapper = el('div', 'story-error');
    wrapper.append(el('p', 'eyebrow', 'The archive'));
    wrapper.append(el('h2', '', 'This frame would not hold.'));
    wrapper.append(
      el('p', '', 'This story is not part of the archive. It may have been renamed or removed.')
    );

    const back = el('a', 'btn btn--ghost', 'Back to the collection');
    back.href = '#collection';
    back.addEventListener('click', () => this.requestClose());
    wrapper.append(back);

    this.body.replaceChildren(wrapper);
  }

  requestClose() {
    if (!this.dialog.open) return;

    if (window.history.state && window.history.state.story) {
      window.history.back();
      return;
    }

    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    this.closeNow();
  }

  closeNow() {
    // Do the cleanup here rather than relying solely on the native close
    // event, which some engines dispatch late (or not at all).
    if (this.dialog.open) this.dialog.close();
    this.handleClosed();
  }

  handleClosed() {
    const wasOpen = this.currentId !== null || document.body.classList.contains('has-dialog');
    this.currentId = null;
    document.body.classList.remove('has-dialog');
    if (!wasOpen) return;
    this.dialog.removeAttribute('aria-labelledby');
    document.title = this.originalTitle;

    const target =
      this.trigger && this.trigger.isConnected
        ? this.trigger
        : document.querySelector('.brand');
    this.trigger = null;
    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
    }
  }
}
