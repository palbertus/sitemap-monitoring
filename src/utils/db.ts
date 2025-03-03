import { supabase } from './supabase';
import { Monitor, SitemapUrl } from '../types';

export async function createMonitor(url: string, checkInterval: number = 1440): Promise<Monitor> {
  const user = supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');

  const { data, error } = await supabase
    .from('monitors')
    .insert([
      { 
        url, 
        check_interval: checkInterval,
        user_id: (await user).data.user?.id 
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return transformMonitor(data);
}

export async function updateMonitor(id: string, updates: Partial<Monitor>): Promise<void> {
  const { error } = await supabase
    .from('monitors')
    .update({
      url: updates.url,
      enabled: updates.enabled,
      check_interval: updates.checkInterval,
      last_check: updates.lastCheck
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteMonitor(id: string): Promise<void> {
  const { error } = await supabase
    .from('monitors')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getMonitors(): Promise<Monitor[]> {
  const { data, error } = await supabase
    .from('monitors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformMonitor);
}

export async function saveSnapshot(monitorId: string, urls: SitemapUrl[]): Promise<void> {
  const { error } = await supabase
    .from('url_snapshots')
    .insert([
      { monitor_id: monitorId, urls }
    ]);

  if (error) throw error;
}

export async function getLatestSnapshot(monitorId: string): Promise<SitemapUrl[] | null> {
  try {
    const { data, error } = await supabase
      .from('url_snapshots')
      .select('urls')
      .eq('monitor_id', monitorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.urls || null;
  } catch (error) {
    console.error('Error fetching latest snapshot:', error);
    return null;
  }
}

function transformMonitor(data: any): Monitor {
  return {
    id: data.id,
    url: data.url,
    enabled: data.enabled,
    checkInterval: data.check_interval,
    lastCheck: data.last_check,
    createdAt: data.created_at,
    userId: data.user_id
  };
}