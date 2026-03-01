'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isTextUIPart, isToolUIPart } from 'ai';
import { useState } from 'react';

export default function ResolvOSChat() {
  // 1. Margin of Safety: We take 100% control of the input state.
  const [inputValue, setInputValue] = useState('');

  // 2. We only use the SDK for the messages array and the raw "append" function.
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  // 3. Our custom submit function
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue?.trim()) return;

    // Send the message using the new V5 format
    sendMessage({ text: inputValue });

    // Clear the input box
    setInputValue('');
  };

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl tracking-tight">ResolvOS</h1>
            <p className="text-xs text-slate-400">Zero-Trust Autonomous Agent</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">System Online</span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <p>Send a message to test the refund escalation protocol.</p>
            </div>
          )}

          {messages.map((m) => {
            const textParts = m.parts.filter(isTextUIPart);
            const messageText = textParts.map((part) => part.text).join('\n').trim();
            const toolParts = m.parts.filter(isToolUIPart);

            return (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* The Message Bubble */}
              {messageText && (
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-slate-800 rounded-tl-sm border border-gray-200'
                }`}>
                  {messageText}
                </div>
              )}

              {/* Tool Invocations */}
              {toolParts.map((toolInvocation) => {
                const toolCallId = toolInvocation.toolCallId;
                const toolName =
                  toolInvocation.type === 'dynamic-tool'
                    ? toolInvocation.toolName
                    : toolInvocation.type.replace('tool-', '');
                const isRunning =
                  toolInvocation.state === 'input-streaming' ||
                  toolInvocation.state === 'input-available' ||
                  toolInvocation.state === 'approval-requested' ||
                  toolInvocation.state === 'approval-responded';
                const output = (toolInvocation.state === 'output-available'
                  ? toolInvocation.output
                  : undefined) as
                  | { orders?: unknown[]; action?: string; message?: string }
                  | undefined;

                let statusLabel = '';
                if (isRunning) {
                  statusLabel = `Executing secure tool: ${toolName}()...`;
                } else if (toolInvocation.state === 'output-error') {
                  statusLabel = `[ERROR] ${toolName} failed: ${toolInvocation.errorText}`;
                } else if (toolInvocation.state === 'output-denied') {
                  statusLabel = `[DENIED] ${toolName} requires approval and was not executed.`;
                } else if (toolName === 'check_orders') {
                  const count = Array.isArray(output?.orders) ? output.orders.length : null;
                  statusLabel =
                    count !== null
                      ? `[OK] check_orders complete. Found ${count} order(s).`
                      : '[OK] check_orders complete. Orders retrieved.';
                } else if (toolName === 'process_refund') {
                  if (output?.action === 'auto_refunded') {
                    statusLabel = '[OK] process_refund complete. Refund auto-approved.';
                  } else if (output?.action === 'escalated') {
                    statusLabel = '[OK] process_refund complete. Escalated for human review.';
                  } else {
                    statusLabel = `[OK] process_refund complete. ${output?.message ?? 'Request processed.'}`;
                  }
                } else {
                  statusLabel = `[OK] ${toolName} complete.`;
                }

                return (
                  <div key={toolCallId} className="mt-2 flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 w-full max-w-[80%]">
                    {isRunning ? (
                      <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${
                        toolInvocation.state === 'output-error'
                          ? 'bg-red-500'
                          : toolInvocation.state === 'output-denied'
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}></span>
                    )}
                    <span className={toolInvocation.state === 'output-error' ? 'text-red-600' : 'text-slate-600'}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
              {m.role === 'assistant' && toolParts.length === 0 && messageText && (
                <div className="mt-2 flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 w-full max-w-[80%]">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-slate-600">[OK] Request validated. Resolution prepared.</span>
                </div>
              )}
            </div>
            );
          })}
          
          {isLoading && (
            <div className="text-sm text-slate-400 animate-pulse ml-2">ResolvOS is thinking...</div>
          )}
          {status === 'error' && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              Request failed: {error?.message ?? 'Unknown error'}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={onSubmit} className="flex gap-2 relative">
            <input
              className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
              value={inputValue} 
              placeholder="E.g., I want to return my clear phone case..."
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !inputValue?.trim()} 
              className="px-6 py-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

