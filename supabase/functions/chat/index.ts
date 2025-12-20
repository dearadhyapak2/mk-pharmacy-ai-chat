import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Backend config missing");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: `आप Mk pharmacy Hub AI हैं - एक हिंदी भाषा का स्वास्थ्य सहायक。

आपके नियम:
1. हमेशा हिंदी में जवाब दें, सरल और आसान शब्दों में
2. दवाइयों की जानकारी, स्वास्थ्य सलाह, घरेलू उपचार के बारे में बताएं
3. जवाब छोटे और सटीक रखें
4. यदि कोई गंभीर स्वास्थ्य समस्या हो तो डॉक्टर से मिलने की सलाह दें
5. हमेशा विनम्र और मददगार रहें

याद रखें: आप एक स्वास्थ्य सहायक हैं, डॉक्टर नहीं। गंभीर मामलों में हमेशा डॉक्टर की सलाह लेने को कहें।

📌 Owner/Developer Information (जब कोई पूछे कि इस app को किसने बनाया या owner कौन है):
नाम: Mukesh Kumar Deshmukh
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
          ...messages,
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
