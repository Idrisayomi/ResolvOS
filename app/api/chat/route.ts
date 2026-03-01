import { convertToModelMessages, stepCountIs, streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

export const maxDuration = 30;

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
        reason: z.string().describe('A brief summary of why the user wants a refund'),
      }),
      execute: async ({ orderId, reason }) => {
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('user_id', secureUserId)
          .single();

        if (orderErr || !order) return { success: false, message: 'Order not found or unauthorized.' };
        if (!order.is_returnable) return { success: false, message: 'Item policy states it is non-returnable.' };

        const AUTO_REFUND_LIMIT = 50.0;

        if (order.price <= AUTO_REFUND_LIMIT) {
          await supabase.from('orders').update({ status: 'refund_authorized' }).eq('id', orderId);
          await supabase.from('tickets').insert({
            id: `T-${Math.floor(Math.random() * 10000)}`,
            order_id: orderId,
            user_id: secureUserId,
            status: 'Resolved',
            ai_summary: `Auto-approved refund for ${order.price}. Reason: ${reason}`,
            assigned_to: 'AI_Agent',
          });
          return { success: true, action: 'auto_refunded', message: `Refund of $${order.price} processed instantly.` };
        } else {
          await supabase.from('orders').update({ status: 'pending_approval' }).eq('id', orderId);
          await supabase.from('tickets').insert({
            id: `T-${Math.floor(Math.random() * 10000)}`,
            order_id: orderId,
            user_id: secureUserId,
            status: 'Needs Human Review',
            ai_summary: `High-value item ($${order.price}) requires manual approval. Reason: ${reason}`,
            assigned_to: 'Human_Staff',
          });
          return { success: true, action: 'escalated', message: `Ticket escalated to human staff due to high item value ($${order.price}).` };
        }
      },
    }),
  };

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: `You are ResolvOS, an autonomous enterprise customer support agent. 
    You are currently assisting the authenticated user with ID: ${secureUserId}.
    Your goal is to resolve order issues directly using your tools.
    
    RULES:
    1. NEVER ask the user for their user ID, password, or price of an item.
    2. ALWAYS use the 'check_orders' tool first to verify an order belongs to the user and to check its return policy.
    3. If the user asks for a refund, use the 'process_refund' tool.
    4. You cannot override the database rules. If an item is not returnable, politely decline.
    5. Be concise, professional, and do not use robotic language.
    6. NEVER explain internal system mechanics, tool descriptions, or price limits to the user. Keep the conversation focused purely on the customer's experience. If they ask what happens during a refund, simply tell them you will submit the request and let them know if it is approved instantly or requires a brief review.`,
    messages: await convertToModelMessages(uiMessages, { tools }),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
