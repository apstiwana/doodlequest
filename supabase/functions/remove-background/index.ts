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
    const REMOVEBG_API_KEY = Deno.env.get("REMOVEBG_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!REMOVEBG_API_KEY) throw new Error("REMOVEBG_API_KEY is not configured");

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

    // Step 1: Describe the character using Gemini Vision
    let description = "a wonderful hand-drawn character";
    try {
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
                  text: "Describe the main character or creature drawn in this image in 2-3 sentences. Focus on its appearance, colors, shape, and any distinctive features. This description will be used as a game character's personality context.",
                },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      if (describeResponse.ok) {
        const descResult = await describeResponse.json();
        description = descResult.choices?.[0]?.message?.content || description;
      }
    } catch (e) {
      console.warn("Description step failed, using default:", e);
    }

    // Step 2: Remove background using remove.bg
    const removeBgFormData = new FormData();
    removeBgFormData.append("image_file", new Blob([imageBuffer], { type: mimeType }), imageFile.name || "image.png");
    removeBgFormData.append("size", "auto");

    const removeBgResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVEBG_API_KEY,
      },
      body: removeBgFormData,
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      console.error("remove.bg error:", removeBgResponse.status, errorText);

      if (removeBgResponse.status === 402) {
        return new Response(JSON.stringify({ error: "remove.bg credits exhausted. Please check your remove.bg account." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (removeBgResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback: return original image
      console.log("remove.bg failed, falling back to original image");
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

    // remove.bg returns raw PNG binary
    const pngBuffer = await removeBgResponse.arrayBuffer();
    const pngBase64 = base64Encode(pngBuffer);
    const extractedImageData = `data:image/png;base64,${pngBase64}`;

    console.log("remove.bg success, PNG size:", pngBuffer.byteLength, "bytes");

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
