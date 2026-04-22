import { i18n } from '../../scripts/utils/placeholders.js';

const STORAGE_KEY = 'cookie-consent';

function grantConsent() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
  });
}

function denyConsent() {
  if (typeof window.gtag !== 'function') return;
  window.gtag('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
}

function hideBanner(banner) {
  banner.classList.add('is-hiding');
  banner.addEventListener('animationend', () => banner.remove(), { once: true });
}

export function showConsentBanner() {
  if (document.querySelector('.cookie-consent-banner')) return;
  import('/blocks/cookie-consent/cookie-consent.js').then((mod) => mod.renderBanner());
}

export async function renderBanner() {
  const [
    text,
    acceptLabel,
    necessaryLabel,
    privacyLabel,
    privacyHref,
  ] = await Promise.all([
    i18n('cookie-banner-text', 'Цей сайт використовує файли cookie для покращення вашого досвіду.'),
    i18n('cookie-banner-accept', 'Прийняти все'),
    i18n('cookie-banner-necessary-only', 'Лише необхідні'),
    i18n('cookie-banner-privacy-link', 'Політика конфіденційності'),
    i18n('cookie-banner-privacy-href', '/privacy'),
  ]);

  const banner = document.createElement('div');
  banner.className = 'cookie-consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', text);

  const content = document.createElement('div');
  content.className = 'cookie-consent-content';

  const message = document.createElement('p');
  message.className = 'cookie-consent-text';
  message.textContent = text;

  const privacyLink = document.createElement('a');
  privacyLink.href = privacyHref;
  privacyLink.textContent = privacyLabel;
  privacyLink.className = 'cookie-consent-privacy';
  message.append(' ', privacyLink);

  const actions = document.createElement('div');
  actions.className = 'cookie-consent-actions';

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'cookie-consent-btn cookie-consent-btn--accept';
  acceptBtn.textContent = acceptLabel;
  acceptBtn.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'granted');
    grantConsent();
    hideBanner(banner);
  });

  const necessaryBtn = document.createElement('button');
  necessaryBtn.className = 'cookie-consent-btn cookie-consent-btn--necessary';
  necessaryBtn.textContent = necessaryLabel;
  necessaryBtn.addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEY, 'denied');
    denyConsent();
    hideBanner(banner);
  });

  actions.append(acceptBtn, necessaryBtn);
  content.append(message, actions);
  banner.append(content);
  document.body.append(banner);
}

export default async function init(el) {
  // Block element is used as a re-open trigger (e.g. placed in footer)
  el.innerHTML = '';
  const link = document.createElement('a');
  link.className = 'cookie-consent-reopen';
  link.href = '#cookie-settings';
  const label = await i18n('cookie-banner-reopen', 'Налаштування cookie');
  link.textContent = label;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem(STORAGE_KEY);
    renderBanner();
  });
  el.append(link);
}
