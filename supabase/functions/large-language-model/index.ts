// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_COST = 60;

const ALLOWED_MODELS: Record<string, string> = {
  "claude-sonnet-4-20250514": "claude-sonnet-4-20250514",
  "gemini-2.5-pro": "gemini-2.5-pro",
  "gpt-4o": "gpt-4o",
  "deepseek-chat": "deepseek-chat",
  "grok-3-mini": "grok-3-mini",
};

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const QUALITY_BOOST = `You are an expert React/TypeScript developer. Generate a complete, beautiful, production-ready app.
DESIGN RULES:
- Use Tailwind CSS for ALL styling
- Use lucide-react for icons
- Make it visually stunning with gradients, shadows, animations
- Include realistic sample data
- Make it fully functional with useState/useEffect
- Mobile responsive
- NO placeholder text`;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profile } = await supabase
    .from("profiles").select("token_balance").eq("id", user.id).single();

  if (!profile || profile.token_balance < TOKEN_COST) {
    return new Response(JSON.stringify({
      error: "insufficient_credits",
      message: `You need ${TOKEN_COST} credits. You have ${profile?.token_balance ?? 0}.`,
      current_balance: profile?.token_balance ?? 0,
      required: TOKEN_COST,
    }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let contents, systemPrompt, requestedModel;
  try {
    const body = await req.json();
    contents = body.contents;
    systemPrompt = body.systemPrompt;
    requestedModel = body.model;
    if (!Array.isArray(contents) || contents.length === 0) throw new Error("Missing contents");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Pick model — use requested if allowed, else default
  const model = ALLOWED_MODELS[requestedModel] ?? DEFAULT_MODEL;

  await supabase.from("profiles").update({ token_balance: profile.token_balance - TOKEN_COST }).eq("id", user.id);
  await supabase.from("token_transactions").insert({
    user_id: user.id, amount: -TOKEN_COST, type: "generation",
    description: `AI generation (${model})`,
  });

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) {
    await supabase.from("profiles").update({ token_balance: profile.token_balance }).eq("id", user.id);
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const messages = [];
  const combinedSystem = (systemPrompt || "") + "\n\n" + QUALITY_BOOST;
  messages.push({ role: "system", content: combinedSystem });

  for (const content of contents) {
    const role = content.role === "model" ? "assistant" : "user";
    const text = content.parts?.map((p: any) => p.text).join("") || "";
    messages.push({ role, content: text });
  }

  console.log("Using model:", model);

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 16000,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    await supabase.from("profiles").update({ token_balance: profile.token_balance }).eq("id", user.id);
    return new Response(JSON.stringify({ error: `Upstream error: ${upstream.status}` }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(upstream.body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
});