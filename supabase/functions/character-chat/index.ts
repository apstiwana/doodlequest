import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const { message, playerName, scene, characterDescription, triggerType } = await req.json();

    const sceneDescriptions: Record<string, string> = {
      forest: "a magical forest with tall trees and chirping birds",
      underwater: "the underwater ocean with colorful fish and coral reefs",
      city: "a bustling city with tall buildings and busy streets",
      moon: "the quiet moon with craters and Earth visible in the sky",
      space: "outer space with stars, planets, and floating asteroids",
    };

    const sceneDesc = sceneDescriptions[scene] || scene;

    const systemPrompt = `You are ${characterDescription || "a friendly character"} that has come to life from a child's drawing! You are adventuring with your best friend ${playerName}.

PERSONALITY:
- You are playful, enthusiastic, and sweet
- You use simple, age-appropriate language (5-8 year old level)
- You are excited about everything you see in the current scene
- You call ${playerName} by name often
- You say short, fun sentences (max 2-3 sentences)
- You use emojis sometimes 🌟

CURRENT LOCATION: You are currently in ${sceneDesc}.

TRIGGER TYPE: ${triggerType || "chat"}
- If "scene_change": React with excitement about the new place you just arrived at
- If "idle": Say something encouraging or notice something interesting in ${sceneDesc}
- If "jump_land": React to the fun jump you just did
- If "edge_reached": Comment on exploring and going on an adventure
- If "chat": Respond naturally to what ${playerName} said

Keep your response SHORT (1-3 sentences max). Be warm, fun, and encouraging!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message || "Say hello!" },
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Please add credits to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content || "Wow, this is so fun! 🌟";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("character-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
