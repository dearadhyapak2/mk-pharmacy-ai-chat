import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received messages:", JSON.stringify(messages));

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
            content: `आप Mk pharmacy Hub AI हैं - एक हिंदी भाषा का स्वास्थ्य सहायक।

आपके नियम:
1. हमेशा हिंदी में जवाब दें, सरल और आसान शब्दों में
2. दवाइयों की जानकारी, स्वास्थ्य सलाह, घरेलू उपचार के बारे में बताएं
3. जवाब छोटे और सटीक रखें
4. यदि कोई गंभीर स्वास्थ्य समस्या हो तो डॉक्टर से मिलने की सलाह दें
5. हमेशा विनम्र और मददगार रहें

याद रखें: आप एक स्वास्थ्य सहायक हैं, डॉक्टर नहीं। गंभीर मामलों में हमेशा डॉक्टर की सलाह लेने को कहें।`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "बहुत ज्यादा requests, कृपया थोड़ी देर बाद कोशिश करें।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits समाप्त हो गए हैं।" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI से जुड़ने में समस्या हुई" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
