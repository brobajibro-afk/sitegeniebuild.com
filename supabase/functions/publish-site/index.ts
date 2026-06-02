// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const { files, projectName, projectId, framework } = await req.json();
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 7);
  const vercelToken = Deno.env.get("VERCEL_TOKEN");

  const vercelFiles = Object.entries(files).map(([path, content]) => ({
    file: path.startsWith("/") ? path.slice(1) : path,
    data: content,
  }));

  vercelFiles.push({
    file: "index.html",
    data: "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>" + projectName + "</title><script src=\"https://cdn.tailwindcss.com\"></script></head><body><div id=\"root\"></div></body></html>",
  });

  const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: { "Authorization": "Bearer " + vercelToken, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: slug,
      files: vercelFiles,
      projectSettings: { framework: null },
      target: "production",
    }),
  });

  const deploy = await deployRes.json();
  if (!deployRes.ok) {
    return new Response(JSON.stringify({ error: deploy.error?.message || "Deploy failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  await supabase.from("published_sites").insert({
    slug, user_id: user.id, project_id: projectId || null, files, framework, project_name: projectName,
  });

  return new Response(JSON.stringify({ url: "https://" + slug + ".sitegeniebuild.com", deployUrl: "https://" + deploy.url, slug }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
