const DEF_BREAK = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }];

const GRID_WIDTHS = { 'grid-2': 800, 'grid-3': 600, 'grid-4': 400 };

export function restrictPicturesByGrid(el) {
  const section = el.closest('.section.container');
  if (!section) return;
  const gridClass = Object.keys(GRID_WIDTHS).find((cls) => section.classList.contains(cls));
  if (!gridClass) return;
  const width = GRID_WIDTHS[gridClass];
  el.querySelectorAll('picture source, picture img[src]').forEach((node) => {
    const attr = node.tagName === 'IMG' ? 'src' : 'srcset';
    const val = node.getAttribute(attr);
    if (val) node.setAttribute(attr, val.replace(/width=\d+/, `width=${width}`));
  });
}

export function createPicture({ src, alt = '', eager = false, breakpoints = DEF_BREAK }) {
  const url = !src.startsWith('http') ? new URL(src, window.location.href) : new URL(src);
  const picture = document.createElement('picture');
  const { origin, pathname } = url;
  const ext = pathname.split('.').pop();

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${origin}${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${origin}${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${origin}${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}
