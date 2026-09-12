import { useEffect } from 'react';

export const SITE_URL = 'https://phototools-6gh.pages.dev';
export const SITE_NAME = 'PhotoTools';
export const OG_IMAGE = `${SITE_URL}/og-image.svg`;

interface SeoOptions {
  title: string;
  description?: string;
  path?: string;
  type?: string;
  jsonLd?: object | object[];
  noindex?: boolean;
}

function upsertMeta(name: string, attr: 'name' | 'property', content: string) {
  let meta = document.querySelector(`meta[${attr}="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function removeJsonLd() {
  document.querySelectorAll('script[data-jsonld]').forEach((s) => s.remove());
}

function buildCanonicalUrl(path?: string): string {
  const pathname = path || window.location.pathname || '/';
  const clean = pathname.replace(/\/+$/, '') || '/';
  return `${SITE_URL}${clean}`;
}

export function useSeo({ title, description, path, type = 'website', jsonLd, noindex }: SeoOptions) {
  useEffect(() => {
    const canonical = buildCanonicalUrl(path);
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;

    if (description) upsertMeta('description', 'name', description);
    upsertMeta('robots', 'name', noindex ? 'noindex, nofollow' : 'index, follow');

    upsertMeta('og:title', 'property', fullTitle);
    if (description) upsertMeta('og:description', 'property', description);
    upsertMeta('og:url', 'property', canonical);
    upsertMeta('og:type', 'property', type);
    upsertMeta('og:site_name', 'property', SITE_NAME);
    upsertMeta('og:image', 'property', OG_IMAGE);

    upsertMeta('twitter:card', 'name', 'summary_large_image');
    upsertMeta('twitter:title', 'name', fullTitle);
    if (description) upsertMeta('twitter:description', 'name', description);
    upsertMeta('twitter:image', 'name', OG_IMAGE);

    upsertLink('canonical', canonical);

    removeJsonLd();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-jsonld', 'true');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, path, type, jsonLd, noindex]);
}

export function buildJsonLd(type: string, data: Record<string, unknown>): object {
  return { '@context': 'https://schema.org', '@type': type, ...data };
}
