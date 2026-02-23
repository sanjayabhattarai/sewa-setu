"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { X, Send, Stethoscope, Loader2, MapPin, Sparkles, AlertTriangle } from "lucide-react";

type Message = {
  role: "user" | "bot";
  content: string;
  type?: "chat" | "booking_intent" | "symptoms_analyzed" | "confirmation" | "error";
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
  isEmergency?: boolean;
  metadata?: {
    action?: string;
    hospital?: any;
    department?: any;
  };
};

type BookingStep = "chat" | "symptoms" | "hospital_selection" | "confirmation";

// Storage key for conversation
const STORAGE_KEY = "sewaSetu_ai_search_history";

type Props = {
  isOpen: boolean;
  onCloseAction: () => void;
  initialConversationId?: string;
};

export function AISearchModal({ isOpen, onCloseAction, initialConversationId }: Props) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>("chat");
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [problemDescription, setProblemDescription] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string>(initialConversationId || "");
  const [isMounted, setIsMounted] = useState(false);

  const [bookingData, setBookingData] = useState({
    patientName: "",
    patientAge: "",
    patientPhone: "",
    buyerEmail: "",
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Ensure we only render on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load conversation if initialConversationId is provided
  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, [initialConversationId]);

  // Generate a new conversation ID
  const generateConversationId = () => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Load saved conversation
  const loadConversation = (convId: string) => {
    try {
      console.log("[AISearchModal] Loading conversation:", convId);
      const saved = localStorage.getItem(`${STORAGE_KEY}_${convId}`);
      if (saved) {
        const conversation = JSON.parse(saved);
        console.log("[AISearchModal] Loaded conversation data:", conversation);
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
        setCurrentConversationId(convId);
      } else {
        console.log("[AISearchModal] No saved conversation found for ID:", convId);
        setCurrentConversationId(convId);
      }
    } catch (error) {
      console.error("[AISearchModal] Failed to load conversation:", error);
    }
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
      console.error("[AISearchModal] Failed to save conversation:", error);
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

  // Add initial greeting when modal opens
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
    } else if (isOpen && messages.length > 0 && currentConversationId) {
      console.log("[AISearchModal] Restored conversation with", messages.length, "messages");
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
          conversationId: currentConversationId || generateConversationId(),
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
        { role: "bot", content: "Connection error. Please try again.", type: "error" },
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
          conversationId: currentConversationId,
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
            isEmergency: data.isEmergency,
          },
        ]);

        // If emergency, show warning
        if (data.isEmergency) {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: "⚠️ **URGENT**: Based on your symptoms, please seek immediate medical attention or call emergency services (102) if you're experiencing a medical emergency.",
              type: "chat",
            },
          ]);
        }
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Failed to analyze symptoms. Please try again.", type: "error" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectHospital = (hospital: any) => {
    console.log("[AISearchModal] Selecting hospital:", hospital.name);
    
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
              content: dept.name,
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
    
    // Add matched specialties as search params for filtering
    if (hospital.specialties && hospital.specialties.length > 0) {
      params.set("specialties", hospital.specialties.slice(0, 3).join(","));
    }
    
    // Add flag and conversation ID to indicate this navigation came from AI
    params.set("from", "ai");
    params.set("conversationId", currentConversationId);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Save one last time before navigation
    if (currentConversationId && messages.length > 0) {
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
    }

    onCloseAction();
    router.push(url);
  };

  // Handle custom message actions
  const handleMessageClick = (msg: Message) => {
    if (msg.metadata?.action === "select_department") {
      selectDepartment(msg.metadata.hospital, msg.metadata.department);
    }
  };

  // Quick action to search for doctors/hospitals
  const startDoctorSearch = () => {
    setBookingStep("symptoms");
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        content: "Great! Please describe your symptoms or health concerns in detail so I can find the right doctors and hospitals for you.",
        type: "booking_intent",
      },
    ]);
  };

  // Clear conversation and start new
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
    
    // Add initial greeting
    setMessages([
      {
        role: "bot",
        content: "Namaste! 🙏 I'm your Sewa-Setu health assistant. Tell me your symptoms or health concerns, and I'll recommend the right hospital and specialist for you.",
        type: "chat",
      },
    ]);
  };

  if (!isMounted || !isOpen) return null;

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(15, 30, 56, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCloseAction();
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "900px",
          height: "90vh",
          maxHeight: "700px",
          background: "white",
          borderRadius: "20px",
          border: "1px solid rgba(200, 169, 110, 0.2)",
          boxShadow: "0 20px 60px rgba(15, 30, 56, 0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px",
            background: "linear-gradient(135deg, #0f1e38 0%, #1a3059 100%)",
            borderBottom: "1px solid rgba(200, 169, 110, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#c8a96e", margin: 0 }}>
                🏥 Smart Health Search
              </h2>
              <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.6)", margin: "4px 0 0 0" }}>
                AI-powered hospital and doctor finder
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                style={{
                  background: "rgba(200, 169, 110, 0.2)",
                  border: "1px solid rgba(200, 169, 110, 0.3)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  color: "#c8a96e",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(200, 169, 110, 0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(200, 169, 110, 0.2)";
                }}
              >
                <Sparkles size={14} />
                New Chat
              </button>
            )}
          </div>
          <button
            onClick={onCloseAction}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "10px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0,
              marginLeft: "16px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(229, 62, 62, 0.9)";
              (e.currentTarget as HTMLButtonElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255, 255, 255, 0.7)";
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            background: "#f5f3ef",
          }}
        >
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              {/* Bot avatar */}
              {msg.role === "bot" && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #0f9580, #0d6457)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Stethoscope size={16} color="white" strokeWidth={2} />
                </div>
              )}

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", maxWidth: "100%" }}>
                {/* Emergency message */}
                {msg.isEmergency && (
                  <div
                    style={{
                      background: "#fee2e2",
                      border: "2px solid #dc2626",
                      color: "#dc2626",
                      padding: "12px 16px",
                      borderRadius: "4px 18px 18px 18px",
                      fontSize: "0.95rem",
                      lineHeight: "1.6",
                      fontWeight: 600,
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <AlertTriangle size={18} />
                      <span>EMERGENCY</span>
                    </div>
                    {msg.content}
                  </div>
                )}

                {/* Regular chat message */}
                {!msg.isEmergency && msg.metadata?.action !== "select_department" && (
                  <div
                    style={{
                      background: msg.role === "user" ? "linear-gradient(145deg, #0d6457, #0f9580)" : "white",
                      color: msg.role === "user" ? "white" : "#0f1e38",
                      padding: "12px 16px",
                      borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                      fontSize: "0.95rem",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      boxShadow: msg.role === "user"
                        ? "0 4px 12px rgba(14, 149, 128, 0.2)"
                        : "0 2px 8px rgba(0, 0, 0, 0.08)",
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: msg.role === "user" ? "60%" : "100%",
                      cursor: msg.metadata ? "pointer" : "default",
                    }}
                    onClick={() => handleMessageClick(msg)}
                  >
                    {msg.content}
                  </div>
                )}

                {/* Hospital cards - display when type is symptoms_analyzed */}
                {msg.type === "symptoms_analyzed" && msg.hospitals && msg.hospitals.length > 0 && (
                  <div style={{ marginTop: "10px", width: "100%" }}>
                    <p style={{ fontSize: "0.85rem", color: "#7a9a95", marginBottom: "8px", fontWeight: 500 }}>
                      Recommended hospitals:
                    </p>
                    {msg.hospitals.map((hospital) => (
                      <div
                        key={hospital.id}
                        onClick={() => selectHospital(hospital)}
                        style={{
                          background: "#fff",
                          border: "2px solid #0f9580",
                          borderRadius: "12px",
                          padding: "12px",
                          marginBottom: "8px",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = "#d4a853";
                          el.style.transform = "translateY(-2px)";
                          el.style.boxShadow = "0 8px 24px rgba(14, 149, 128, 0.2)";
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = "#0f9580";
                          el.style.transform = "translateY(0)";
                          el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                        }}
                      >
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0d6457", marginBottom: "4px", textDecoration: "underline" }}>
                          🏥 {hospital.name}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#7a9a95", display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
                          <MapPin size={12} />
                          {hospital.location}
                        </div>

                        {hospital.matchedDepartment && (
                          <div style={{ marginBottom: "6px" }}>
                            <span style={{
                              fontSize: "0.75rem",
                              padding: "3px 8px",
                              background: "rgba(212, 168, 83, 0.15)",
                              color: "#a88b50",
                              borderRadius: "4px",
                              display: "inline-block",
                              fontWeight: 600,
                            }}>
                              ✓ Matched: {hospital.matchedDepartment}
                            </span>
                          </div>
                        )}

                        {hospital.specialties && hospital.specialties.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "6px 0" }}>
                            {hospital.specialties.slice(0, 3).map((s, i) => (
                              <span key={i} style={{
                                fontSize: "0.7rem",
                                padding: "2px 8px",
                                background: "#f0faf8",
                                color: "#0d6457",
                                borderRadius: "12px",
                                border: "1px solid rgba(14, 149, 128, 0.2)",
                              }}>
                                {s}
                              </span>
                            ))}
                            {hospital.specialties.length > 3 && (
                              <span style={{
                                fontSize: "0.7rem",
                                padding: "2px 8px",
                                background: "#f0faf8",
                                color: "#0d6457",
                                borderRadius: "12px",
                                border: "1px solid rgba(14, 149, 128, 0.2)",
                              }}>
                                +{hospital.specialties.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {hospital.departments && hospital.departments.length > 0 && (
                          <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#6b7a96" }}>
                            📋 {hospital.departments.length} departments available
                          </div>
                        )}

                        <div style={{
                          fontSize: "0.75rem",
                          color: "#0f9580",
                          marginTop: "6px",
                          fontStyle: "italic",
                          textAlign: "right",
                        }}>
                          Click to view {hospital.departments?.length ? "departments" : "doctors"} →
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Department button */}
                {msg.metadata?.action === "select_department" && (
                  <button
                    onClick={() => selectDepartment(msg.metadata?.hospital, msg.metadata?.department)}
                    style={{
                      alignSelf: "flex-start",
                      background: "#0f9580",
                      color: "white",
                      padding: "10px 16px",
                      borderRadius: "6px",
                      border: "none",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: "0 2px 8px rgba(14, 149, 128, 0.2)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#0d6457";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#0f9580";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    }}
                  >
                    👉 {msg.content} - Click to view doctors
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Quick action button for finding hospitals - only show in chat mode */}
          {bookingStep === "chat" && messages.length > 0 && !isLoading && (
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "8px" }}>
              <button
                onClick={startDoctorSearch}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #0f9580, #0d6457)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(14, 149, 128, 0.2)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 16px rgba(14, 149, 128, 0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 12px rgba(14, 149, 128, 0.2)";
                }}
              >
                🏥 Find Hospitals & Doctors
              </button>
            </div>
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #0f9580, #0d6457)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Stethoscope size={16} color="white" strokeWidth={2} />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "12px 15px",
                  background: "white",
                  borderRadius: "4px 18px 18px 18px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#0f9580",
                      animation: `pulse 1.4s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: "20px 28px",
            background: "#fff",
            borderTop: "1px solid rgba(200, 169, 110, 0.15)",
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          {bookingStep === "chat" ? (
            <>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askAI()}
                placeholder="Ask me about symptoms or health concerns..."
                style={{
                  flex: 1,
                  background: "#f5f3ef",
                  border: "1.5px solid rgba(200, 169, 110, 0.2)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "0.95rem",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  color: "#0f1e38",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(200, 169, 110, 0.5)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(200, 169, 110, 0.2)";
                }}
              />
              <button
                onClick={askAI}
                disabled={isLoading || !prompt.trim()}
                style={{
                  width: "44px",
                  height: "44px",
                  background: isLoading || !prompt.trim() ? "rgba(200, 169, 110, 0.3)" : "linear-gradient(145deg, #0d6457, #0f9580)",
                  border: "none",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  transition: "all 0.2s",
                  boxShadow: isLoading || !prompt.trim() ? "none" : "0 4px 12px rgba(14, 149, 128, 0.2)",
                }}
                title="Send"
              >
                <Send size={20} />
              </button>
            </>
          ) : bookingStep === "symptoms" ? (
            <>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe your symptoms in detail (e.g., 'I have severe headache with fever for 3 days')..."
                style={{
                  flex: 1,
                  background: "#f5f3ef",
                  border: "1.5px solid rgba(200, 169, 110, 0.2)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "0.95rem",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  color: "#0f1e38",
                  outline: "none",
                  resize: "none",
                  minHeight: "60px",
                  maxHeight: "100px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(200, 169, 110, 0.5)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(200, 169, 110, 0.2)";
                }}
              />
              <button
                onClick={analyzeSymptoms}
                disabled={isLoading || !problemDescription.trim()}
                style={{
                  minWidth: "80px",
                  height: "44px",
                  background: isLoading || !problemDescription.trim() ? "rgba(200, 169, 110, 0.3)" : "linear-gradient(145deg, #0d6457, #0f9580)",
                  border: "none",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: isLoading || !problemDescription.trim() ? "not-allowed" : "pointer",
                  flexShrink: 0,
                  transition: "all 0.2s",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  padding: "0 16px",
                }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Analyze"}
              </button>
              <button
                onClick={() => {
                  setBookingStep("chat");
                  setProblemDescription("");
                }}
                style={{
                  minWidth: "60px",
                  height: "44px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(200, 169, 110, 0.2)",
                  borderRadius: "12px",
                  color: "#0f1e38",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.2s",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(200, 169, 110, 0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.1)";
                }}
              >
                Back
              </button>
            </>
          ) : bookingStep === "hospital_selection" ? (
            <div style={{ fontSize: "0.9rem", color: "#7a9a95", textAlign: "center", width: "100%", padding: "8px" }}>
              ✓ Select a hospital above or{" "}
              <button
                onClick={() => setBookingStep("symptoms")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0f9580",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                describe more symptoms
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          30% { transform: translateY(-5px) scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}