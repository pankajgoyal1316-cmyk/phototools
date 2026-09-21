#!/usr/bin/env node
/**
 * Post-build prerender script.
 *
 * Reads dist/index.html, then generates a directory per known route
 * (dist/resize/index.html, dist/signature/index.html, etc.) with the
 * correct canonical, og:url, title, meta description, and JSON-LD
 * baked into the initial HTML — so Googlebot sees the right canonical
 * before any JavaScript runs.
 *
 * The body and script tags are identical to the homepage; only the
 * <head> metadata is rewritten per-route.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const SITE_URL = 'https://phototools-6gh.pages.dev';
const OG_IMAGE = `${SITE_URL}/og-image.svg`;

const routes = [
  {
    path: '/resize',
    title: 'Resize & Compress Images Online — JPG, PNG, WebP | PhotoTools',
    description: 'Resize images by pixels, centimeters, or inches and compress to an exact file size in KB or MB. Free, private, and works entirely in your browser. No uploads.',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PhotoTools Resize & Compress',
      url: `${SITE_URL}/resize`,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },
  {
    path: '/signature',
    title: 'Signature Resizer — Resize Signature to Exact KB & Dimensions | PhotoTools',
    description: 'Resize your signature image to exact pixel dimensions and file size limits for government forms, job applications, and passport documents. Free and private.',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PhotoTools Signature Resizer',
      url: `${SITE_URL}/signature`,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },
  {
    path: '/pdf',
    title: 'JPG to PDF & PDF Compressor Online | PhotoTools',
    description: 'Convert JPG, PNG, and WebP images into a single PDF document, or compress an existing PDF to a smaller file size. All processing happens locally in your browser. No uploads.',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PhotoTools PDF Tools',
      url: `${SITE_URL}/pdf`,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },
  {
    path: '/background',
    title: 'Remove Image Background Online — Free AI Background Remover | PhotoTools',
    description: 'Remove the background from any photo using on-device AI. Replace it with a solid color, custom image, or keep it transparent. No uploads required. Free and private.',
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PhotoTools Background Remover',
      url: `${SITE_URL}/background`,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  },
  {
    path: '/about',
    title: 'About PhotoTools — Free Online Image Tools | PhotoTools',
    description: 'PhotoTools is a collection of free, privacy-first image utilities that run entirely in your browser. No uploads, no accounts, no watermarks.',
    ogType: 'website',
    jsonLd: null,
  },
  {
    path: '/contact',
    title: 'Contact PhotoTools | PhotoTools',
    description: 'Have a question, idea, or need help with a PhotoTools feature? Email us at phototool07@gmail.com. We do not use a contact form that collects personal information.',
    ogType: 'website',
    jsonLd: null,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | PhotoTools',
    description: 'PhotoTools processes all images locally in your browser. We never upload or store your files. Read our full privacy policy covering local processing, advertising, and data practices.',
    ogType: 'website',
    jsonLd: null,
  },
  {
    path: '/terms',
    title: 'Terms of Use | PhotoTools',
    description: 'PhotoTools is a free utility for personal and commercial use. Read our terms and disclaimer for full details on usage, responsibility, and limitations.',
    ogType: 'website',
    jsonLd: null,
  },
];

function rewriteHead(html, route) {
  const canonical = `${SITE_URL}${route.path}`;
  let result = html;

  // canonical
  result = result.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${canonical}"`,
  );

  // title
  result = result.replace(/<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`);

  // meta description
  result = result.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${route.description}"`,
  );

  // og:title
  result = result.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${route.title}"`,
  );

  // og:description
  result = result.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${route.description}"`,
  );

  // og:url
  result = result.replace(
    /<meta property="og:url" content="[^"]*"/,
    `<meta property="og:url" content="${canonical}"`,
  );

  // twitter:title
  result = result.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${route.title}"`,
  );

  // twitter:description
  result = result.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${route.description}"`,
  );

  // JSON-LD: replace the existing script block
  if (route.jsonLd) {
    const jsonLdStr = JSON.stringify(route.jsonLd, null, 2);
    result = result.replace(
      /<script type="application\/ld\+json" data-jsonld="true">[\s\S]*?<\/script>/,
      `<script type="application/ld+json" data-jsonld="true">\n    ${jsonLdStr}\n  </script>`,
    );
  } else {
    result = result.replace(
      /\s*<!-- JSON-LD Structured Data -->\s*<script type="application\/ld\+json" data-jsonld="true">[\s\S]*?<\/script>/,
      '',
    );
  }

  return result;
}

// Read the built index.html
const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

for (const route of routes) {
  const routeDir = join(distDir, route.path);
  mkdirSync(routeDir, { recursive: true });
  const routeHtml = rewriteHead(indexHtml, route);
  writeFileSync(join(routeDir, 'index.html'), routeHtml);
  console.log(`  prerendered ${route.path}/index.html`);
}

console.log('Prerender complete.');
