import React, { useState } from 'react';
import { Monitor, SitemapData, SitemapUrl } from '../types';
import { Header } from './Header';
import { Footer } from './Footer';
import { SitemapForm } from './SitemapForm';
import { UrlList } from './UrlList';
import { Console } from './Console';
import { LoadingBar } from './LoadingBar';
import { fetchSitemap } from '../utils/sitemap';
import { createMonitor, updateMonitor, deleteMonitor, getLatestSnapshot, saveSnapshot } from '../utils/db';
import { sendChangeNotification } from '../utils/email';
import { supabase } from '../utils/supabase';
import { Activity, Plus, Clock, Trash2, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardProps {
  monitors: Monitor[];
  onMonitorsChange: () => void;
}

export function Dashboard({ monitors, onMonitorsChange }: DashboardProps) {
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [sitemapData, setSitemapData] = useState<SitemapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'console'>('list');
  const [showNewMonitorForm, setShowNewMonitorForm] = useState(false);
  const [processLog, setProcessLog] = useState<string[]>([]);
  const [monitorToDelete, setMonitorToDelete] = useState<Monitor | null>(null);

  const addProcessLog = (message: string) => {
    setProcessLog(prev => [...prev, message]);
  };

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  const detectChanges = (oldUrls: SitemapUrl[], newUrls: SitemapUrl[]) => {
    const oldMap = new Map(oldUrls.map(u => [u.loc, u]));
    const newMap = new Map(newUrls.map(u => [u.loc, u]));
    
    const added: SitemapUrl[] = [];
    const modified: SitemapUrl[] = [];
    const removed: SitemapUrl[] = [];

    newUrls.forEach(url => {
      const oldUrl = oldMap.get(url.loc);
      if (!oldUrl) {
        added.push(url);
      } else if (oldUrl.lastmod !== url.lastmod) {
        modified.push(url);
      }
    });

    oldUrls.forEach(url => {
      if (!newMap.has(url.loc)) {
        removed.push(url);
      }
    });

    return { added, modified, removed };
  };

  const handleCreateMonitor = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await createMonitor(url);
      setShowNewMonitorForm(false);
      onMonitorsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monitor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMonitor = async (monitor: Monitor) => {
    try {
      setIsLoading(true);
      setError(null);
      await deleteMonitor(monitor.id);
      if (selectedMonitor?.id === monitor.id) {
        setSelectedMonitor(null);
        setSitemapData(null);
      }
      onMonitorsChange();
      setMonitorToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete monitor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonitorSelect = async (monitor: Monitor) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedMonitor(monitor);
      setProcessLog([]); // Clear previous logs
      await refreshMonitor(monitor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sitemap');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMonitor = async (monitor: Monitor) => {
    try {
      setIsLoading(true);
      setError(null);
      setProcessLog([]); // Clear previous logs

      addProcessLog(`Starting refresh for ${monitor.url}`);
      addProcessLog('Fetching current sitemap...');

      const newUrls = await fetchSitemap(monitor.url);
      addProcessLog(`Found ${newUrls.length} URLs in sitemap`);

      addProcessLog('Retrieving previous snapshot...');
      const previousUrls = await getLatestSnapshot(monitor.id);
      
      if (previousUrls) {
        addProcessLog('Comparing with previous snapshot...');
        const changes = detectChanges(previousUrls, newUrls);
        
        const changeLog = [
          changes.added.length > 0 ? `${changes.added.length} URLs added` : '',
          changes.modified.length > 0 ? `${changes.modified.length} URLs modified` : '',
          changes.removed.length > 0 ? `${changes.removed.length} URLs removed` : ''
        ].filter(Boolean);

        if (changeLog.length > 0) {
          addProcessLog(`Changes detected: ${changeLog.join(', ')}`);
          addProcessLog('Processing notification...');
          const notificationSent = await sendChangeNotification(changes, monitor.url);
          if (notificationSent) {
            addProcessLog('Change notification processed');
          } else {
            addProcessLog('Note: Email notifications are not configured');
          }
        } else {
          addProcessLog('No changes detected');
        }
      } else {
        addProcessLog('No previous snapshot found, this is the first check');
      }

      addProcessLog('Saving new snapshot...');
      await saveSnapshot(monitor.id, newUrls);

      setSitemapData({
        urls: newUrls,
        lastChecked: new Date(),
        previousUrls: previousUrls || []
      });

      addProcessLog('Updating monitor status...');
      await updateMonitor(monitor.id, { lastCheck: new Date().toISOString() });
      onMonitorsChange();

      addProcessLog('Refresh completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh monitor';
      setError(errorMessage);
      addProcessLog(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMonitorStatus = async (monitor: Monitor) => {
    try {
      await updateMonitor(monitor.id, { enabled: !monitor.enabled });
      onMonitorsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update monitor');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LoadingBar isLoading={isLoading} />
      <Header 
        logo={<Activity className="w-6 h-6" />}
        onSignOut={handleSignOut}
      />

      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Your Monitors</h2>
            <button
              onClick={() => setShowNewMonitorForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Monitor
            </button>
          </div>

          {showNewMonitorForm && (
            <div className="mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">Add New Monitor</h3>
                <SitemapForm onSubmit={handleCreateMonitor} isLoading={isLoading} />
              </div>
            </div>
          )}

          {error && (
            <div className="mb-8 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {monitorToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4 text-red-600">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  <h3 className="text-lg font-medium">Confirm Deletion</h3>
                </div>
                <p className="mb-6 text-gray-600">
                  Are you sure you want to delete the monitor for <span className="font-medium">{monitorToDelete.url}</span>? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setMonitorToDelete(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteMonitor(monitorToDelete)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Delete Monitor
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {monitors.map((monitor) => (
              <div
                key={monitor.id}
                className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate" title={monitor.url}>
                      {new URL(monitor.url).hostname}
                    </h3>
                    <button
                      onClick={() => toggleMonitorStatus(monitor)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        monitor.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {monitor.enabled ? 'Active' : 'Paused'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 truncate mb-4" title={monitor.url}>
                    {monitor.url}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="w-4 h-4 mr-2" />
                    Last check: {formatDistanceToNow(new Date(monitor.lastCheck), { addSuffix: true })}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMonitorSelect(monitor)}
                      className="flex-grow inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setMonitorToDelete(monitor)}
                      className="inline-flex items-center justify-center p-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                      title="Delete Monitor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedMonitor && sitemapData && (
            <div className="mt-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium">Monitor Details</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 rounded-md ${
                        viewMode === 'list'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      List View
                    </button>
                    <button
                      onClick={() => setViewMode('console')}
                      className={`px-4 py-2 rounded-md ${
                        viewMode === 'console'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Console View
                    </button>
                  </div>
                </div>
                
                <UrlList
                  urls={sitemapData.urls}
                  previousUrls={sitemapData.previousUrls}
                  lastChecked={sitemapData.lastChecked}
                  isVisible={viewMode === 'list'}
                  isRefreshing={isLoading}
                  onRefresh={() => selectedMonitor && refreshMonitor(selectedMonitor)}
                />
                
                <Console
                  urls={sitemapData.urls}
                  isVisible={viewMode === 'console'}
                  isRefreshing={isLoading}
                  processLog={processLog}
                  onRefresh={() => selectedMonitor && refreshMonitor(selectedMonitor)}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}