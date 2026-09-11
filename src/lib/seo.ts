import { useEffect } from 'react';

// Central site URL — update this single value when the final domain is configured
export const SITE_URL = 'https://phototools.app';

interface SeoOptions {
  title: string;
  description?: string;
  keywords?: string;
  path?: string;
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

function upsertCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function buildCanonicalUrl(path?: string): string {
  const pathname = path || window.location.pathname || '/';
  const clean = pathname.replace(/\/+$/, '') || '/';
  return `${SITE_URL}${clean}`;
}

export function useSeo({ title, description, keywords, path }: SeoOptions) {
  useEffect(() => {
    document.title = title;

    if (description) upsertMeta('description', 'name', description);
    if (keywords) upsertMeta('keywords', 'name', keywords);

    upsertMeta('og:title', 'property', title);
    if (description) upsertMeta('og:description', 'property', description);

    const canonical = buildCanonicalUrl(path);
    upsertCanonical(canonical);
    upsertMeta('og:url', 'property', canonical);
  }, [title, description, keywords, path]);
}
