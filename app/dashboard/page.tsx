'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hasCustomerServiceAgentRole } from '@/lib/authz';

// ─── Types ─────────────────────────────────────────────────────────────────
type Ticket = {
  id: string;
  status: string;
  ai_summary: string | null;
  assigned_to: string | null;
  order_id: string | null;
  user_id: string | null;
  created_at?: string;
};

type Order = {
  id: string;
  price: number | null;
  item_name?: string | null;
};

type TicketWithOrder = Ticket & {
  orderPrice: number | null;
  itemName: string | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatTime(ts?: string) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateFull(ts?: string) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function parseAISummary(summary: string | null) {
  if (!summary) return { tag: 'UNKNOWN', body: 'No summary available.' };
  const match = summary.match(/^\[([^\]]+)\]:\s*(.*)/s);
  if (match) return { tag: match[1].trim(), body: match[2].trim() };
  const hdMatch = summary.match(/^\[([^\]]+)\]\s*(.*)/s);
  if (hdMatch) return { tag: hdMatch[1].trim(), body: hdMatch[2].trim() };
  return { tag: 'LOG', body: summary };
}

// ─── Refund Slip Generator (agent-side) ─────────────────────────────────────
function generateSlipHTML(ticket: TicketWithOrder) {
  const refundRef = `RFD-${ticket.id.replace('T-', '')}${Math.floor(10 + Math.random() * 89)}`;
  const isAI = ticket.assigned_to === 'AI_Agent';
  const resolvedBy = isAI ? 'AI Auto-Approved' : 'Agent Approved';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Refund Receipt — ${refundRef}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; color: #1e293b; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
  .slip { background: white; border-radius: 16px; max-width: 520px; width: 100%; box-shadow: 0 4px 60px rgba(0,0,0,0.08); overflow: hidden; }
  .slip-header { background: linear-gradient(135deg, #064e3b, #065f46); padding: 32px 36px; position: relative; overflow: hidden; }
  .slip-header::after { content: ''; position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.04); }
  .logo { font-size: 18px; font-weight: 800; color: white; letter-spacing: -0.3px; }
  .logo span { color: #6ee7b7; }
  .status-badge { display: inline-flex; align-items: center; gap: 8px; margin-top: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50px; padding: 8px 16px; }
  .check-circle { width: 20px; height: 20px; background: #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: 800; flex-shrink: 0; }
  .status-label { font-size: 13px; font-weight: 700; color: white; }
  .ref-number { margin-top: 12px; font-size: 12px; color: #6ee7b7; font-family: 'Courier New', monospace; letter-spacing: 1px; }
  .slip-body { padding: 32px 36px; }
  .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 16px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
  .info-cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
  .info-cell .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 5px; }
  .info-cell .value { font-size: 14px; font-weight: 700; color: #1e293b; }
  .info-cell.highlight { grid-column: span 2; background: #f0fdf4; border-color: #bbf7d0; }
  .info-cell.highlight .value { color: #065f46; font-size: 22px; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  .footer { display: flex; align-items: center; justify-content: space-between; }
  .footer-left { font-size: 11px; color: #94a3b8; line-height: 1.6; }
  .watermark { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #d1fae5; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 4px 10px; }
  @media print { body { background: white; padding: 0; } .slip { box-shadow: none; } }
</style>
</head>
<body>
<div class="slip">
  <div class="slip-header">
    <div class="logo">Resolve<span>OS</span></div>
    <div class="status-badge">
      <span class="check-circle">✓</span>
      <span class="status-label">Refund Approved</span>
    </div>
    <div class="ref-number">REF: ${refundRef}</div>
  </div>
  <div class="slip-body">
    <div class="section-label">Transaction Details</div>
    <div class="info-grid">
      <div class="info-cell highlight">
        <div class="label">Refund Amount</div>
        <div class="value">${formatCurrency(ticket.orderPrice)}</div>
      </div>
      <div class="info-cell">
        <div class="label">Order ID</div>
        <div class="value">${ticket.order_id ?? '—'}</div>
      </div>
      <div class="info-cell">
        <div class="label">Customer</div>
        <div class="value">Demo Customer</div>
      </div>
      <div class="info-cell">
        <div class="label">Product</div>
        <div class="value">${ticket.itemName ?? 'Product'}</div>
      </div>
      <div class="info-cell">
        <div class="label">Date Issued</div>
        <div class="value">${formatDateFull(ticket.created_at)}</div>
      </div>
      <div class="info-cell">
        <div class="label">Resolved By</div>
        <div class="value">${resolvedBy}</div>
      </div>
    </div>
    <hr class="divider" />
    <div class="footer">
      <div class="footer-left">
        Issued by ResolvOS Operations Engine<br />
        This receipt confirms the refund has been processed.<br />
        Please allow 3–5 business days for funds to appear.
      </div>
      <div class="watermark">APPROVED</div>
    </div>
  </div>
</div>
<script>window.addEventListener('load', () => window.print());</script>
</body>
</html>`;
}

function downloadSlip(ticket: TicketWithOrder) {
  const html = generateSlipHTML(ticket);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ─── Sub-components ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  'Resolved by AI':     { label: 'Auto-Resolved',    dot: 'bg-emerald-400',             badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50' },
  'Resolved':           { label: 'Resolved',          dot: 'bg-emerald-400',             badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50' },
  'Needs Human Review': { label: 'Needs Review',      dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-900/60 text-amber-300 border-amber-700/50' },
  'Rejected by AI':     { label: 'Rejected by AI',   dot: 'bg-red-400',                 badge: 'bg-red-900/60 text-red-300 border-red-700/50' },
  'Rejected by Human':  { label: 'Rejected',         dot: 'bg-orange-400',              badge: 'bg-orange-900/60 text-orange-300 border-orange-700/50' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, dot: 'bg-slate-400', badge: 'bg-slate-800 text-slate-300 border-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border ${accent} bg-[#0f1117] p-5`}>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-3 font-mono text-4xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function TicketDetailPanel({
  ticket, onClose, onDecision, actionLoading,
}: {
  ticket: TicketWithOrder;
  onClose: () => void;
  onDecision: (id: string, d: 'approve' | 'reject') => void;
  actionLoading: 'approve' | 'reject' | null;
}) {
  const { tag, body } = parseAISummary(ticket.ai_summary);
  const isPending = ticket.status === 'Needs Human Review';
  const isAIResolved = ticket.status === 'Resolved by AI';
  const isHumanResolved = ticket.status === 'Resolved';
  const isResolved = isAIResolved || isHumanResolved;

  const tagColor =
    tag.includes('AUTO') || tag.includes('APPROVED') ? 'text-emerald-400 bg-emerald-900/40 border-emerald-700/50' :
    tag.includes('ESCALAT') ? 'text-amber-400 bg-amber-900/40 border-amber-700/50' :
    tag.includes('REJECT') ? 'text-red-400 bg-red-900/40 border-red-700/50' :
    'text-slate-400 bg-slate-800 border-slate-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700/80 bg-[#0d0f14] shadow-2xl shadow-black/60">

        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Ticket Detail</p>
            <h3 className="mt-1 font-mono text-xl font-bold text-white">{ticket.id}</h3>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={ticket.status} />
            <button onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition">✕ Close</button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Order</p>
              <p className="mt-1 font-mono text-sm font-semibold text-white">{ticket.order_id ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Item Value</p>
              <p className="mt-1 font-mono text-sm font-semibold text-white">{formatCurrency(ticket.orderPrice)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Handled By</p>
              <p className={`mt-1 font-mono text-sm font-semibold ${ticket.assigned_to === 'AI_Agent' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {ticket.assigned_to === 'AI_Agent' ? 'AI Agent' : 'Human Staff'}
              </p>
            </div>
          </div>

          {ticket.itemName && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Product</p>
              <p className="mt-1 text-sm text-white">{ticket.itemName}</p>
            </div>
          )}

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">AI Decision Log</span>
              <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-bold ${tagColor}`}>{tag}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{body}</p>
          </div>

          {ticket.created_at && (
            <p className="text-xs text-slate-600 font-mono">Logged at {formatTime(ticket.created_at)}</p>
          )}
        </div>

        {/* Action footer */}
        <div className="border-t border-slate-800 px-6 py-4">
          {isPending && (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => onDecision(ticket.id, 'reject')}
                disabled={actionLoading !== null}
                className="rounded-lg border border-red-800/60 bg-red-950/40 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-900/50 disabled:opacity-50"
              >
                {actionLoading === 'reject' ? 'Processing...' : 'Reject Refund'}
              </button>
              <button
                onClick={() => onDecision(ticket.id, 'approve')}
                disabled={actionLoading !== null}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {actionLoading === 'approve' ? 'Processing...' : 'Approve Refund'}
              </button>
            </div>
          )}

          {isAIResolved && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600 font-mono">⚡ Resolved autonomously by AI</p>
              <button
                onClick={() => downloadSlip(ticket)}
                className="flex items-center gap-2 rounded-lg bg-emerald-900/40 border border-emerald-700/50 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-800/50 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Download Refund Slip
              </button>
            </div>
          )}

          {isHumanResolved && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-600 font-mono">✓ Resolved by human agent</p>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-mono border border-slate-800 rounded-lg px-4 py-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Receipt will be emailed to customer
              </div>
            </div>
          )}

          {!isPending && !isResolved && (
            <p className="text-xs text-slate-600 font-mono">No receipt available for this ticket status.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fraud Panel ─────────────────────────────────────────────────────────────
function FraudPanel({ tickets }: { tickets: Ticket[] }) {
  const fraudData = useMemo(() => {
    const byUser: Record<string, { count: number; rejected: number; lastSeen: string }> = {};
    for (const t of tickets) {
      const uid = t.user_id ?? 'unknown';
      if (!byUser[uid]) byUser[uid] = { count: 0, rejected: 0, lastSeen: t.created_at ?? '' };
      byUser[uid].count++;
      if (t.status.includes('Rejected')) byUser[uid].rejected++;
      if ((t.created_at ?? '') > byUser[uid].lastSeen) byUser[uid].lastSeen = t.created_at ?? '';
    }
    return Object.entries(byUser)
      .map(([uid, d]) => ({
        uid,
        count: d.count,
        rejected: d.rejected,
        score: Math.min(100, d.rejected * 35 + (d.count > 2 ? (d.count - 2) * 15 : 0)),
        lastSeen: d.lastSeen,
        flagged: d.count >= 3 || d.rejected >= 1,
      }))
      .sort((a, b) => b.score - a.score);
  }, [tickets]);

  const flaggedCount = fraudData.filter(d => d.flagged).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Users Monitored', value: String(fraudData.length), color: 'text-white' },
          { label: 'Flagged Users', value: String(flaggedCount), color: 'text-amber-400' },
          { label: 'Rejection Rate', value: `${tickets.length ? Math.round((tickets.filter(t => t.status.includes('Rejected')).length / tickets.length) * 100) : 0}%`, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-800/60 bg-[#0f1117] p-4 text-center">
            <p className={`font-mono text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-800/60 bg-[#0d0f14] overflow-hidden">
        <div className="border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Refund Behavior Analysis</h3>
          {flaggedCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />{flaggedCount} flagged
            </span>
          )}
        </div>
        {fraudData.length === 0 ? (
          <div className="p-12 text-center text-slate-600 font-mono text-sm">No data yet. Refund requests from the chat will appear here.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['User ID', 'Requests', 'Rejected', 'Fraud Score', 'Last Seen', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fraudData.map((row, i) => {
                const scoreColor = row.score >= 70 ? 'text-red-400' : row.score >= 35 ? 'text-amber-400' : 'text-emerald-400';
                return (
                  <tr key={row.uid} className={`border-b border-slate-800/40 ${i % 2 === 0 ? '' : 'bg-slate-900/20'}`}>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{row.uid.slice(0, 20)}…</td>
                    <td className="px-5 py-4 font-mono text-sm font-bold text-white">{row.count}</td>
                    <td className="px-5 py-4 font-mono text-sm text-red-400">{row.rejected}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${row.score >= 70 ? 'bg-red-500' : row.score >= 35 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${row.score}%` }} />
                        </div>
                        <span className={`font-mono text-xs font-bold ${scoreColor}`}>{row.score}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{formatTime(row.lastSeen)}</td>
                    <td className="px-5 py-4">
                      {row.flagged ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-amber-900/30 px-2.5 py-1 text-xs font-semibold text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/50 bg-emerald-900/20 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Clear
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Policy Panel ────────────────────────────────────────────────────────────
function PolicyPanel() {
  const [threshold, setThreshold] = useState(50);
  const [returnWindow, setReturnWindow] = useState(30);
  const [saved, setSaved] = useState(false);
  const [policies, setPolicies] = useState({
    requireConditionCheck: true,
    blockNonReturnable: true,
    fraudFrequencyBlock: true,
    autoEscalateHighValue: true,
    requireDetailedReason: true,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const toggleKeys = [
    { key: 'requireConditionCheck' as const, label: 'Require item condition description', desc: 'AI must ask for detailed item condition before processing' },
    { key: 'blockNonReturnable' as const, label: 'Block non-returnable items', desc: 'Automatically reject refunds for items marked non-returnable' },
    { key: 'fraudFrequencyBlock' as const, label: 'Fraud frequency blocking', desc: 'Auto-flag users with 3+ refund requests in 30 days' },
    { key: 'autoEscalateHighValue' as const, label: 'Auto-escalate high-value orders', desc: 'Route orders above auto-approve limit to human review' },
    { key: 'requireDetailedReason' as const, label: 'Require detailed reason', desc: 'Reject vague or one-word refund reasons' },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="rounded-xl border border-slate-800/60 bg-[#0d0f14] p-6 space-y-7">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-4">Automation Thresholds</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Auto-Approve Limit</p>
              <p className="text-xs text-slate-500 mt-0.5">Refunds at or below this value are resolved instantly by AI</p>
            </div>
            <span className="font-mono text-xl font-bold text-emerald-400">${threshold}</span>
          </div>
          <input type="range" min={10} max={500} step={10} value={threshold} onChange={e => setThreshold(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500" />
          <div className="flex justify-between text-[10px] text-slate-600 font-mono"><span>$10</span><span>$250</span><span>$500</span></div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Return Window</p>
              <p className="text-xs text-slate-500 mt-0.5">Days after purchase within which returns are accepted</p>
            </div>
            <span className="font-mono text-xl font-bold text-blue-400">{returnWindow}d</span>
          </div>
          <input type="range" min={7} max={90} step={7} value={returnWindow} onChange={e => setReturnWindow(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500" />
          <div className="flex justify-between text-[10px] text-slate-600 font-mono"><span>7d</span><span>45d</span><span>90d</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/60 bg-[#0d0f14] p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-4 mb-4">Validation Rules</h3>
        {toggleKeys.map(p => (
          <div key={p.key} className="flex items-center justify-between py-4 border-b border-slate-800/40 last:border-0">
            <div>
              <p className="text-sm font-semibold text-white">{p.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
            </div>
            <button
              onClick={() => setPolicies(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${policies[p.key] ? 'bg-emerald-600' : 'bg-slate-700'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${policies[p.key] ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white transition">
          Save Configuration
        </button>
        {saved && <span className="text-xs text-emerald-400 font-mono animate-pulse">✓ Config saved</span>}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function HumanAgentDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ordersById, setOrdersById] = useState<Record<string, Order>>({});
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'resolved' | 'rejected' | 'fraud' | 'policy'>('all');
  const [agentEmail, setAgentEmail] = useState<string | null>(null);
  const [killSwitch, setKillSwitch] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const metrics = useMemo(() => ({
    total: tickets.length,
    autoResolved: tickets.filter(t => t.assigned_to === 'AI_Agent' && !t.status.includes('Rejected')).length,
    escalated: tickets.filter(t => t.status === 'Needs Human Review').length,
    rejected: tickets.filter(t => t.status.includes('Rejected')).length,
  }), [tickets]);

  const ticketsWithOrder: TicketWithOrder[] = useMemo(() =>
    tickets.map(t => ({
      ...t,
      orderPrice: t.order_id ? ordersById[t.order_id]?.price ?? null : null,
      itemName: t.order_id ? ordersById[t.order_id]?.item_name ?? null : null,
    })), [tickets, ordersById]);

  const filteredTickets = useMemo(() => {
    switch (activeTab) {
      case 'pending':  return ticketsWithOrder.filter(t => t.status === 'Needs Human Review');
      case 'resolved': return ticketsWithOrder.filter(t => t.status === 'Resolved by AI' || t.status === 'Resolved');
      case 'rejected': return ticketsWithOrder.filter(t => t.status.includes('Rejected'));
      default:         return ticketsWithOrder;
    }
  }, [ticketsWithOrder, activeTab]);

  const selectedTicket = useMemo(() =>
    ticketsWithOrder.find(t => t.id === selectedTicketId) ?? null,
    [ticketsWithOrder, selectedTicketId]);

  // Only load today's tickets for a fresh queue
  async function loadDashboardData() {
    setLoading(true);
    setError(null);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: ticketRows, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, status, ai_summary, assigned_to, order_id, user_id, created_at')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: false });

    if (ticketsError) { setError(`Failed to load tickets: ${ticketsError.message}`); setLoading(false); return; }

    const typedTickets = (ticketRows ?? []) as Ticket[];
    setTickets(typedTickets);

    const orderIds = Array.from(new Set(typedTickets.map(t => t.order_id).filter((id): id is string => Boolean(id))));
    if (orderIds.length === 0) { setOrdersById({}); setLoading(false); return; }

    const { data: orderRows, error: ordersError } = await supabase.from('orders').select('id, price, item_name').in('id', orderIds);
    if (ordersError) { setError(`Orders failed: ${ordersError.message}`); setLoading(false); return; }

    const mapped: Record<string, Order> = {};
    for (const o of (orderRows ?? []) as Order[]) mapped[o.id] = o;
    setOrdersById(mapped);
    setLoading(false);
  }

  // Load one new order for a newly arrived ticket
  async function fetchOrderForTicket(orderId: string) {
    if (ordersById[orderId]) return; // already cached
    const { data } = await supabase.from('orders').select('id, price, item_name').eq('id', orderId).single();
    if (data) setOrdersById(prev => ({ ...prev, [orderId]: data as Order }));
  }

  // Set up Supabase Realtime subscription
  function subscribeRealtime() {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    const channel = supabase
      .channel('tickets-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        const newTicket = payload.new as Ticket;
        setTickets(prev => [newTicket, ...prev]);
        if (newTicket.order_id) void fetchOrderForTicket(newTicket.order_id);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
        const updated = payload.new as Ticket;
        setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
      })
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });
    channelRef.current = channel;
  }

  const initializeDashboard = useCallback(async () => {
    setAuthLoading(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData.user;
    if (userError || !user || !hasCustomerServiceAgentRole(user)) {
      setIsAuthorized(false); setAuthLoading(false); setLoading(false);
      setError(!user ? 'You must be signed in as a customer service agent.' : 'Access denied. Agents only.');
      return;
    }
    setAgentEmail(user.email ?? null);
    setIsAuthorized(true);
    setAuthLoading(false);
    await loadDashboardData();
    subscribeRealtime();
  }, []);

  useEffect(() => {
    void initializeDashboard();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [initializeDashboard]);

  async function updateTicketDecision(ticketId: string, decision: 'approve' | 'reject') {
    setActionLoading(decision);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) { setError('Session expired.'); setActionLoading(null); return; }
    const response = await fetch('/api/tickets/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ ticketId, decision }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      setError(payload?.error ?? 'Failed to update ticket.');
    } else {
      setSelectedTicketId(null);
      // Realtime will update the ticket automatically — no need to reload everything
    }
    setActionLoading(null);
  }

  // ── Unauthorized state ────────────────────────────────────────────────────
  if (!authLoading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#080a0e] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full border border-red-800/60 bg-red-950/30 flex items-center justify-center">
            <span className="text-2xl">⚠</span>
          </div>
          <p className="text-sm text-red-400" style={{ fontFamily: 'var(--font-mono)' }}>{error ?? 'Access denied.'}</p>
          <a href="/agent/login" className="inline-flex rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">
            → Agent Login
          </a>
        </div>
      </div>
    );
  }

  const QUEUE_TABS = [
    { key: 'all',      label: 'All',          count: metrics.total },
    { key: 'pending',  label: 'Needs Review', count: metrics.escalated },
    { key: 'resolved', label: 'Resolved',     count: metrics.autoResolved },
    { key: 'rejected', label: 'Rejected',     count: metrics.rejected },
  ] as const;

  const NAV_TABS = [
    { key: 'queue',   label: 'Operations Queue' },
    { key: 'fraud',   label: 'Fraud Monitor' },
    { key: 'policy',  label: 'Policy Config' },
  ] as const;

  const isQueueTab = !['fraud', 'policy'].includes(activeTab);

  return (
    <div className="min-h-screen bg-[#080a0e] text-white" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>

      {/* Kill Switch Banner */}
      {killSwitch && (
        <div className="bg-red-950/80 border-b border-red-800/60 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-sm font-bold text-red-300">⚠ AUTOMATION PAUSED — New requests queuing for human review</span>
          </div>
          <button onClick={() => setKillSwitch(false)} className="text-xs text-red-400 hover:text-red-200 border border-red-800/60 rounded px-3 py-1 transition">
            Resume Automation
          </button>
        </div>
      )}

      {/* Top bar */}
      <header className="border-b border-slate-800/80 bg-[#0a0c10]/90 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="ResolvOS" className="h-8 w-8 rounded-lg object-contain" />
            <div>
              <span className="text-sm font-bold text-white">Resolve<span className="text-emerald-400">OS</span></span>
              <span className="ml-2 rounded border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 text-[10px] text-slate-500 uppercase tracking-widest">Agent Hub</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setKillSwitch(!killSwitch)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${killSwitch
                ? 'border-red-700/60 bg-red-950/40 text-red-300 hover:bg-red-900/50'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-red-800/60 hover:text-red-400'}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${killSwitch ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
              {killSwitch ? '⏸ Paused' : 'Kill Switch'}
            </button>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${realtimeConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${realtimeConnected ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              </span>
              <span className="text-xs text-slate-500">{realtimeConnected ? 'Live' : 'Connecting...'}</span>
            </div>
            {agentEmail && <span className="text-xs text-slate-600 border-l border-slate-800 pl-4">{agentEmail}</span>}
            <button
              onClick={() => supabase.auth.signOut().then(() => window.location.href = '/agent/login')}
              className="text-xs text-slate-500 hover:text-slate-300 transition border border-slate-800 rounded px-2 py-1 hover:border-slate-600"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="mx-auto max-w-7xl px-6 flex gap-1">
          {NAV_TABS.map(tab => {
            const isActive = tab.key === 'queue' ? isQueueTab : activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key === 'queue' ? 'all' : tab.key as typeof activeTab)}
                className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 -mb-px ${
                  isActive ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
                {tab.key === 'fraud' && metrics.rejected > 0 && (
                  <span className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] bg-amber-900/60 text-amber-400">{metrics.rejected}</span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {activeTab === 'fraud' ? 'Fraud Monitoring' : activeTab === 'policy' ? 'Policy Configuration' : 'Operations Dashboard'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab === 'fraud' ? 'Refund behavior analysis & suspicious activity detection' :
               activeTab === 'policy' ? 'Configure automation rules and thresholds' :
               "Today's refund queue · Updates in real time"}
            </p>
          </div>
          {isQueueTab && (
            <button onClick={() => void loadDashboardData()}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 transition">
              ↻ Reload
            </button>
          )}
        </div>

        {/* Metrics */}
        {isQueueTab && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard label="Tickets Today" value={metrics.total}       sub="current session"        accent="border-slate-700/60" />
            <MetricCard label="Auto-Resolved" value={metrics.autoResolved} sub="by AI"                 accent="border-emerald-800/60" />
            <MetricCard label="Needs Review"  value={metrics.escalated}   sub="awaiting human action"  accent="border-amber-800/60" />
            <MetricCard label="Rejected"      value={metrics.rejected}    sub="policy violations"       accent="border-red-900/60" />
          </div>
        )}

        {/* Panels */}
        {activeTab === 'fraud'  && <FraudPanel tickets={tickets} />}
        {activeTab === 'policy' && <PolicyPanel />}

        {/* Queue */}
        {isQueueTab && (
          <div className="rounded-xl border border-slate-800/80 bg-[#0d0f14] overflow-hidden">
            <div className="border-b border-slate-800 px-6 pt-5 pb-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Ticket Queue</h2>
                <div className="flex items-center gap-3">
                  {metrics.escalated > 0 && (
                    <span className="flex items-center gap-1.5 rounded-full border border-amber-700/50 bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />{metrics.escalated} pending review
                    </span>
                  )}
                  {realtimeConnected && (
                    <span className="text-[10px] font-mono text-emerald-600 border border-emerald-900/50 rounded px-2 py-0.5">⚡ Live</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {QUEUE_TABS.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 -mb-px ${
                      activeTab === tab.key ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}>
                    {tab.label}
                    <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.key ? 'bg-emerald-900/60 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {authLoading || loading ? (
              <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-slate-800/40 animate-pulse" />)}</div>
            ) : error ? (
              <div className="p-8 text-sm text-red-400 font-mono">{error}</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <p className="text-slate-600 font-mono text-sm">No tickets yet today</p>
                <p className="text-slate-700 text-xs">New requests from the customer chat will appear here in real time</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      {['Ticket ID', 'Status', 'Product', 'Value', 'AI Summary', 'Handler', 'Time'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket, i) => {
                      const { body } = parseAISummary(ticket.ai_summary);
                      const isAI = ticket.assigned_to === 'AI_Agent';
                      return (
                        <tr key={ticket.id} onClick={() => setSelectedTicketId(ticket.id)}
                          className={`cursor-pointer border-b border-slate-800/40 transition group ${i % 2 === 0 ? '' : 'bg-slate-900/20'} hover:bg-slate-800/40`}>
                          <td className="px-5 py-4 font-mono text-sm font-bold text-white group-hover:text-emerald-400 transition">{ticket.id}</td>
                          <td className="px-5 py-4"><StatusBadge status={ticket.status} /></td>
                          <td className="px-5 py-4 text-sm text-slate-400">{ticket.itemName ?? <span className="text-slate-700">—</span>}</td>
                          <td className="px-5 py-4 font-mono text-sm text-slate-300">{formatCurrency(ticket.orderPrice)}</td>
                          <td className="max-w-xs px-5 py-4 text-xs text-slate-500"><p className="line-clamp-2">{body}</p></td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-semibold ${isAI ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {isAI ? '⚡ AI' : '👤 Human'}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-600">{formatTime(ticket.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-slate-700" style={{ fontFamily: 'var(--font-mono)' }}>
          ResolvOS · All decisions logged · {killSwitch ? '🔴 Automation Paused' : '⚡ Automation Active'} · {realtimeConnected ? '🟢 Live Sync' : '⏳ Connecting'}
        </p>
      </main>

      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
          onDecision={updateTicketDecision}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}