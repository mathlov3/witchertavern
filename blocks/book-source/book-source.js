import { i18n } from '../../scripts/utils/placeholders.js';

export default async function decorate(block) {
  const label = await i18n('book-source-label', 'Source');

  const cells = [...block.querySelector(':scope > div').children];
  const imgCell = cells.find((c) => c.querySelector('picture'));
  const textCell = imgCell ? cells.find((c) => c !== imgCell) : cells[0];

  const inner = document.createElement('div');
  inner.className = 'book-source-inner';

  if (imgCell) {
    const cover = document.createElement('div');
    cover.className = 'book-source-cover';
    cover.append(imgCell.querySelector('picture'));
    inner.append(cover);
  }

  if (textCell) {
    const body = document.createElement('div');
    body.className = 'book-source-body';

    const labelEl = document.createElement('span');
    labelEl.className = 'book-source-label';
    labelEl.textContent = label;
    body.append(labelEl);

    body.append(...textCell.childNodes);
    inner.append(body);
  }

  block.replaceChildren(inner);
}
