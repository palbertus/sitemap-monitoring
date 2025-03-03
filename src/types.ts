export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface SitemapData {
  urls: SitemapUrl[];
  lastChecked: Date;
  previousUrls?: SitemapUrl[];
}

export interface Monitor {
  id: string;
  url: string;
  enabled: boolean;
  checkInterval: number;
  lastCheck: string;
  createdAt: string;
  userId: string;
}

export interface UrlSnapshot {
  id: string;
  monitorId: string;
  urls: SitemapUrl[];
  createdAt: string;
}

export interface StoredData {
  sitemapData: SitemapData;
  config: MonitoringConfig;
}

export interface MonitoringConfig {
  url: string;
  enabled: boolean;
  lastCheck: string;
  checkInterval: number;
}