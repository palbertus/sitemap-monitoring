import { supabase } from './supabase';
import { SitemapUrl } from '../types';

interface Changes {
  added: SitemapUrl[];
  modified: SitemapUrl[];
  removed: SitemapUrl[];
}

export async function sendChangeNotification(changes: Changes, siteUrl: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    const { added, modified, removed } = changes;
    
    const changesList = [
      added.length > 0 ? `${added.length} new URLs added` : '',
      modified.length > 0 ? `${modified.length} URLs modified` : '',
      removed.length > 0 ? `${removed.length} URLs removed` : ''
    ].filter(Boolean).join(', ');

    const emailContent = `
      <h2>Sitemap Changes Detected</h2>
      <p>Changes were detected in the sitemap for ${siteUrl}:</p>
      <ul>
        ${added.length > 0 ? `<li>Added URLs: ${added.length}</li>` : ''}
        ${modified.length > 0 ? `<li>Modified URLs: ${modified.length}</li>` : ''}
        ${removed.length > 0 ? `<li>Removed URLs: ${removed.length}</li>` : ''}
      </ul>
      <p>Visit the dashboard to see detailed changes.</p>
    `;

    // For now, we'll just log the notification since email functionality isn't set up
    console.log('Changes detected - Email would be sent:', {
      to: user.email,
      subject: `Sitemap Changes Detected - ${new URL(siteUrl).hostname}`,
      content: emailContent
    });

    // Return true to indicate notification was handled
    return true;
  } catch (error) {
    console.warn('Email notification not sent - email service not configured');
    return false;
  }
}