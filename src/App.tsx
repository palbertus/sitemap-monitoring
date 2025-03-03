import React, { useState, useEffect } from 'react';
import { SitemapForm } from './components/SitemapForm';
import { UrlList } from './components/UrlList';
import { Console } from './components/Console';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { supabase } from './utils/supabase';
import { Monitor } from './types';
import { getMonitors } from './utils/db';

function App() {
  const [session, setSession] = useState(supabase.auth.getSession());
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadMonitors();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadMonitors();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadMonitors = async () => {
    try {
      setIsLoading(true);
      const data = await getMonitors();
      setMonitors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitors');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <Auth onAuthSuccess={() => {}} />
        </main>
        <Footer />
      </div>
    );
  }

  return <Dashboard monitors={monitors} onMonitorsChange={loadMonitors} />;
}

export default App