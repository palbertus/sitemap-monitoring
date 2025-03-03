import { StoredData, MonitoringConfig } from '../types';

const STORAGE_KEY = 'sitemap_monitor_data';

export function saveToStorage(data: StoredData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to storage:', error);
  }
}

export function loadFromStorage(): StoredData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      sitemapData: {
        ...parsed.sitemapData,
        lastChecked: new Date(parsed.sitemapData.lastChecked)
      }
    };
  } catch (error) {
    console.error('Failed to load data from storage:', error);
    return null;
  }
}

export function getDefaultConfig(): MonitoringConfig {
  return {
    url: '',
    enabled: false,
    lastCheck: new Date().toISOString(),
    checkInterval: 1440 // 24 hours in minutes
  };
}