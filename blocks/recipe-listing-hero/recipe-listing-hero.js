/**
 * Recipe Listing Hero block
 *
 * Atmospheric full-bleed hero for the recipes index page.
 * Renders candlelight glow orbs, ember particles, and a
 * staggered-reveal title section.
 *
 * Authoring structure:
 *
 *   Row 1 — single cell (required):
 *     <p>Eyebrow text</p>          ← paragraph BEFORE the heading
 *     <h1>Title <em>Italic</em></h1>
 *     <p>Subtitle paragraph</p>    ← paragraph AFTER the heading
 *
 *   Row 2 — image cells (optional, desktop slideshow on right):
 *     Cell 1: <picture> or <img>
 *     Cell 2: <picture> or <img>
 *     … as many images as needed, each in its own cell
 *
 *   Row 3 — three cells (optional stats):
 *     Cell 1: <p>48</p><p>Recipes</p>
 *     Cell 2: <p>7</p><p>Categories</p>
 *     Cell 3: <p>2</p><p>Universes</p>
 *
 * Rows 2 and 3 are auto-detected by content type.
 * If no image row is present the layout is unchanged.
 */

function buildEmbers(container) {
  for (let i = 0; i < 18; i += 1) {
    const ember = document.createElement('span');
    ember.className = 'rlh-ember';
    const size = 1.5 + Math.random() * 2.5;
    ember.style.cssText = [
      `left:${5 + Math.random() * 90}%`,
      `animation-duration:${4 + Math.random() * 5}s`,
      `animation-delay:${Math.random() * 8}s`,
      `width:${size}px`,
      `height:${size}px`,
      `--drift:${(Math.random() - 0.5) * 80}px`,
      `--drift2:${(Math.random() - 0.5) * 40}px`,
    ].join(';');
    if (Math.random() > 0.75) {
      ember.style.background = 'var(--color-crimson-400, #d45050)';
      ember.style.boxShadow = '0 0 6px 2px rgba(212,80,80,0.5)';
    }
    container.append(ember);
  }
}

function buildStats(statsRow) {
  const bar = document.createElement('div');
  bar.className = 'rlh-stats';

  [...statsRow.children].forEach((cell) => {
    const ps = [...cell.querySelectorAll('p')];
    if (ps.length < 2) return;

    const stat = document.createElement('div');
    stat.className = 'rlh-stat';

    const num = document.createElement('span');
    num.className = 'rlh-stat-num';
    num.textContent = ps[0].textContent.trim();

    const label = document.createElement('span');
    label.className = 'rlh-stat-label';
    label.textContent = ps[1].textContent.trim();

    stat.append(num, label);
    bar.append(stat);
  });

  return bar.children.length ? bar : null;
}

function buildGallery(imageRow) {
  const cell = imageRow.querySelector(':scope > div');
  if (!cell) return null;
  // Select <picture> elements only; fall back to bare <img> (not nested inside <picture>)
  // Never use 'picture, img' — that matches the <img> inside <picture> twice
  const images = cell.querySelector('picture')
    ? [...cell.querySelectorAll('picture')]
    : [...cell.querySelectorAll('img')];
  if (!images.length) return null;

  const panel = document.createElement('div');
  panel.className = 'rlh-gallery';
  panel.setAttribute('aria-hidden', 'true');

  images.forEach((img, i) => {
    const slide = document.createElement('div');
    slide.className = i === 0 ? 'rlh-slide rlh-slide--active' : 'rlh-slide';
    slide.append(img);
    panel.append(slide);
  });

  if (images.length > 1) {
    let current = 0;
    setInterval(() => {
      const slides = [...panel.querySelectorAll('.rlh-slide')];
      const next = (current + 1) % slides.length;
      slides[current].classList.remove('rlh-slide--active');
      slides[current].classList.add('rlh-slide--prev');
      slides[next].classList.add('rlh-slide--active');
      const outgoing = slides[current];
      setTimeout(() => outgoing.classList.remove('rlh-slide--prev'), 950);
      current = next;
    }, 5000);
  }

  return panel;
}

export default function decorate(block) {
  const rows = [...block.children];
  const contentCell = rows[0]?.querySelector(':scope > div');

  // Auto-detect image row and stats row from rows after the first
  let imageRow = null;
  let statsRow = null;
  rows.slice(1).forEach((row) => {
    const hasPictures = [...row.children].some((cell) => cell.querySelector('picture, img'));
    if (hasPictures) imageRow = row;
    else statsRow = row;
  });

  // ── Background
  const bg = document.createElement('div');
  bg.className = 'rlh-bg';
  bg.setAttribute('aria-hidden', 'true');

  // ── Candlelight glow orbs
  const glowWrap = document.createElement('div');
  glowWrap.className = 'rlh-glows';
  glowWrap.setAttribute('aria-hidden', 'true');
  [1, 2, 3].forEach((n) => {
    const g = document.createElement('div');
    g.className = `rlh-glow rlh-glow-${n}`;
    glowWrap.append(g);
  });

  // ── Ember particles
  const embers = document.createElement('div');
  embers.className = 'rlh-embers';
  embers.setAttribute('aria-hidden', 'true');
  buildEmbers(embers);

  // ── Content
  const content = document.createElement('div');
  content.className = 'rlh-content';

  if (contentCell) {
    const heading = contentCell.querySelector('h1, h2');
    const allPs = [...contentCell.querySelectorAll(':scope > p')];

    let eyebrowP = null;
    let subtitleP = null;

    if (heading) {
      allPs.forEach((p) => {
        const pos = heading.compareDocumentPosition(p);
        // eslint-disable-next-line no-bitwise
        if (pos & Node.DOCUMENT_POSITION_PRECEDING && !eyebrowP) {
          eyebrowP = p;
        // eslint-disable-next-line no-bitwise
        } else if (pos & Node.DOCUMENT_POSITION_FOLLOWING && !subtitleP) {
          subtitleP = p;
        }
      });
    } else {
      [eyebrowP, subtitleP] = allPs;
    }

    if (eyebrowP) {
      const ew = document.createElement('p');
      ew.className = 'rlh-eyebrow';
      ew.textContent = eyebrowP.textContent.trim();
      content.append(ew);
    }

    if (heading) {
      heading.className = 'rlh-title';
      content.append(heading);
    }

    if (subtitleP) {
      subtitleP.className = 'rlh-subtitle';
      content.append(subtitleP);
    }
  }

  if (statsRow) {
    const stats = buildStats(statsRow);
    if (stats) content.append(stats);
  }

  // ── Layout wrapper (becomes 2-col grid on desktop when images present)
  const layout = document.createElement('div');
  layout.className = 'rlh-layout';
  layout.append(content);

  if (imageRow) {
    const gallery = buildGallery(imageRow);
    if (gallery) {
      block.classList.add('has-gallery');
      layout.append(gallery);
    }
  }

  // ── Bottom ornament line
  const ornament = document.createElement('div');
  ornament.className = 'rlh-ornament';
  ornament.setAttribute('aria-hidden', 'true');

  block.replaceChildren(bg, glowWrap, embers, layout, ornament);
}
