import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        status: "error",
        message: "GOOGLE_GENERATIVE_AI_API_KEY not set in .env"
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Simple test
    const result = await model.generateContent("Hello, are you working?");
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      status: "ok",
      message: "Gemini API is working",
      apiKey: apiKey.substring(0, 10) + "...",
      response: text,
    });
  } catch (error: any) {
    console.error("Health check error:", error);
    return NextResponse.json({
      status: "error",
      message: error.message,
      hint: "Check your API key and rate limits",
    }, { status: 500 });
  }
}
