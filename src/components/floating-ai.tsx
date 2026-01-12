"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when AI responds
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response, isLoading]);

  const askAI = async () => {
  if (!prompt) return;
  
  const userMsg = prompt; // Save the message
  setPrompt(""); // Clear the input box so it feels fast
  setIsLoading(true);

  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // We send ONLY the prompt here because we are on the homepage
      body: JSON.stringify({ prompt: userMsg }),
    });

    const data = await res.json();
    
    // DEBUG: Add this line to see what is happening in your browser console
    console.log("AI Response Data:", data);

    if (data.text) {
      setResponse(data.text);
    } else {
      setResponse("I'm sorry, I couldn't get a response. Please try again.");
    }
  } catch (e) {
    setResponse("Connection error. Is the server running?");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 1. Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Sewa-Setu Assistant</p>
                <p className="text-[10px] text-blue-100">Online | AI Guide</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded" title="Close chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Area */}
          <div ref={scrollRef} className="h-[350px] overflow-y-auto p-4 space-y-4 bg-slate-50">
            <div className="bg-blue-100 text-blue-800 p-3 rounded-2xl rounded-tl-none text-sm max-w-[85%]">
              Namaste! 🙏 How can I help you find the right health checkup for your parents today?
            </div>
            
            {response && (
              <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none text-sm max-w-[85%] shadow-sm animate-in fade-in">
                {response}
              </div>
            )}

            {isLoading && (
              <div className="flex gap-1 p-2">
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce" />
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAI()}
              placeholder="Type your concern..."
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={askAI} disabled={isLoading} className="rounded-xl h-10 w-10 p-0 bg-blue-600">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 2. Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-all duration-300 group relative"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        
        {/* Notification Badge */}
        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
}