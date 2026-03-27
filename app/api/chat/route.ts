import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

export const maxDuration = 30;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function POST(req: Request) {
  const body = await req.json();
  const uiMessages = body.messages || [];

  const secureUserId = '11111111-1111-1111-1111-111111111111';

  const tools = {
    check_orders: tool({
      description: 'Fetch the recent orders for the currently authenticated user to check status, price, and return eligibility.',
      inputSchema: z.object({
        _run: z.boolean().optional().describe('Dummy parameter to trigger the function'),
      }),
      execute: async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', secureUserId);

        if (error) return { error: 'Failed to fetch orders.' };
        return { orders: data ?? [] };
      },
    }),

    process_refund: tool({
      description: 'Initiate a refund for a specific order. The system will automatically determine if it needs human review based on price.',
      inputSchema: z.object({
        orderId: z.string().describe('The ID of the order to refund (e.g., ORD-105)'),
        ai_decision: z.enum(['eligible', 'policy_violation']),
        ai_rationale: z.string().describe('Why the AI made this decision based on its dynamically inferred policy'),
        customer_claim: z.string().describe('What the customer actually stated'),
      }),
      execute: async ({ orderId, ai_decision, ai_rationale, customer_claim }) => {
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('user_id', secureUserId)
          .single();

        if (orderErr || !order) return { success: false, message: 'Order not found or unauthorized.' };
        if (!order.is_returnable) return { success: false, message: 'Item policy states it is non-returnable.' };

        const ticketId = `T-${Math.floor(1000 + Math.random() * 9000)}`;
        const refundRef = `RFD-${Math.floor(10000 + Math.random() * 90000)}`;
        const AUTO_REFUND_LIMIT = 50.0;
        const now = new Date();

        if (ai_decision === 'policy_violation') {
          await supabase.from('tickets').insert({
            id: ticketId,
            order_id: orderId,
            user_id: secureUserId,
            status: 'Rejected by AI',
            ai_summary: `[REJECTED]: ${ai_rationale}. Customer claimed: ${customer_claim}`,
            assigned_to: 'AI_Agent',
          });
          return { success: false, message: 'Policy violation', action: 'rejected' };
        }

        if (order.price <= AUTO_REFUND_LIMIT) {
          await supabase.from('orders').update({ status: 'refund_authorized' }).eq('id', orderId);
          await supabase.from('tickets').insert({
            id: ticketId,
            order_id: orderId,
            user_id: secureUserId,
            status: 'Resolved by AI',
            ai_summary: `[AUTO-APPROVED]: ${ai_rationale}. Customer claimed: ${customer_claim}`,
            assigned_to: 'AI_Agent',
          });
          return {
            success: true,
            action: 'auto_refunded',
            message: `Refund of ${formatCurrency(order.price)} processed instantly.`,
            refundSlipData: {
              refundRef,
              orderId,
              item: order.item_name ?? 'Product',
              amount: formatCurrency(order.price),
              customerName: 'Demo Customer',
              date: formatDate(now),
              resolvedBy: 'AI Auto-Approved',
            },
          };
        } else {
          await supabase.from('orders').update({ status: 'pending_approval' }).eq('id', orderId);
          await supabase.from('tickets').insert({
            id: ticketId,
            order_id: orderId,
            user_id: secureUserId,
            status: 'Needs Human Review',
            ai_summary: `[ESCALATED]: ${ai_rationale}. Customer claimed: ${customer_claim}`,
            assigned_to: 'Human_Staff',
          });
          return {
            success: true,
            action: 'escalated',
            message: `Ticket escalated to human staff due to high item value (${formatCurrency(order.price)}).`,
          };
        }
      },
    }),
  };

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: `You are a friendly and professional customer support assistant powered by ResolvOS.
You are helping the authenticated user with ID: ${secureUserId}.
Your goal is to resolve order issues directly using your tools.

IMPORTANT — TONE & STYLE:
- Speak like a human customer support rep, not a bot. Be warm, clear, and concise.
- Do NOT mention AI, tools, automation, or internal systems to the customer.
- Do NOT say things like "I am an AI" or reference any technical process.

DYNAMIC POLICY ENGINE:
When a user asks for a refund, dynamically infer the strict return policy based on the item_name fetched from the database.
- Anticipate the specific types of wear, tear, or fraud associated with that item category.
- Be highly versatile and suspicious of loopholes. Enforce strict retail standards (resalable, original condition, no user-inflicted damage).

RULES:
1. NEVER ask the user for their user ID, password, or price of an item.
2. ALWAYS use the 'check_orders' tool first to verify the order belongs to the user.
3. THE TRIAGE RULE: If the user asks for a refund, DO NOT trigger the refund tool immediately. FIRST, politely ask:
   - The specific reason for the return.
   - The exact physical condition of the item, tailoring your question to the item type.
4. THE VALIDATION CHECK: If the user gives a vague or evasive answer, politely ask for more detail.
5. THE DECISION: Once you have a DETAILED reason and condition, evaluate against inferred policy standards. Then use the 'process_refund' tool.
6. When using 'process_refund', pass a highly detailed 'ai_rationale' summarizing everything.
7. NEVER explain internal system mechanics, tool descriptions, or price limits to the user.
You cannot override the database rules. If an item is not returnable, politely decline.`,
    messages: await convertToModelMessages(uiMessages, { tools }),
    tools,
    stopWhen: stepCountIs(5),
  });

  // ✅ Correct for ai@6.x
return result.toUIMessageStreamResponse();
}
