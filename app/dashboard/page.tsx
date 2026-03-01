'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Ticket = {
  id: string;
  status: string;
  ai_summary: string | null;
  assigned_to: string | null;
  order_id: string | null;
};

type Order = {
  id: string;
  price: number | null;
};

type TicketWithOrder = Ticket & {
  orderPrice: number | null;
};

function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function TicketIcon() {
  return (
    <IconBase>
      <path d="M2 9a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v3a2 2 0 1 0 0 4v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
      <path d="M13 5v4" />
    </IconBase>
  );
}

function AlertIcon() {
  return (
    <IconBase>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </IconBase>
  );
}

function SparklesIcon() {
  return (
    <IconBase>
      <path d="m12 3 1.9 3.9L18 9l-4.1 2.1L12 15l-1.9-3.9L6 9l4.1-2.1z" />
      <path d="M5 3v3" />
      <path d="M19 18v3" />
      <path d="M3 5h3" />
      <path d="M18 19h3" />
    </IconBase>
  );
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export default function HumanAgentDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ordersById, setOrdersById] = useState<Record<string, Order>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const pendingCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'Needs Human Review').length,
    [tickets],
  );

  const autoResolvedCount = useMemo(
    () => tickets.filter((ticket) => ticket.assigned_to === 'AI_Agent').length,
    [tickets],
  );

  const ticketsWithOrder: TicketWithOrder[] = useMemo(
    () =>
      tickets.map((ticket) => ({
        ...ticket,
        orderPrice: ticket.order_id ? ordersById[ticket.order_id]?.price ?? null : null,
      })),
    [tickets, ordersById],
  );

  const selectedTicket = useMemo(
    () => ticketsWithOrder.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [ticketsWithOrder, selectedTicketId],
  );

  async function loadDashboardData() {
    setLoading(true);
    setError(null);

    const { data: ticketRows, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, status, ai_summary, assigned_to, order_id')
      .order('id', { ascending: false });

    if (ticketsError) {
      setError(`Failed to load tickets: ${ticketsError.message}`);
      setLoading(false);
      return;
    }

    const typedTickets = (ticketRows ?? []) as Ticket[];
    setTickets(typedTickets);

    const orderIds = Array.from(
      new Set(typedTickets.map((ticket) => ticket.order_id).filter((id): id is string => Boolean(id))),
    );

    if (orderIds.length === 0) {
      setOrdersById({});
      setLoading(false);
      return;
    }

    const { data: orderRows, error: ordersError } = await supabase
      .from('orders')
      .select('id, price')
      .in('id', orderIds);

    if (ordersError) {
      setError(`Tickets loaded, but order prices failed: ${ordersError.message}`);
      setOrdersById({});
      setLoading(false);
      return;
    }

    const mappedOrders: Record<string, Order> = {};
    for (const order of (orderRows ?? []) as Order[]) {
      mappedOrders[order.id] = order;
    }

    setOrdersById(mappedOrders);
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboardData();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  async function updateTicketDecision(ticketId: string, decision: 'approve' | 'reject') {
    setActionLoading(true);
    setError(null);

    const summaryPrefix =
      decision === 'approve'
        ? '[Human Decision] Refund approved.'
        : '[Human Decision] Refund rejected.';

    const currentSummary = selectedTicket?.ai_summary ?? '';
    const nextSummary = currentSummary ? `${summaryPrefix}\n${currentSummary}` : summaryPrefix;

    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'Resolved',
        assigned_to: 'Human_Staff',
        ai_summary: nextSummary,
      })
      .eq('id', ticketId);

    if (updateError) {
      setError(`Failed to update ticket: ${updateError.message}`);
      setActionLoading(false);
      return;
    }

    await loadDashboardData();
    setSelectedTicketId(null);
    setActionLoading(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f0f7ff_0%,#f8fafc_45%,#eef2ff_100%)] text-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">ResolvOS</p>
            <h1 className="mt-2 text-2xl font-semibold">Human Agent Hub</h1>
          </div>

          <nav className="space-y-2">
            <a
              href="#"
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
            >
              <span className="flex items-center gap-2">
                <TicketIcon />
                Ticket Queue
              </span>
              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                {pendingCount}
              </span>
            </a>
          </nav>
        </aside>

        <main className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-rose-200 bg-white/85 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Pending Human Reviews</p>
                <span className="rounded-lg bg-rose-100 p-2 text-rose-700">
                  <AlertIcon />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-rose-700">{pendingCount}</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white/85 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Tickets Auto-Resolved</p>
                <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <SparklesIcon />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-emerald-700">{autoResolvedCount}</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold">Ticket Queue</h2>
            </div>

            {loading ? (
              <div className="p-8 text-sm text-slate-500">Loading ticket data...</div>
            ) : error ? (
              <div className="p-8 text-sm text-rose-700">{error}</div>
            ) : ticketsWithOrder.length === 0 ? (
              <div className="p-8 text-sm text-slate-500">No tickets found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Ticket ID</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Order Price</th>
                      <th className="px-5 py-3">AI Summary</th>
                      <th className="px-5 py-3">Assignee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ticketsWithOrder.map((ticket) => {
                      const isNeedsReview = ticket.status === 'Needs Human Review';

                      return (
                        <tr
                          key={ticket.id}
                          onClick={() => {
                            if (isNeedsReview) setSelectedTicketId(ticket.id);
                          }}
                          className={`transition ${isNeedsReview ? 'cursor-pointer hover:bg-rose-50/60' : 'hover:bg-slate-50'}`}
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">{ticket.id}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                ticket.status === 'Resolved'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : ticket.status === 'Needs Human Review'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{formatCurrency(ticket.orderPrice)}</td>
                          <td className="max-w-md px-5 py-4 text-sm text-slate-700">
                            <p className="line-clamp-2">{ticket.ai_summary ?? 'No summary available.'}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">{ticket.assigned_to ?? 'Unassigned'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Manual Review</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">Ticket {selectedTicket.id}</h3>
              </div>
              <button
                onClick={() => setSelectedTicketId(null)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order ID</p>
                <p className="mt-1 text-sm text-slate-800">{selectedTicket.order_id ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Summary</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {selectedTicket.ai_summary ?? 'No summary available.'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order Price</p>
                <p className="mt-1 text-sm text-slate-800">{formatCurrency(selectedTicket.orderPrice)}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => void updateTicketDecision(selectedTicket.id, 'reject')}
                disabled={actionLoading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reject
              </button>
              <button
                onClick={() => void updateTicketDecision(selectedTicket.id, 'approve')}
                disabled={actionLoading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Approve Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
