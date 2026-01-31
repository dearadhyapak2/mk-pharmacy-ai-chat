import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema - validate message structure and limits
const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES_COUNT = 50;

interface MessageContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

interface ChatMessage {
  role: string;
  content: string | MessageContent[];
}

function validateMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    throw new Error("Invalid input format");
  }
  
  if (messages.length > MAX_MESSAGES_COUNT) {
    throw new Error("Too many messages");
  }
  
  const validRoles = ["user", "assistant", "system"];
  
  return messages.map((msg, index) => {
    if (typeof msg !== "object" || msg === null) {
      throw new Error(`Invalid message at index ${index}`);
    }
    
    const { role, content } = msg as { role?: unknown; content?: unknown };
    
    if (typeof role !== "string" || !validRoles.includes(role)) {
      throw new Error(`Invalid role at index ${index}`);
    }
    
    // Content can be string or array (for multimodal messages)
    if (typeof content === "string") {
      if (content.length === 0) {
        throw new Error(`Invalid content at index ${index}`);
      }
      if (content.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Message too long at index ${index}`);
      }
      return { role, content };
    }
    
    // Handle multimodal content (array of text/image parts)
    if (Array.isArray(content)) {
      const validContent = content.every((part: unknown) => {
        if (typeof part !== "object" || part === null) return false;
        const p = part as { type?: string; text?: string; image_url?: { url?: string } };
        if (p.type === "text" && typeof p.text === "string") return true;
        if (p.type === "image_url" && p.image_url?.url) return true;
        return false;
      });
      
      if (!validContent) {
        throw new Error(`Invalid multimodal content at index ${index}`);
      }
      
      return { role, content: content as MessageContent[] };
    }
    
    throw new Error(`Invalid content type at index ${index}`);
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication is optional - allow both logged-in and guest users
    const authHeader = req.headers.get("Authorization");
    let userId = "guest";

    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      }
    }

    // Parse and validate input
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "अमान्य request format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const { messages: rawMessages } = requestBody as { messages?: unknown };
    
    let validatedMessages: ChatMessage[];
    try {
      validatedMessages = validateMessages(rawMessages);
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return new Response(
        JSON.stringify({ error: "कृपया अपना message जाँचें और फिर से भेजें" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "सेवा अस्थायी रूप से अनुपलब्ध है" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Processing chat request for user:", userId, "messages:", validatedMessages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `आप Fetter AI हैं - YouTube channel "Fetter Hub" के मालिक Mukesh Kumar Deshmukh द्वारा निर्मित AI Assistant।

आपके नियम:
1. हमेशा हिंदी में जवाब दें, सरल और आसान शब्दों में
2. दवाइयों की जानकारी, स्वास्थ्य सलाह, घरेलू उपचार के बारे में बताएं
3. जवाब छोटे और सटीक रखें
4. यदि कोई गंभीर स्वास्थ्य समस्या हो तो डॉक्टर से मिलने की सलाह दें
5. हमेशा विनम्र और मददगार रहें

📸 Photo Analysis:
- जब user photo/image भेजे, तो उसका detailed analysis हिंदी में दें
- Photo में दिखने वाली चीज़ों को identify करें
- Medical/health related photos के लिए relevant जानकारी दें
- Text/document photos के लिए OCR जैसा काम करें और text extract करें

याद रखें: आप एक स्वास्थ्य सहायक हैं, डॉक्टर नहीं। गंभीर मामलों में हमेशा डॉक्टर की सलाह लेने को कहें।

📌 Owner/Developer Information (जब कोई पूछे कि इस app को किसने बनाया या owner कौन है):
नाम: Mukesh Kumar Deshmukh
YouTube Channel: Fetter Hub
पता: Village Changori, Post Anjora, District Durg, Chhattisgarh

📱 Contact & Social Media:
• Instagram: https://www.instagram.com/mkpharmacyhub
• YouTube: https://youtube.com/@mkpharmacyhub
• Telegram: @MkPharmacyHub
• ATOplay: https://atoplay.com/channels/479e37e1-f0c0-4864-b1f7-99d5e9c1a906
• LinkedIn: https://www.linkedin.com/in/mk-pharmacy-hub-686031360
• Twitter/X: https://x.com/MkPharmacyHub
• Facebook: https://www.facebook.com/MkPharmacyHub
• Snapchat: mkpharmacyhub1`,
          },
          ...validatedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "बहुत ज्यादा requests, कृपया थोड़ी देर बाद कोशिश करें।" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "सेवा अस्थायी रूप से अनुपलब्ध है।" }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI से जुड़ने में समस्या हुई" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "एक तकनीकी समस्या हुई, कृपया बाद में कोशिश करें" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
