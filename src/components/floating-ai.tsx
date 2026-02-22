"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Send, MessageCircle, Stethoscope, Loader2, MapPin } from "lucide-react";

type Message = {
  role: "user" | "bot";
  content: string;
  type?: "chat" | "booking_intent" | "symptoms_analyzed" | "confirmation";
  hospitals?: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
    location: string;
    minPrice: number;
    services: string[];
    specialties?: string[];
    departments?: Array<{
      id: string;
      name: string;
      slug: string;
      doctorCount: number;
    }>;
    matchedDepartment?: string;
  }>;
  matchedDepartments?: Array<{
    department: string;
    confidence: number;
    matchedKeywords: string[];
  }>;
  metadata?: {
    action?: string;
    hospital?: any;
    department?: any;
  };
};

type BookingStep = "chat" | "symptoms" | "hospital_selection" | "confirmation";

// Storage key for conversation
const STORAGE_KEY = "sewaSetu_chat_history";

export function FloatingAI() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>("chat");
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [problemDescription, setProblemDescription] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string>("");
  
  const [bookingData, setBookingData] = useState({
    patientName: "",
    patientAge: "",
    patientPhone: "",
    buyerEmail: "",
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check URL for autoOpen and conversationId
  useEffect(() => {
    const autoOpen = searchParams.get("openAI") === "true";
    const convId = searchParams.get("conversationId");
    
    if (autoOpen) {
      setIsOpen(true);
    }
    
    if (convId) {
      setCurrentConversationId(convId);
      loadConversation(convId);
    }
  }, [searchParams]);

  // Load saved conversation
  const loadConversation = (convId: string) => {
    try {
      console.log("[FloatingAI] Loading conversation:", convId);
      const saved = localStorage.getItem(`${STORAGE_KEY}_${convId}`);
      if (saved) {
        const conversation = JSON.parse(saved);
        console.log("[FloatingAI] Loaded conversation data:", conversation);
        
        setMessages(conversation.messages || []);
        setBookingStep(conversation.bookingStep || "chat");
        setSelectedHospital(conversation.selectedHospital || null);
        setSelectedDepartment(conversation.selectedDepartment || null);
        setProblemDescription(conversation.problemDescription || "");
        setBookingData(conversation.bookingData || {
          patientName: "",
          patientAge: "",
          patientPhone: "",
          buyerEmail: "",
        });
      }
    } catch (error) {
      console.error("[FloatingAI] Failed to load conversation:", error);
    }
  };

  // Generate a new conversation ID
  const generateConversationId = () => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save conversation state
  const saveConversation = () => {
    if (!currentConversationId || messages.length === 0) return;
    
    try {
      const conversation = {
        messages,
        bookingStep,
        selectedHospital,
        selectedDepartment,
        problemDescription,
        bookingData,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_KEY}_${currentConversationId}`, JSON.stringify(conversation));
    } catch (error) {
      console.error("[FloatingAI] Failed to save conversation:", error);
    }
  };

  // Auto-save when state changes
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      saveConversation();
    }
  }, [messages, bookingStep, selectedHospital, selectedDepartment, problemDescription, bookingData]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, bookingStep]);

  // Add initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0 && !currentConversationId) {
      const newId = generateConversationId();
      setCurrentConversationId(newId);
      setMessages([
        {
          role: "bot",
          content: "Namaste! 🙏 I'm your Sewa-Setu health assistant. Tell me your symptoms or health concerns, and I'll recommend the right hospital and specialist for you.",
          type: "chat",
        },
      ]);
    }
  }, [isOpen, messages.length, currentConversationId]);

  const askAI = async () => {
    if (!prompt.trim()) return;

    const userMsg = prompt;
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: userMsg, 
          action: "chat",
          conversationId: currentConversationId || generateConversationId()
        }),
      });

      const data = await res.json();

      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }

      if (data.type === "booking_intent" && data.nextStep === "collect_symptoms") {
        setBookingStep("symptoms");
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: data.text, type: "booking_intent" },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "bot", content: data.text, type: "chat" }]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Connection error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSymptoms = async () => {
    if (!problemDescription.trim()) return;

    const userMsg = problemDescription;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: userMsg, 
          action: "analyze_symptoms",
          conversationId: currentConversationId
        }),
      });

      const data = await res.json();
      setProblemDescription("");

      if (data.type === "symptoms_analyzed") {
        setBookingStep("hospital_selection");
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: data.text,
            type: "symptoms_analyzed",
            hospitals: data.hospitals,
            matchedDepartments: data.matchedDepartments,
          },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Failed to analyze symptoms. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectHospital = (hospital: any) => {
    console.log("[Floating AI] Selecting hospital:", hospital.name);
    
    if (hospital.departments && hospital.departments.length > 0) {
      setSelectedHospital(hospital);
      
      const deptList = hospital.departments.map((d: any) => 
        `• ${d.name} (${d.doctorCount} doctors)`
      ).join('\n');
      
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: `Please select a department at ${hospital.name}:\n\n${deptList}`,
          type: "chat",
        },
      ]);
      
      hospital.departments.forEach((dept: any) => {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: `👉 ${dept.name}`,
              type: "chat",
              metadata: { action: "select_department", hospital, department: dept },
            },
          ]);
        }, 100);
      });
    } else {
      navigateToHospital(hospital, null);
    }
  };

  const selectDepartment = (hospital: any, department: any) => {
    setSelectedDepartment(department);
    navigateToHospital(hospital, department);
  };

  const navigateToHospital = (hospital: any, department: any) => {
    let url = `/hospital/${hospital.slug}`;
    const params = new URLSearchParams();
    
    if (department) {
      params.set("department", department.id);
      params.set("deptName", department.name);
    }
    
    if (hospital.specialties && hospital.specialties.length > 0) {
      params.set("specialties", hospital.specialties.slice(0, 3).join(","));
    }
    
    params.set("from", "ai");
    params.set("conversationId", currentConversationId);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    console.log("[Floating AI] Navigating to:", url);
    saveConversation(); // Save one last time before navigation
    router.push(url);
    setIsOpen(false);
  };

  const handleMessageClick = (msg: any) => {
    if (msg.metadata?.action === "select_department") {
      selectDepartment(msg.metadata.hospital, msg.metadata.department);
    }
  };

  const handleNewChat = () => {
    const newId = generateConversationId();
    setCurrentConversationId(newId);
    setMessages([]);
    setBookingStep("chat");
    setSelectedHospital(null);
    setSelectedDepartment(null);
    setProblemDescription("");
    setBookingData({
      patientName: "",
      patientAge: "",
      patientPhone: "",
      buyerEmail: "",
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,400&display=swap');

        :root {
          --teal-900: #0f3d38;
          --teal-700: #0d6457;
          --teal-500: #0f9580;
          --teal-400: #14b89f;
          --teal-300: #4dcfba;
          --teal-100: #d0f5ef;
          --teal-50:  #f0faf8;
          --cream:    #fdfaf5;
          --sand:     #f5f0e8;
          --warm-100: #ede8de;
          --text-dark: #1a2e2b;
          --text-mid:  #3d5752;
          --text-soft: #7a9a95;
          --gold:     #d4a853;
          --shadow-teal: rgba(14, 149, 128, 0.22);
        }

        .ss-wrap * {
          font-family: 'Plus Jakarta Sans', sans-serif;
          box-sizing: border-box;
        }

        .ss-window {
          background: var(--cream);
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid rgba(14,149,128,0.14);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.7) inset,
            0 2px 4px rgba(0,0,0,0.04),
            0 12px 40px -4px var(--shadow-teal),
            0 40px 80px -12px rgba(0,0,0,0.12);
          animation: ssOpen 0.4s cubic-bezier(0.34, 1.48, 0.64, 1);
          transform-origin: bottom right;
          display: flex;
          flex-direction: column;
        }

        @keyframes ssOpen {
          from { opacity: 0; transform: scale(0.82) translateY(24px) rotate(-1deg); }
          to   { opacity: 1; transform: scale(1)    translateY(0)     rotate(0deg); }
        }

        .ss-header {
          padding: 16px 18px;
          position: relative;
          overflow: hidden;
          background: var(--teal-900);
          flex-shrink: 0;
        }

        .ss-header::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 160px; height: 160px;
          background: radial-gradient(circle, rgba(77,207,186,0.18) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .ss-header-arc {
          position: absolute;
          bottom: -28px; left: -20px;
          width: 120px; height: 120px;
          background: radial-gradient(circle, rgba(212,168,83,0.1) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
          border-radius: 50%;
        }

        .ss-header-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ss-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .ss-avatar {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, var(--teal-500), var(--teal-300));
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid rgba(255,255,255,0.15);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2), 0 0 0 3px rgba(77,207,186,0.15);
        }

        .ss-status {
          position: absolute;
          bottom: -1px; right: -1px;
          width: 12px; height: 12px;
          background: #2ecc71;
          border-radius: 50%;
          border: 2px solid var(--teal-900);
          box-shadow: 0 0 6px rgba(46,204,113,0.6);
          animation: ssPulseGreen 2.5s ease-in-out infinite;
        }

        @keyframes ssPulseGreen {
          0%, 100% { box-shadow: 0 0 6px rgba(46,204,113,0.6); }
          50%       { box-shadow: 0 0 12px rgba(46,204,113,0.9); }
        }

        .ss-name {
          font-family: 'Fraunces', serif;
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .ss-tagline {
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          font-weight: 400;
          letter-spacing: 0.03em;
          margin-top: 1px;
          display: flex; align-items: center; gap: 4px;
        }

        .ss-tagline-dot {
          width: 5px; height: 5px;
          background: var(--teal-300);
          border-radius: 50%;
          display: inline-block;
          animation: ssFadeInOut 2s ease-in-out infinite;
        }

        @keyframes ssFadeInOut {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }

        .ss-close {
          margin-left: auto;
          width: 32px; height: 32px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: background 0.2s, color 0.2s, transform 0.15s;
          flex-shrink: 0;
          z-index: 1;
          position: relative;
        }
        .ss-close:hover {
          background: rgba(255,255,255,0.15);
          color: #fff;
          transform: scale(1.08);
        }

        .ss-new-chat {
          margin-left: 8px;
          width: 32px; height: 32px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: background 0.2s, color 0.2s, transform 0.15s;
          flex-shrink: 0;
          font-size: 18px;
        }
        .ss-new-chat:hover {
          background: rgba(255,255,255,0.15);
          color: #fff;
          transform: scale(1.08);
        }

        .ss-date-divider {
          display: flex; align-items: center; gap: 8px;
          margin: 4px 0;
        }
        .ss-date-divider span {
          font-size: 10px;
          color: var(--text-soft);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 500;
          white-space: nowrap;
        }
        .ss-date-divider::before,
        .ss-date-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--warm-100), transparent);
        }

        .ss-chat {
          height: 360px;
          overflow-y: auto;
          padding: 20px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background:
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f9580' fill-opacity='0.025'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
            var(--cream);
          scrollbar-width: thin;
          scrollbar-color: var(--warm-100) transparent;
        }
        .ss-chat::-webkit-scrollbar { width: 4px; }
        .ss-chat::-webkit-scrollbar-track { background: transparent; }
        .ss-chat::-webkit-scrollbar-thumb { background: var(--warm-100); border-radius: 4px; }

        .ss-row-bot  { display: flex; flex-direction: column; align-items: flex-start; }
        .ss-row-user { display: flex; flex-direction: column; align-items: flex-end; }

        .ss-micro-avatar {
          width: 22px; height: 22px;
          background: linear-gradient(135deg, var(--teal-500), var(--teal-300));
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 5px;
          flex-shrink: 0;
        }

        .ss-bubble-bot {
          background: #ffffff;
          border: 1px solid rgba(14,149,128,0.1);
          color: var(--text-dark);
          padding: 11px 15px;
          border-radius: 4px 18px 18px 18px;
          font-size: 13.5px;
          line-height: 1.65;
          max-width: 88%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05), 0 0 0 1px rgba(255,255,255,0.8) inset;
          animation: ssMsg 0.28s cubic-bezier(0.34, 1.5, 0.64, 1);
          white-space: pre-wrap;
        }

        .ss-bubble-user {
          background: linear-gradient(145deg, var(--teal-700) 0%, var(--teal-500) 100%);
          color: #ffffff;
          padding: 11px 15px;
          border-radius: 18px 4px 18px 18px;
          font-size: 13.5px;
          line-height: 1.65;
          max-width: 88%;
          box-shadow: 0 4px 16px var(--shadow-teal), 0 0 0 1px rgba(255,255,255,0.08) inset;
          animation: ssMsg 0.28s cubic-bezier(0.34, 1.5, 0.64, 1);
        }

        @keyframes ssMsg {
          from { opacity: 0; transform: scale(0.92) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }

        .ss-typing {
          display: flex; align-items: center; gap: 5px;
          padding: 12px 15px;
          background: #ffffff;
          border: 1px solid rgba(14,149,128,0.1);
          border-radius: 4px 18px 18px 18px;
          width: fit-content;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          animation: ssMsg 0.28s cubic-bezier(0.34, 1.5, 0.64, 1);
        }
        .ss-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          animation: ssDot 1.4s ease-in-out infinite;
        }
        .ss-dot:nth-child(1) { background: var(--teal-300); animation-delay: 0s; }
        .ss-dot:nth-child(2) { background: var(--teal-400); animation-delay: 0.18s; }
        .ss-dot:nth-child(3) { background: var(--teal-500); animation-delay: 0.36s; }
        @keyframes ssDot {
          0%, 60%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          30%            { transform: translateY(-5px) scale(1.1); opacity: 1; }
        }

        .ss-hospital-card {
          background: white;
          border: 2px solid #0f9580;
          border-radius: 8px;
          padding: 12px;
          margin: 8px 0;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .ss-hospital-card:hover {
          border-color: #d4a853;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(14, 149, 128, 0.22);
        }

        .ss-hospital-name {
          font-size: 14px;
          font-weight: 700;
          color: #0d6457;
          text-decoration: underline;
          margin-bottom: 6px;
        }

        .ss-hospital-location {
          font-size: 11px;
          color: #7a9a95;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 8px;
        }

        .ss-hospital-specialties {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin: 6px 0;
        }

        .ss-specialty-tag {
          font-size: 9px;
          padding: 2px 8px;
          background: #f0faf8;
          color: #0d6457;
          border-radius: 12px;
          border: 1px solid #d0f5ef;
        }

        .ss-department-badge {
          font-size: 10px;
          font-weight: 600;
          color: #d4a853;
          background: rgba(212,168,83,0.1);
          border: 1px solid rgba(212,168,83,0.3);
          border-radius: 16px;
          padding: 2px 8px;
          display: inline-block;
          margin-bottom: 6px;
        }

        .ss-input-wrap {
          padding: 12px 16px;
          background: var(--cream);
          border-top: 1px solid var(--warm-100);
          display: flex;
          gap: 8px;
          align-items: center;
          flex-shrink: 0;
        }

        .ss-input-field {
          flex: 1;
          background: #ffffff;
          border: 1.5px solid var(--warm-100);
          border-radius: 16px;
          padding: 10px 16px;
          font-size: 13.5px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--text-dark);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          line-height: 1.4;
        }
        .ss-input-field::placeholder { color: var(--text-soft); }
        .ss-input-field:focus {
          border-color: var(--teal-300);
          box-shadow: 0 0 0 3px rgba(14,149,128,0.1);
        }

        .ss-send {
          width: 42px; height: 42px;
          background: linear-gradient(145deg, var(--teal-700), var(--teal-500));
          border: none;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
          box-shadow: 0 4px 14px var(--shadow-teal);
        }
        .ss-send:hover:not(:disabled) {
          transform: scale(1.08) translateY(-1px);
          box-shadow: 0 6px 20px var(--shadow-teal);
        }
        .ss-send:active:not(:disabled) { transform: scale(0.96); }
        .ss-send:disabled { opacity: 0.45; cursor: not-allowed; }

        .ss-fab-wrap { position: relative; }

        .ss-fab {
          width: 60px; height: 60px;
          background: linear-gradient(145deg, var(--teal-900) 0%, var(--teal-500) 100%);
          border: none;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #ffffff;
          cursor: pointer;
          position: relative;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
          box-shadow: 0 4px 20px var(--shadow-teal);
        }
        .ss-fab:hover {
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 8px 28px var(--shadow-teal), 0 0 0 8px rgba(14,149,128,0.08);
        }
        .ss-fab:active { transform: scale(0.95); }

        .ss-fab::before {
          content: '';
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          border: 1.5px solid rgba(14,149,128,0.2);
          animation: ssHalo 3s ease-in-out infinite;
        }
        @keyframes ssHalo {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }

        .ss-badge {
          position: absolute;
          top: 1px; right: 1px;
          width: 15px; height: 15px;
          display: flex; align-items: center; justify-content: center;
        }
        .ss-badge-ping {
          position: absolute; inset: 0;
          background: var(--gold);
          border-radius: 50%;
          animation: ssping 1.8s cubic-bezier(0,0,0.2,1) infinite;
        }
        .ss-badge-core {
          position: absolute; inset: 2.5px;
          background: var(--gold);
          border-radius: 50%;
          border: 2px solid var(--teal-900);
        }
        @keyframes ssping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }

        .ss-tip {
          position: absolute;
          right: 70px; bottom: 50%;
          transform: translateY(50%) translateX(4px);
          background: var(--teal-900);
          color: rgba(255,255,255,0.9);
          font-size: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          padding: 6px 12px;
          border-radius: 10px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
        }
        .ss-tip::after {
          content: '';
          position: absolute;
          left: 100%; top: 50%;
          margin-top: -5px;
          border: 5px solid transparent;
          border-left-color: var(--teal-900);
        }
        .ss-fab-wrap:hover .ss-tip {
          opacity: 1;
          transform: translateY(50%) translateX(0);
        }
      `}</style>

      <div className="ss-wrap fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Chat Window */}
        {isOpen && (
          <div className="ss-window mb-4 w-[360px] sm:w-[400px]">
            {/* Header */}
            <div className="ss-header">
              <div className="ss-header-arc" />
              <div className="ss-header-inner">
                <div className="ss-avatar-wrap">
                  <div className="ss-avatar">
                    <Stethoscope size={20} color="white" strokeWidth={1.8} />
                  </div>
                  <div className="ss-status" />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="ss-name">Sewa-Setu Assistant</span>
                  <span className="ss-tagline">
                    <span className="ss-tagline-dot" />
                    Online · AI Health Guide
                  </span>
                </div>
                {messages.length > 0 && (
                  <button 
                    className="ss-new-chat" 
                    onClick={handleNewChat}
                    title="Start new conversation"
                  >
                    +
                  </button>
                )}
                <button className="ss-close" onClick={() => setIsOpen(false)} title="Close">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="ss-chat">
              <div className="ss-date-divider">
                <span>Today</span>
              </div>

              {/* Conversation history */}
              {messages.map((msg, index) =>
                msg.role === "user" ? (
                  <div key={index} className="ss-row-user">
                    <div className="ss-bubble-user">{msg.content}</div>
                  </div>
                ) : (
                  <div key={index} className="ss-row-bot">
                    <div className="ss-micro-avatar">
                      <Stethoscope size={12} color="white" strokeWidth={2} />
                    </div>
                    <div 
                      className="ss-bubble-bot"
                      onClick={() => handleMessageClick(msg)}
                      style={msg.metadata ? { cursor: "pointer" } : {}}
                    >
                      {msg.content}
                    </div>
                    
                    {/* Hospital Selection */}
                    {msg.type === "symptoms_analyzed" && msg.hospitals && (
                      <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        {msg.hospitals.map((h) => (
                          <div
                            key={h.id}
                            onClick={() => selectHospital(h)}
                            className="ss-hospital-card"
                          >
                            <div className="ss-hospital-name">🏥 {h.name}</div>
                            <div className="ss-hospital-location">
                              <MapPin size={10} />
                              {h.location}
                            </div>
                            
                            {h.matchedDepartment && (
                              <div className="ss-department-badge">
                                ✓ Matched: {h.matchedDepartment}
                              </div>
                            )}
                            
                            <div className="ss-hospital-specialties">
                              {h.specialties && h.specialties.slice(0, 3).map((s: string, i: number) => (
                                <span key={i} className="ss-specialty-tag">
                                  {s}
                                </span>
                              ))}
                              {h.specialties && h.specialties.length > 3 && (
                                <span className="ss-specialty-tag">+{h.specialties.length - 3}</span>
                              )}
                            </div>
                            
                            <div style={{ 
                              fontSize: "10px", 
                              color: "#0f9580", 
                              marginTop: "6px",
                              fontStyle: "italic",
                              textAlign: "right",
                            }}>
                              ➜ Click to view departments
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Symptom Input */}
              {bookingStep === "symptoms" && (
                <div className="ss-row-bot" style={{ width: "100%" }}>
                  <div style={{ width: "100%", background: "#f0faf8", borderRadius: "12px", padding: "10px", border: "1px solid rgba(14, 149, 128, 0.2)" }}>
                    <textarea
                      placeholder="Describe your symptoms in detail (e.g., 'I have severe headache with fever for 3 days')"
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: "12px",
                        border: "1px solid #d0f5ef",
                        borderRadius: "6px",
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        outline: "none",
                        minHeight: "80px",
                        resize: "vertical",
                      }}
                    />
                    <button
                      onClick={analyzeSymptoms}
                      disabled={isLoading || !problemDescription.trim()}
                      style={{
                        marginTop: "8px",
                        width: "100%",
                        padding: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: isLoading || !problemDescription.trim() ? "#ccc" : "linear-gradient(145deg, #0d6457, #0f9580)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: isLoading || !problemDescription.trim() ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {isLoading && <Loader2 size={12} className="animate-spin" />}
                      Find Matching Hospitals
                    </button>
                  </div>
                </div>
              )}

              {/* Booking Confirmation Form */}
              {bookingStep === "confirmation" && selectedHospital && (
                <div className="ss-row-bot" style={{ width: "100%" }}>
                  <div style={{ width: "100%", background: "#f0faf8", borderRadius: "12px", padding: "12px", border: "1px solid rgba(14, 149, 128, 0.2)" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "600", color: "#0f3d38", marginBottom: "10px" }}>
                      Booking at {selectedHospital.name}
                    </h4>
                    <form onSubmit={(e) => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={bookingData.patientName}
                        onChange={(e) => setBookingData({ ...bookingData, patientName: e.target.value })}
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #d0f5ef",
                          borderRadius: "6px",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Age"
                        value={bookingData.patientAge}
                        onChange={(e) => setBookingData({ ...bookingData, patientAge: e.target.value })}
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #d0f5ef",
                          borderRadius: "6px",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={bookingData.patientPhone}
                        onChange={(e) => setBookingData({ ...bookingData, patientPhone: e.target.value })}
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #d0f5ef",
                          borderRadius: "6px",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={bookingData.buyerEmail}
                        onChange={(e) => setBookingData({ ...bookingData, buyerEmail: e.target.value })}
                        style={{
                          padding: "8px 10px",
                          fontSize: "12px",
                          border: "1px solid #d0f5ef",
                          borderRadius: "6px",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                        required
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                          padding: "10px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: isLoading ? "#ccc" : "linear-gradient(145deg, #0d6457, #0f9580)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: isLoading ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          marginTop: "4px",
                        }}
                      >
                        {isLoading && <Loader2 size={12} className="animate-spin" />}
                        Confirm Booking
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {isLoading && bookingStep !== "confirmation" && (
                <div className="ss-row-bot">
                  <div className="ss-micro-avatar">
                    <Stethoscope size={12} color="white" strokeWidth={2} />
                  </div>
                  <div className="ss-typing">
                    <div className="ss-dot" />
                    <div className="ss-dot" />
                    <div className="ss-dot" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="ss-input-wrap">
              {bookingStep === "chat" ? (
                <>
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && askAI()}
                    placeholder="Describe your symptoms..."
                    className="ss-input-field"
                  />
                  <button className="ss-send" onClick={askAI} disabled={isLoading} title="Send">
                    <Send size={16} />
                  </button>
                </>
              ) : (
                <div style={{ fontSize: "12px", color: "#7a9a95", textAlign: "center", width: "100%", padding: "8px" }}>
                  {bookingStep === "symptoms" && "Describe your symptoms above ↑"}
                  {bookingStep === "hospital_selection" && "Select a hospital above ↑"}
                  {bookingStep === "confirmation" && "Fill in your details above ↑"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAB */}
        <div className="ss-fab-wrap">
          {!isOpen && <div className="ss-tip">Ask AI Health Guide</div>}
          <button 
            className="ss-fab" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
          >
            {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            {!isOpen && (
              <span className="ss-badge">
                <span className="ss-badge-ping" />
                <span className="ss-badge-core" />
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}