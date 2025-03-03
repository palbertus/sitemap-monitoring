import React from 'react';
import { SitemapUrl } from '../types';
import { Terminal, RefreshCw, Loader } from 'lucide-react';

interface ConsoleProps {
  urls: SitemapUrl[];
  isVisible: boolean;
  isRefreshing?: boolean;
  processLog?: string[];
  onRefresh?: () => void;
}

export function Console({ urls, isVisible, isRefreshing, processLog, onRefresh }: ConsoleProps) {
  if (!isVisible) return null;

  return (
    <div className="w-full max-w-4xl mt-8 bg-gray-900 rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-mono text-gray-300">Sitemap Monitor Console</span>
        </div>
        <div className="flex items-center gap-4">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1 rounded text-sm font-mono text-gray-300 hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isRefreshing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
          <span className="text-xs font-mono text-gray-400">{urls.length} URLs found</span>
        </div>
      </div>
      <div className="p-4 overflow-auto max-h-[600px] font-mono text-sm">
        {processLog && processLog.length > 0 && (
          <div className="mb-4 border-b border-gray-700 pb-4">
            {processLog.map((log, index) => (
              <div key={index} className="text-gray-300 mb-1">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
            {isRefreshing && (
              <div className="text-gray-300 mb-1">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                <span className="text-blue-400">Processing...</span>
              </div>
            )}
          </div>
        )}
        <div>
          {urls.map((url, index) => (
            <div key={index} className="mb-4">
              <span className="text-blue-400">{index + 1}. {url.loc}</span>
              {url.lastmod && (
                <span className="block ml-4 text-gray-500">lastmod: {url.lastmod}</span>
              )}
              {url.changefreq && (
                <span className="block ml-4 text-gray-500">changefreq: {url.changefreq}</span>
              )}
              {url.priority && (
                <span className="block ml-4 text-gray-500">priority: {url.priority}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}