import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = base64Encode(imageBuffer);
    const mimeType = imageFile.type || "image/jpeg";

    // Step 1: Describe the character in the drawing using vision
    const describeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
              {
                type: "text",
                text: "Describe the main character or creature drawn in this image in 2-3 sentences. Focus on its appearance, colors, shape, and any distinctive features. This description will be used to recreate the character as a clean game sprite.",
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    let description = "a wonderful hand-drawn character";
    if (describeResponse.ok) {
      const descResult = await describeResponse.json();
      description = descResult.choices?.[0]?.message?.content || description;
    }

    // Step 2: Generate a clean transparent-background sprite based on the description
    const imageGenResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
              {
                type: "text",
                text: `Recreate this drawing as a clean, colorful cartoon character sprite on a completely transparent/white background. Keep the same character design, colors and style from the original drawing. Make it look like a fun 2D game character with clear outlines. Pure white background only, no shadows, no ground, no extra elements.`,
              },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!imageGenResponse.ok) {
      const errorText = await imageGenResponse.text();
      console.error("Image gen error:", imageGenResponse.status, errorText);

      if (imageGenResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (imageGenResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Please add credits to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback: return original image
      console.log("Falling back to original image");
      return new Response(
        JSON.stringify({
          success: true,
          imageData: `data:${mimeType};base64,${base64Image}`,
          description,
          isExtracted: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const genResult = await imageGenResponse.json();
    console.log("Image gen result structure:", JSON.stringify(Object.keys(genResult)));

    // Extract the generated image from the response
    // Gemini image models can return images in multiple formats:
    // 1. Array content with image_url parts
    // 2. Array content with inline_data (base64) parts
    // 3. String content with a data URI embedded
    const content = genResult.choices?.[0]?.message?.content;
    let extractedImageData: string | null = null;

    if (Array.isArray(content)) {
      for (const part of content) {
        // Format 1: image_url type
        if (part.type === "image_url" && part.image_url?.url) {
          extractedImageData = part.image_url.url;
          break;
        }
        // Format 2: inline_data with base64
        if (part.type === "image" && part.source?.type === "base64") {
          extractedImageData = `data:${part.source.media_type || "image/png"};base64,${part.source.data}`;
          break;
        }
        // Format 3: inline_data Gemini style
        if (part.inlineData?.mimeType && part.inlineData?.data) {
          extractedImageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } else if (typeof content === "string") {
      // Check if the string itself contains a data URI
      const match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/]+=*/);
      if (match) {
        extractedImageData = match[0];
      }
    }

    console.log("Extracted image:", extractedImageData ? `Yes (${extractedImageData.substring(0, 50)}...)` : "No");

    if (!extractedImageData) {
      // Fallback to original if image generation didn't produce an image
      console.log("No image in response, falling back to original");
      return new Response(
        JSON.stringify({
          success: true,
          imageData: `data:${mimeType};base64,${base64Image}`,
          description,
          isExtracted: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageData: extractedImageData,
        description,
        isExtracted: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("remove-background error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
