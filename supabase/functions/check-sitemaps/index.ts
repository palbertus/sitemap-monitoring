import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get monitors that need checking
    const { data: monitors, error: monitorsError } = await supabaseClient
      .from('monitors')
      .select('*')
      .eq('enabled', true)
      .lte('next_check', new Date().toISOString())
      .order('next_check')
      .limit(10) // Process in batches

    if (monitorsError) throw monitorsError

    const results = []
    for (const monitor of monitors) {
      try {
        // Fetch sitemap
        const response = await fetch(monitor.url)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const xmlText = await response.text()

        // Get previous snapshot
        const { data: snapshots } = await supabaseClient
          .from('url_snapshots')
          .select('urls')
          .eq('monitor_id', monitor.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Parse and compare URLs
        const newUrls = parseXml(xmlText)
        const changes = detectChanges(snapshots?.urls || [], newUrls)

        // Save new snapshot if there are changes
        if (hasChanges(changes)) {
          await supabaseClient
            .from('url_snapshots')
            .insert([{ monitor_id: monitor.id, urls: newUrls }])

          // Send notification if configured
          const { data: { user } } = await supabaseClient.auth.admin.getUserById(monitor.user_id)
          if (user?.email) {
            // Send email notification (implement your email sending logic here)
            console.log(`Would send email to ${user.email} about changes in ${monitor.url}`)
          }
        }

        // Update monitor's last_check and next_check
        const nextCheck = new Date(Date.now() + monitor.check_interval * 60000)
        await supabaseClient
          .from('monitors')
          .update({ 
            last_check: new Date().toISOString(),
            next_check: nextCheck.toISOString()
          })
          .eq('id', monitor.id)

        results.push({ 
          monitor: monitor.url, 
          status: 'success',
          changes: hasChanges(changes)
        })
      } catch (error) {
        results.push({ 
          monitor: monitor.url, 
          status: 'error',
          error: error.message 
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Helper functions
function parseXml(xmlText: string) {
  // Implement XML parsing logic here
  // This should match your frontend implementation
  return [] // Placeholder
}

function detectChanges(oldUrls: any[], newUrls: any[]) {
  const added = []
  const modified = []
  const removed = []
  
  // Implement change detection logic here
  // This should match your frontend implementation
  
  return { added, modified, removed }
}

function hasChanges(changes: { added: any[], modified: any[], removed: any[] }) {
  return changes.added.length > 0 || 
         changes.modified.length > 0 || 
         changes.removed.length > 0
}