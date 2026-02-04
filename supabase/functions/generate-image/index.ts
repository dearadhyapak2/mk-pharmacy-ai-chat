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
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "कृपया image के लिए description दें" }),
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

    console.log("Generating image for prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: `Generate an image: ${prompt}`,
          },
        ],
        modalities: ["image", "text"],
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
        JSON.stringify({ error: "Image generate करने में समस्या हुई" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("Image generation response:", JSON.stringify(data, null, 2));

    // Try multiple possible response structures
    let imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    // Alternative structure
    if (!imageUrl) {
      imageUrl = data.choices?.[0]?.message?.content?.find?.(
        (part: any) => part.type === "image_url"
      )?.image_url?.url;
    }
    
    // Another alternative - direct image in content
    if (!imageUrl && Array.isArray(data.choices?.[0]?.message?.content)) {
      const imagePart = data.choices[0].message.content.find(
        (part: any) => part.type === "image" || part.image_url
      );
      if (imagePart) {
        imageUrl = imagePart.image_url?.url || imagePart.url;
      }
    }

    // Check for inline_data format
    if (!imageUrl && data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part.inline_data?.data) {
            imageUrl = `data:${part.inline_data.mime_type || 'image/png'};base64,${part.inline_data.data}`;
            break;
          }
        }
      }
    }

    const textContent = typeof data.choices?.[0]?.message?.content === 'string' 
      ? data.choices[0].message.content 
      : null;

    if (!imageUrl) {
      console.error("No image found in response. Full response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: "Image generate नहीं हो पाई, कृपया फिर से कोशिश करें",
          debug: "No image URL found in response" 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Image URL found successfully");

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        message: textContent || "यहाँ आपकी image है!" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(
      JSON.stringify({ error: "एक तकनीकी समस्या हुई, कृपया बाद में कोशिश करें" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
