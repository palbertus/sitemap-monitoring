import { XMLParser } from 'fast-xml-parser';
import { SitemapUrl } from '../types';

async function fetchXml(url: string): Promise<string> {
  const corsProxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];
  
  let lastError: Error | null = null;

  // Try direct fetch first with more lenient headers
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapMonitor/1.0)'
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      if (isValidXml(text)) {
        return text;
      }
    }
  } catch (error) {
    lastError = error as Error;
  }

  // Try each CORS proxy
  for (const proxyUrl of corsProxies) {
    try {
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        const text = await response.text();
        if (isValidXml(text)) {
          return text;
        }
      }
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }
  
  throw new Error(`Failed to fetch sitemap: ${lastError?.message || 'All fetch attempts failed'}`);
}

function isValidXml(text: string): boolean {
  return (
    text.includes('<?xml') ||
    text.includes('<urlset') ||
    text.includes('<sitemapindex')
  ) && !text.includes('<!DOCTYPE html>');
}

function parseXml(xmlText: string): any {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
  });
  
  try {
    return parser.parse(xmlText);
  } catch (error) {
    throw new Error('Invalid XML format in sitemap');
  }
}

export async function fetchSitemap(url: string): Promise<SitemapUrl[]> {
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    const xmlText = await fetchXml(url);
    
    // Check if this is a sitemap index
    if (xmlText.includes('<sitemapindex')) {
      const sitemaps = await parseSitemapIndex(xmlText);
      const allUrls: SitemapUrl[] = [];
      
      // Fetch all sitemaps in parallel with a limit of 3 concurrent requests
      const results = [];
      for (let i = 0; i < sitemaps.length; i += 3) {
        const batch = sitemaps.slice(i, i + 3);
        const batchResults = await Promise.allSettled(
          batch.map(sitemapUrl => fetchSitemap(sitemapUrl))
        );
        results.push(...batchResults);
      }
      
      // Collect successful results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allUrls.push(...result.value);
        } else {
          console.warn(`Failed to fetch sitemap ${sitemaps[index]}: ${result.reason}`);
        }
      });
      
      if (allUrls.length === 0) {
        throw new Error('No valid URLs found in any of the sitemaps');
      }
      
      return allUrls;
    }
    
    return await parseSitemapXml(xmlText);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch sitemap: ${error.message}`);
    }
    throw new Error('Failed to fetch sitemap: Unknown error occurred');
  }
}

function parseSitemapIndex(xmlText: string): string[] {
  try {
    const result = parseXml(xmlText);

    if (!result?.sitemapindex?.sitemap) {
      throw new Error('Invalid sitemap index format');
    }

    const sitemaps = Array.isArray(result.sitemapindex.sitemap)
      ? result.sitemapindex.sitemap
      : [result.sitemapindex.sitemap];

    const urls = sitemaps
      .map((sitemap: any) => sitemap.loc)
      .filter((url: string | undefined): url is string => Boolean(url && url.trim()));

    if (urls.length === 0) {
      throw new Error('No valid sitemaps found in sitemap index');
    }

    return urls;
  } catch (error) {
    throw new Error('Invalid sitemap index format');
  }
}

function parseSitemapXml(xmlText: string): SitemapUrl[] {
  try {
    const result = parseXml(xmlText);

    if (!result?.urlset?.url) {
      throw new Error('Invalid sitemap format');
    }

    // Handle both single URL and multiple URLs
    const urlArray = Array.isArray(result.urlset.url) 
      ? result.urlset.url 
      : [result.urlset.url];

    const urls: SitemapUrl[] = urlArray
      .map((urlData: any) => ({
        loc: urlData.loc || '',
        lastmod: urlData.lastmod,
        changefreq: urlData.changefreq,
        priority: urlData.priority,
      }))
      .filter(url => url.loc && url.loc.trim() !== '');

    if (urls.length === 0) {
      throw new Error('No valid URLs found in sitemap');
    }

    return urls;
  } catch (error) {
    throw new Error('Invalid sitemap format');
  }
}