// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_COST = 60;
const DEFAULT_MODEL = "anthropic/claude-sonnet-4-5";

const QUALITY_BOOST = `You are a code generation API. You MUST respond with ONLY a valid JSON object. No explanation, no markdown, no backticks, no text before or after.

The JSON must have file paths as keys and complete file contents as string values.

REQUIRED FORMAT (respond with exactly this structure):
{"/App.tsx": "complete file content here", "/components/Header.tsx": "complete file content here"}

RULES:
- Output ONLY the JSON object starting with { and ending with }
- Use Tailwind CSS for styling
- Use lucide-react for icons  
- Make it beautiful with gradients and animations
- Include realistic sample data
- Fully functional with useState/useEffect
- Mobile responsive
- NEVER output anything except the JSON object`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const authHeader = req.headers.get("authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: profile } = await supabase.from("profiles").select("token_balance").eq("id", user.id).single();
  if (!profile || profile.token_balance < TOKEN_COST) {
    return new Response(JSON.stringify({ error: "insufficient_credits", current_balance: profile?.token_balance ?? 0, required: TOKEN_COST }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let contents, systemPrompt, requestedModel;
  try {
    const body = await req.json();
    contents = body.contents;
    systemPrompt = body.systemPrompt;
    requestedModel = body.model;
    if (!Array.isArray(contents) || contents.length === 0) throw new Error("Missing contents");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const model = DEFAULT_MODEL;

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const messages = [];
  const combinedSystem = (systemPrompt || "") + "\n\n" + QUALITY_BOOST;
  messages.push({ role: "system", content: combinedSystem });
  for (const content of contents) {
    const role = content.role === "model" ? "assistant" : "user";
    const text = content.parts?.map((p) => p.text).join("") || "";
    messages.push({ role, content: text });
  }

  console.log("Using model:", model);
  console.log("API key exists:", !!apiKey);
  console.log("Messages count:", messages.length);

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({ model, messages, stream: false, max_tokens: 16000 }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    console.error("Upstream error:", upstream.status, errText);
    await supabase.from("profiles").update({ token_balance: profile.token_balance }).eq("id", user.id);
    return new Response(JSON.stringify({ error: "Upstream error: " + upstream.status, detail: errText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Deduct credits only after successful response
  await supabase.from("profiles").update({ token_balance: profile.token_balance - TOKEN_COST }).eq("id", user.id);
  await supabase.from("token_transactions").insert({ user_id: user.id, amount: -TOKEN_COST, type: "generation", description: `AI generation (${model})` });

  const data = await upstream.json();
  const text = data.choices[0]?.message?.content || '';
  
  // Extract JSON from markdown fences
  let jsonText = text;
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonText = fenceMatch[1];
  
  let files = {};
  try {
    files = JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse files:", e.message);
  }
  
  return new Response(JSON.stringify({ files }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
