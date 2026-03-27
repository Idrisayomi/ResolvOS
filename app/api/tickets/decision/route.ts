import { createClient } from '@supabase/supabase-js';
import { hasCustomerServiceAgentRole } from '@/lib/authz';

type DecisionPayload = {
  ticketId?: string;
  decision?: 'approve' | 'reject';
};

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return Response.json({ error: 'Missing access token.' }, { status: 401 });
  }

  // Create a Supabase client authenticated as the agent.
  // This is the fix for the 404 — the default supabase client uses the anon key
  // and can't see tickets behind RLS. We must pass the agent's token so RLS
  // recognises their customer_service_agent role.
  const authedSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: userData, error: userError } = await authedSupabase.auth.getUser(token);
  const user = userData.user;

  if (userError || !user) {
    return Response.json({ error: 'Invalid session.' }, { status: 401 });
  }

  if (!hasCustomerServiceAgentRole(user)) {
    return Response.json({ error: 'Forbidden: agent role required.' }, { status: 403 });
  }

  const body = (await req.json()) as DecisionPayload;
  const ticketId = body.ticketId?.trim();
  const decision = body.decision;

  if (!ticketId || (decision !== 'approve' && decision !== 'reject')) {
    return Response.json({ error: 'Invalid request payload.' }, { status: 400 });
  }

  const { data: ticketRow, error: ticketError } = await authedSupabase
    .from('tickets')
    .select('id, ai_summary')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticketRow) {
    return Response.json({ error: 'Ticket not found.' }, { status: 404 });
  }

  const summaryPrefix =
    decision === 'approve'
      ? '[Human Decision] Refund approved.'
      : '[Human Decision] Refund rejected.';
  const currentSummary =
    typeof ticketRow.ai_summary === 'string' ? ticketRow.ai_summary : '';
  const nextSummary = currentSummary
    ? `${summaryPrefix}\n${currentSummary}`
    : summaryPrefix;

  const { error: updateError } = await authedSupabase
  .from('tickets')
  .update({
    status: decision === 'approve' ? 'Resolved' : 'Rejected by Human',
    assigned_to: 'Human_Staff',
    ai_summary: nextSummary,
  })
  .eq('id', ticketId);

  if (updateError) {
    return Response.json(
      { error: `Failed to update ticket: ${updateError.message}` },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}