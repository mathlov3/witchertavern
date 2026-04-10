import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const FOOTER_PATH = '/fragments/nav/footer';

function buildMainSection(section) {
  const content = section.querySelector('.default-content');
  if (!content) return;

  const inner = document.createElement('div');
  inner.classList.add('footer-inner');

  // Brand: H2 + tagline paragraph
  const h2 = content.querySelector('h2');
  if (h2) {
    const brand = document.createElement('div');
    brand.classList.add('footer-brand');
    brand.append(h2);
    const tagline = content.querySelector('p');
    if (tagline) brand.append(tagline);
    inner.append(brand);
  }

  // Nav columns: each H3 + its following UL
  const nav = document.createElement('nav');
  nav.classList.add('footer-nav');
  nav.setAttribute('aria-label', 'Footer navigation');

  [...content.querySelectorAll('h3')].forEach((h3) => {
    const ul = h3.nextElementSibling;
    const col = document.createElement('div');
    col.classList.add('nav-col');
    col.append(h3);
    if (ul?.tagName === 'UL') col.append(ul);
    nav.append(col);
  });

  inner.append(nav);
  content.replaceWith(inner);
}

/**
 * loads and decorates the footer
 * @param {Element} el The footer element
 */
export default async function init(el) {
  const { locale } = getConfig();
  const footerMeta = getMetadata('footer');
  const path = footerMeta || FOOTER_PATH;
  try {
    const fragment = await loadFragment(`${locale.prefix}${path}`);
    fragment.classList.add('footer-content');

    const sections = [...fragment.querySelectorAll('.section')];

    const copyright = sections.pop();
    copyright.classList.add('section-copyright');

    const legal = sections.pop();
    legal.classList.add('section-legal');

    sections.forEach((s) => {
      s.classList.add('section-main');
      buildMainSection(s);
    });

    el.append(fragment);
  } catch (e) {
    throw Error(e);
  }
}
