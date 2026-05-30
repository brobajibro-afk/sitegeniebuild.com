import { corsHeaders } from "../_shared/cors.ts";

// GET ?token=xxx&projectId=xxx&domain=xxx
// Returns verification status for a single domain
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token     = url.searchParams.get("token")?.trim() ?? "";
    const projectId = url.searchParams.get("projectId")?.trim() ?? "";
    const domain    = url.searchParams.get("domain")?.trim().toLowerCase()
      .replace(/^https?:\/\//i, "").replace(/\/.*$/, "") ?? "";

    if (!token || !projectId || !domain) {
      return new Response(
        JSON.stringify({ error: "token, projectId and domain are all required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /v9/projects/{projectId}/domains/{domain}
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      // 404 means domain not yet added
      if (res.status === 404) {
        return new Response(
          JSON.stringify({
            domain,
            verified: false,
            status: "not_found",
            message: "Domain not found on this project. Deploy again with this domain to add it.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: data?.error?.message ?? "Vercel API error" }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // data.verified = true means Vercel has confirmed DNS resolves
    const verified: boolean = data.verified === true;

    // Collect any verification challenges (TXT records Vercel wants)
    const challenges: { type: string; domain: string; value: string }[] =
      Array.isArray(data.verification)
        ? data.verification.map((v: Record<string, string>) => ({
            type: v.type ?? "TXT",
            domain: v.domain ?? domain,
            value: v.value ?? "",
          }))
        : [];

    return new Response(
      JSON.stringify({
        domain,
        verified,
        status: verified ? "verified" : "pending",
        message: verified
          ? "✅ Domain is verified and live!"
          : "⏳ DNS not yet propagated — try again in a few minutes.",
        cnameTarget: data.cname ?? "cname.vercel-dns.com",
        aRecord:     "76.76.21.21",
        challenges,          // TXT records Vercel needs if unverified
        redirect:    data.redirect ?? null,
        gitBranch:   data.gitBranch ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
