import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
  // Move userText outside so the 'catch' block can see it
  let userText = "";

  try {
    const body = await req.json();
    userText = body.prompt || "";

    if (!userText) {
      return NextResponse.json({ text: "Please enter a message." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(
      `You are the Sewa-Setu Medical Assistant. 
       Your goal is to help users find the best health checkup packages for their parents in Nepal.
       
       User says: "${userText}"
       
       Instructions:
       - Be polite and helpful.
       - If they ask about a symptom (like fever), suggest a general checkup.
       - Keep answers short (max 3 sentences).`
    );

    // FIX: Define aiText properly before returning it
    const response = await result.response;
    const aiText = response.text();

    return NextResponse.json({ text: aiText });

  } catch (error: any) {
    console.error("Gemini Error:", error.message);
    
    try {
        // Fallback using the 'flash-latest' alias
        const fallback = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const res = await fallback.generateContent(userText || "Hello");
        const fallbackText = res.response.text();
        
        return NextResponse.json({ text: fallbackText });
    } catch (e: any) {
        return NextResponse.json({ text: "Service is temporarily busy. Please try again." });
    }
  }
}