import React from 'react';
import { SitemapUrl } from '../types';
import { Calendar, Clock, Target, RefreshCw, Loader } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UrlListProps {
  urls: SitemapUrl[];
  previousUrls?: SitemapUrl[];
  lastChecked: Date;
  isVisible: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function UrlList({ urls, previousUrls, lastChecked, isVisible, isRefreshing, onRefresh }: UrlListProps) {
  if (!isVisible) return null;

  const getUrlStatus = (url: SitemapUrl) => {
    if (!previousUrls) return 'new';
    
    const previousUrl = previousUrls.find(p => p.loc === url.loc);
    if (!previousUrl) return 'added';
    if (previousUrl.lastmod !== url.lastmod) return 'modified';
    return 'unchanged';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-green-600 bg-green-100';
      case 'modified': return 'text-yellow-600 bg-yellow-100';
      case 'new': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRemovedUrls = () => {
    if (!previousUrls) return [];
    return previousUrls.filter(prevUrl => 
      !urls.some(url => url.loc === prevUrl.loc)
    );
  };

  const removedUrls = getRemovedUrls();

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Monitored URLs ({urls.length})</h2>
          <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
            <Clock className="w-4 h-4" />
            Last checked: {formatDistanceToNow(lastChecked, { addSuffix: true })}
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshing ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {urls.map((url, index) => {
            const status = getUrlStatus(url);
            return (
              <div key={index} className={`p-4 hover:bg-gray-50 ${
                status === 'modified' ? 'bg-yellow-50' : 
                status === 'added' ? 'bg-green-50' : ''
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <a 
                    href={url.loc} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {url.loc}
                  </a>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
                <div className="flex gap-6 text-sm text-gray-600">
                  {url.lastmod && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Last modified: {new Date(url.lastmod).toLocaleDateString()}
                    </div>
                  )}
                  {url.priority && (
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Priority: {url.priority}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {removedUrls.length > 0 && (
            <div className="p-4 bg-red-50">
              <h3 className="font-medium text-red-800 mb-2">Removed URLs</h3>
              {removedUrls.map((url, index) => (
                <div key={`removed-${index}`} className="text-red-600 line-through mb-2">
                  {url.loc}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}