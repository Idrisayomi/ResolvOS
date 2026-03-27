'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart, isToolUIPart } from 'ai';
import { useState } from 'react';

// ─── Refund Slip Generator ─────────────────────────────────────────────────
function generateRefundSlipHTML(slip: {
  refundRef: string;
  orderId: string;
  item: string;
  amount: string;
  customerName: string;
  date: string;
  resolvedBy: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Refund Receipt — ${slip.refundRef}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; color: #1e293b; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
  .slip { background: white; border-radius: 16px; max-width: 520px; width: 100%; box-shadow: 0 4px 60px rgba(0,0,0,0.08); overflow: hidden; }
  .slip-header { background: linear-gradient(135deg, #064e3b, #065f46); padding: 32px 36px; position: relative; overflow: hidden; }
  .slip-header::after { content: ''; position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.04); }
  .logo { font-size: 18px; font-weight: 800; color: white; letter-spacing: -0.3px; }
  .logo span { color: #6ee7b7; }
  .status-badge { display: inline-flex; align-items: center; gap: 8px; margin-top: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50px; padding: 8px 16px; }
  .check-icon { width: 20px; height: 20px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .check-icon::after { content: '✓'; color: white; font-size: 11px; font-weight: 800; }
  .status-label { font-size: 13px; font-weight: 700; color: white; letter-spacing: 0.3px; }
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
  @media print {
    body { background: white; padding: 0; }
    .slip { box-shadow: none; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<div class="slip">
  <div class="slip-header">
    <div class="logo">Resolve<span>OS</span></div>
    <div class="status-badge">
      <div class="check-icon"></div>
      <span class="status-label">Refund Approved</span>
    </div>
    <div class="ref-number">REF: ${slip.refundRef}</div>
  </div>
  <div class="slip-body">
    <div class="section-label">Transaction Details</div>
    <div class="info-grid">
      <div class="info-cell highlight">
        <div class="label">Refund Amount</div>
        <div class="value">${slip.amount}</div>
      </div>
      <div class="info-cell">
        <div class="label">Order ID</div>
        <div class="value">${slip.orderId}</div>
      </div>
      <div class="info-cell">
        <div class="label">Customer</div>
        <div class="value">${slip.customerName}</div>
      </div>
      <div class="info-cell">
        <div class="label">Product</div>
        <div class="value">${slip.item}</div>
      </div>
      <div class="info-cell">
        <div class="label">Date Issued</div>
        <div class="value">${slip.date}</div>
      </div>
      <div class="info-cell">
        <div class="label">Resolved By</div>
        <div class="value">${slip.resolvedBy}</div>
      </div>
    </div>
    <hr class="divider" />
    <div class="footer">
      <div class="footer-left">
        Issued by ResolvOS Operations Engine<br />
        This receipt confirms your refund has been processed.<br />
        Please allow 3–5 business days for funds to appear.
      </div>
      <div class="watermark">APPROVED</div>
    </div>
  </div>
</div>
<script>
  window.addEventListener('load', () => window.print());
</script>
</body>
</html>`;
}

function downloadRefundSlip(slip: Parameters<typeof generateRefundSlipHTML>[0]) {
  const html = generateRefundSlipHTML(slip);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // Fallback: direct download
    const a = document.createElement('a');
    a.href = url;
    a.download = `refund-slip-${slip.refundRef}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ─── Refund Slip Card in Chat ──────────────────────────────────────────────
function RefundSlipCard({ slip }: { slip: Parameters<typeof generateRefundSlipHTML>[0] }) {
  return (
    <div className="mt-3 rounded-2xl border border-emerald-700/40 bg-emerald-950/30 p-4 w-full max-w-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">✓</span>
        <span className="text-sm font-bold text-emerald-300">Refund Approved</span>
        <span className="ml-auto text-[10px] font-mono text-emerald-600 border border-emerald-800 rounded px-1.5 py-0.5">{slip.refundRef}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: 'Order', value: slip.orderId },
          { label: 'Item', value: slip.item },
          { label: 'Amount', value: slip.amount },
          { label: 'Date', value: slip.date },
        ].map(r => (
          <div key={r.label} className="bg-emerald-950/50 border border-emerald-900/60 rounded-lg p-2">
            <p className="text-emerald-700 uppercase tracking-wide text-[10px] font-semibold">{r.label}</p>
            <p className="text-emerald-200 font-semibold mt-0.5 truncate">{r.value}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => downloadRefundSlip(slip)}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-sm font-bold text-white transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        Download Refund Slip
      </button>
    </div>
  );
}

// ─── Main Chat Page ────────────────────────────────────────────────────────
export default function ResolvOSChat() {
  const [inputValue, setInputValue] = useState('');

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue?.trim()) return;
    sendMessage({ text: inputValue });
    setInputValue('');
  };

  return (
    <div className="flex h-screen items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>

      <div className="w-full max-w-xl flex flex-col h-[90vh] rounded-3xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/40"
        style={{ background: '#131c2e' }}>

        {/* Header */}
        <div className="border-b border-white/[0.07] px-6 py-4 flex items-center gap-3">
          <img src="/logo.png" alt="ResolvOS" className="h-9 w-9 rounded-xl object-contain shrink-0" />
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white">Customer Support</h1>
            <p className="text-xs text-slate-500">Powered by ResolvOS</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-slate-500">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-base mb-1.5">Hi! How can we help you?</p>
                <p className="text-slate-500 text-sm">Pick a topic or type your issue below.</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {[
                  'I want to return my clear phone case',
                  'My wireless headphones arrived broken',
                  "I'd like to refund my perfume order",
                ].map(s => (
                  <button
                    key={s}
                    onClick={() => setInputValue(s)}
                    className="text-sm text-left px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const textParts = m.parts.filter(isTextUIPart);
            const messageText = textParts.map(p => p.text).join('\n').trim();
            const toolParts = m.parts.filter(isToolUIPart);

            // Check for refund slip data in tool outputs
            let refundSlip: Parameters<typeof generateRefundSlipHTML>[0] | null = null;
            for (const tp of toolParts) {
              if (tp.type !== 'dynamic-tool' && !tp.type.includes('tool-')) continue;
              const toolName = tp.type === 'dynamic-tool' ? tp.toolName : tp.type.replace('tool-', '');
              if (toolName === 'process_refund' && tp.state === 'output-available') {
                const out = tp.output as { refundSlipData?: Parameters<typeof generateRefundSlipHTML>[0]; action?: string } | undefined;
                if (out?.refundSlipData && out?.action === 'auto_refunded') {
                  refundSlip = out.refundSlipData;
                }
              }
            }

            return (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {messageText && (
                  <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-white/[0.07] text-slate-200 rounded-bl-sm border border-white/[0.07]'
                  }`}>
                    {messageText}
                  </div>
                )}

                {/* AI tool status */}
                {toolParts.map(tp => {
                  const toolName = tp.type === 'dynamic-tool' ? tp.toolName : tp.type.replace('tool-', '');
                  const isRunning = ['input-streaming', 'input-available', 'approval-requested', 'approval-responded'].includes(tp.state);
                  const out = (tp.state === 'output-available' ? tp.output : undefined) as { orders?: unknown[]; action?: string; message?: string } | undefined;

                  let label = '';
                  if (isRunning) label = `Checking your account...`;
                  else if (tp.state === 'output-error') label = 'Something went wrong, please try again.';
                  else if (toolName === 'check_orders') {
                    const count = Array.isArray(out?.orders) ? out!.orders.length : 0;
                    label = `Found ${count} order${count !== 1 ? 's' : ''} on your account`;
                  } else if (toolName === 'process_refund') {
                    if (out?.action === 'auto_refunded') label = 'Refund processed successfully';
                    else if (out?.action === 'escalated') label = 'Your request has been sent to our team';
                    else label = out?.message ?? 'Request processed';
                  } else {
                    label = 'Processing...';
                  }

                  return (
                    <div key={tp.toolCallId} className="mt-2 flex items-center gap-2 text-xs text-slate-500 bg-white/[0.04] border border-white/[0.06] px-3 py-2 rounded-xl w-full max-w-[82%]">
                      {isRunning ? (
                        <svg className="w-3.5 h-3.5 animate-spin text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${tp.state === 'output-error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      )}
                      <span className={tp.state === 'output-error' ? 'text-red-400' : ''}>{label}</span>
                    </div>
                  );
                })}

                {/* Refund slip card */}
                {refundSlip && <RefundSlipCard slip={refundSlip} />}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.06] border border-white/[0.07] rounded-2xl rounded-bl-sm">
                <span className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
                <span className="text-xs text-slate-500">Reviewing your request...</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-800/50 rounded-xl p-3">
              Something went wrong. Please try again.
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.07] p-4">
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              className="flex-1 px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/40 transition-all"
              value={inputValue}
              placeholder="Type your message..."
              onChange={e => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue?.trim()}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-700 mt-2">Powered by ResolvOS · Responses are AI-generated</p>
        </div>
      </div>
    </div>
  );
}
