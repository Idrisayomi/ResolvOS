'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function ResolvOSChat() {
  // 1. Margin of Safety: We take 100% control of the input state.
  const [inputValue, setInputValue] = useState('');

  // 2. We only use the SDK for the messages array and the raw "append" function.
  const { messages, sendMessage, isLoading } = useChat({
    api: '/api/chat',
    maxSteps: 5,
  });

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

          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* The Message Bubble */}
              {m.content && (
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-gray-100 text-slate-800 rounded-tl-sm border border-gray-200'
                }`}>
                  {m.content}
                </div>
              )}

              {/* Tool Invocations */}
              {m.toolInvocations?.map((toolInvocation: any) => {
                const toolCallId = toolInvocation.toolCallId;
                const toolName = toolInvocation.toolName;

                return (
                  <div key={toolCallId} className="mt-2 flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 w-full max-w-[80%]">
                    <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    
                    {toolInvocation.state !== 'result' ? (
                      <span>Executing secure tool: <span className="font-bold text-blue-600">{toolName}()</span>...</span>
                    ) : (
                      <span className="text-green-600">
                        ✓ {toolName} complete. DB updated.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          
          {isLoading && (
            <div className="text-sm text-slate-400 animate-pulse ml-2">ResolvOS is thinking...</div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={onSubmit} className="flex gap-2 relative">
            <input
              className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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