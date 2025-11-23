import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, frequency, minConfidence, signalTypes, audience = 'analyst', companyFilters, sourceFilters, customMonitorUrls } = await req.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'email is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify the email belongs to the authenticated user or their subscription
    const { data: subscription, error: subError } = await supabase
      .from('report_subscriptions')
      .select('email, user_id')
      .eq('user_id', user.id)
      .eq('email', email)
      .maybeSingle();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Email does not belong to authenticated user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate frequency
    const allowedFrequencies = ['daily', 'weekly', 'monthly'];
    if (!frequency || !allowedFrequencies.includes(frequency)) {
      return new Response(
        JSON.stringify({ error: `frequency must be one of: ${allowedFrequencies.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate audience
    const allowedAudiences = ['executive', 'technical', 'analyst'];
    if (audience && !allowedAudiences.includes(audience)) {
      return new Response(
        JSON.stringify({ error: `audience must be one of: ${allowedAudiences.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate minConfidence
    if (minConfidence !== undefined && (typeof minConfidence !== 'number' || minConfidence < 0 || minConfidence > 1)) {
      return new Response(
        JSON.stringify({ error: 'minConfidence must be a number between 0 and 1' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (frequency === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (frequency === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (frequency === 'monthly') {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Fetch signals (only for the authenticated user)
    let query = supabase
      .from('signals')
      .select('*')
      .eq('user_id', user.id)
      .gte('detected_at', startDate.toISOString())
      .gte('confidence_score', minConfidence || 0.5)
      .order('confidence_score', { ascending: false });

    if (signalTypes && signalTypes.length > 0) {
      query = query.in('signal_type', signalTypes);
    }

    if (sourceFilters && sourceFilters.length > 0) {
      query = query.in('source_type', sourceFilters);
    }

    const { data: allSignals, error } = await query;
    if (error) throw error;

    // Filter by company if specified
    let signals = allSignals || [];
    if (companyFilters && companyFilters.length > 0) {
      signals = signals.filter(signal => {
        const companyLower = signal.company_name?.toLowerCase() || '';
        const tickerLower = signal.company_ticker?.toLowerCase() || '';
        return companyFilters.some((filter: string) => {
          const filterLower = filter.toLowerCase();
          return companyLower.includes(filterLower) || 
                 tickerLower === filterLower ||
                 filterLower.includes(companyLower);
        });
      });
    }

    // Filter by custom URLs if specified
    if (customMonitorUrls && customMonitorUrls.length > 0) {
      signals = signals.filter(signal => {
        return customMonitorUrls.some((customUrl: string) => {
          try {
            const signalUrl = new URL(signal.source_url);
            const monitorUrl = new URL(customUrl);
            return signalUrl.hostname === monitorUrl.hostname;
          } catch {
            return false;
          }
        });
      });
    }

    console.log(`Found ${signals?.length || 0} signals for ${audience} report`);

    // Group by company
    const signalsByCompany: { [key: string]: any[] } = {};
    signals?.forEach(signal => {
      if (!signalsByCompany[signal.company_name]) {
        signalsByCompany[signal.company_name] = [];
      }
      signalsByCompany[signal.company_name].push(signal);
    });

    let subjectLine = '';
    let emailHtml = '';

    // Executive format - concise, business-focused
    if (audience === 'executive') {
      subjectLine = `Executive Brief: ${signals?.length || 0} Market Transformation Signals`;
      
      const companiesHtml = Object.entries(signalsByCompany).slice(0, 5).map(([company, companySignals]) => {
        const highestConfidence = Math.max(...companySignals.map(s => s.confidence_score));
        const signalTypes = [...new Set(companySignals.map(s => s.signal_type))];
        
        return `
          <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">${company}</h3>
            <div style="display: flex; gap: 10px; margin-bottom: 8px;">
              <span style="background: ${highestConfidence >= 0.8 ? '#22c55e' : '#eab308'}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600;">
                ${(highestConfidence * 100).toFixed(0)}% Confidence
              </span>
              <span style="color: #64748b; font-size: 13px; font-weight: 600;">
                ${companySignals.length} Signal${companySignals.length > 1 ? 's' : ''}
              </span>
            </div>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #475569;">
              <strong>Activity:</strong> ${signalTypes.map(t => t.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')).join(', ')}
            </p>
          </div>
        `;
      }).join('');

      emailHtml = `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; max-width: 700px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📊 Executive Market Intelligence Brief</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${frequency.charAt(0).toUpperCase() + frequency.slice(1)} | ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #1e40af;">Key Insights</h2>
                <p style="margin: 0; font-size: 14px; color: #1e293b;"><strong>${Object.keys(signalsByCompany).length}</strong> companies | <strong>${signals?.length || 0}</strong> signals</p>
              </div>
              ${signals && signals.length > 0 ? `<h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1e293b;">Priority Opportunities</h2>${companiesHtml}` : `<div style="text-align: center; padding: 30px; background: #f8fafc; border-radius: 6px;"><p style="color: #64748b; margin: 0;">No significant signals detected.</p></div>`}
              <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;"><p style="margin: 0;">Confidential - For Internal Use Only</p></div>
            </div>
          </body>
        </html>
      `;
    } else if (audience === 'technical') {
      // Technical format
      subjectLine = `Technical Report: ${signals?.length || 0} Signals`;
      
      const companiesHtml = Object.entries(signalsByCompany).map(([company, companySignals]) => `
        <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; padding: 10px; font-family: monospace; font-size: 12px;">
          <strong>${company}</strong><br>
          ${companySignals.map(signal => `
            <div style="margin: 8px 0; padding: 8px; background: #f8fafc;">
              Type: ${signal.signal_type} | Conf: ${signal.confidence_score}<br>
              Keywords: [${signal.keywords?.join(', ')}]<br>
              <a href="${signal.source_url}" style="font-size: 10px; word-break: break-all;">Source</a>
            </div>
          `).join('')}
        </div>
      `).join('');

      emailHtml = `<!DOCTYPE html><html><body style="font-family: monospace; padding: 20px; max-width: 900px; margin: 0 auto;"><h1>[TECHNICAL] Report</h1><p>Signals: ${signals?.length || 0}</p>${companiesHtml}</body></html>`;
    } else {
      // Analyst format (default)
      subjectLine = `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Analysis: ${signals?.length || 0} Signals`;
      
      const companiesHtml = Object.entries(signalsByCompany).map(([company, companySignals]) => `
        <div style="margin-bottom: 25px; border-left: 4px solid #3b82f6; padding-left: 15px;">
          <h3 style="margin: 0 0 12px 0; color: #1e293b;">${company}</h3>
          ${companySignals.map(signal => `
            <div style="margin-bottom: 12px; padding: 10px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
              <div style="display: flex; gap: 8px; margin-bottom: 6px;">
                <span style="background: #3b82f6; color: white; padding: 3px 6px; border-radius: 3px; font-size: 11px;">${signal.signal_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                <span style="background: ${signal.confidence_score >= 0.8 ? '#22c55e' : '#eab308'}; color: white; padding: 3px 6px; border-radius: 3px; font-size: 11px;">${(signal.confidence_score * 100).toFixed(0)}%</span>
              </div>
              <div style="font-size: 13px;"><strong>Keywords:</strong> ${signal.keywords?.join(', ')}</div>
              <div style="font-size: 11px; color: #64748b;">${signal.source_type} | ${new Date(signal.detected_at).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      `).join('');

      emailHtml = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0;">🎯 Transformation Signals Analysis</h1>
              <p style="margin: 10px 0 0;">${frequency.charAt(0).toUpperCase() + frequency.slice(1)} | ${new Date().toLocaleDateString()}</p>
            </div>
            <div style="background: white; padding: 30px;">
              <p><strong>${signals?.length || 0}</strong> signals across <strong>${Object.keys(signalsByCompany).length}</strong> companies</p>
              ${signals && signals.length > 0 ? companiesHtml : '<p>No signals detected.</p>'}
            </div>
          </body>
        </html>
      `;
    }

    // Send email
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Transformation Signals <onboarding@resend.dev>',
        to: [email],
        subject: subjectLine,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();

    // Update last_sent_at - SECURITY: Filter by user_id to prevent unauthorized updates
    await supabase
      .from('report_subscriptions')
      .update({ last_sent_at: now.toISOString() })
      .eq('user_id', user.id)
      .eq('email', email)
      .eq('frequency', frequency);

    return new Response(
      JSON.stringify({ success: true, signalsCount: signals?.length || 0, emailId: emailResult.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
