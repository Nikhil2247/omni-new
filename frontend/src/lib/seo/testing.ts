/**
 * SEO Testing Utilities
 * Helper functions for testing SEO implementation
 */

import { JSDOM } from 'jsdom';

export interface SEOTestResult {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  structuredData?: any[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse HTML and extract SEO elements
 */
export function parseSEO(html: string): SEOTestResult {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Title
  const title = document.querySelector('title')?.textContent;
  if (!title) {
    errors.push('Missing <title> tag');
  } else if (title.length > 60) {
    warnings.push(`Title too long: ${title.length} characters (recommended: 50-60)`);
  } else if (title.length < 30) {
    warnings.push(`Title too short: ${title.length} characters (recommended: 50-60)`);
  }

  // Description
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
  if (!description) {
    errors.push('Missing meta description');
  } else if (description.length > 160) {
    warnings.push(`Description too long: ${description.length} characters (recommended: 150-160)`);
  } else if (description.length < 120) {
    warnings.push(`Description too short: ${description.length} characters (recommended: 150-160)`);
  }

  // Canonical
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if (!canonical) {
    warnings.push('Missing canonical URL');
  }

  // Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');

  if (!ogTitle) warnings.push('Missing og:title');
  if (!ogDescription) warnings.push('Missing og:description');
  if (!ogImage) warnings.push('Missing og:image');

  // Twitter Card
  const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content');
  if (!twitterCard) warnings.push('Missing twitter:card');

  // Structured Data
  const structuredDataScripts = Array.from(
    document.querySelectorAll('script[type="application/ld+json"]')
  );
  const structuredData = structuredDataScripts.map((script) => {
    try {
      return JSON.parse(script.textContent || '');
    } catch {
      errors.push('Invalid JSON-LD structured data');
      return null;
    }
  }).filter(Boolean);

  if (structuredData.length === 0) {
    warnings.push('No structured data found');
  }

  return {
    title: title ?? undefined,
    description: description ?? undefined,
    canonical: canonical ?? undefined,
    ogTitle: ogTitle ?? undefined,
    ogDescription: ogDescription ?? undefined,
    ogImage: ogImage ?? undefined,
    twitterCard: twitterCard ?? undefined,
    structuredData,
    errors,
    warnings,
  };
}

/**
 * Validate SEO implementation
 */
export function validateSEO(result: SEOTestResult): boolean {
  return result.errors.length === 0;
}

/**
 * Generate SEO report
 */
export function generateSEOReport(result: SEOTestResult): string {
  const lines: string[] = [];

  lines.push('=== SEO Analysis Report ===\n');

  // Errors
  if (result.errors.length > 0) {
    lines.push('ERRORS:');
    result.errors.forEach((error) => lines.push(`  ❌ ${error}`));
    lines.push('');
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push('WARNINGS:');
    result.warnings.forEach((warning) => lines.push(`  ⚠️  ${warning}`));
    lines.push('');
  }

  // Success
  if (result.errors.length === 0 && result.warnings.length === 0) {
    lines.push('✅ All SEO checks passed!\n');
  }

  // Details
  lines.push('DETAILS:');
  if (result.title) lines.push(`  Title: ${result.title}`);
  if (result.description) lines.push(`  Description: ${result.description.substring(0, 100)}...`);
  if (result.canonical) lines.push(`  Canonical: ${result.canonical}`);
  if (result.structuredData) {
    lines.push(`  Structured Data: ${result.structuredData.length} schema(s) found`);
  }

  return lines.join('\n');
}
