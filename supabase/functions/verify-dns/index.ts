import { corsHeaders } from "../_shared/cors.ts";

// ── DNS-over-HTTPS providers (tried in order for redundancy)
const DOH_PROVIDERS = [
  (name: string, type: string) =>
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
  (name: string, type: string) =>
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,
];

interface DnsAnswer {
  type: number;   // 16 = TXT, 5 = CNAME, 1 = A
  data: string;
}

// Query DNS-over-HTTPS with fallback providers
async function dnsQuery(
  name: string,
  type: "TXT" | "CNAME" | "A"
): Promise<DnsAnswer[]> {
  for (const buildUrl of DOH_PROVIDERS) {
    try {
      const res = await fetch(buildUrl(name, type), {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data.Answer)) {
        return data.Answer.map((a: Record<string, unknown>) => ({
          type: a.type as number,
          data: String(a.data ?? "").replace(/^"|"$/g, "").trim(), // strip surrounding quotes from TXT
        }));
      }
      return [];
    } catch {
      // try next provider
    }
  }
  return [];
}

// Resolve final A record after following CNAME chain (max 3 hops)
async function resolveA(domain: string, hops = 0): Promise<string[]> {
  if (hops > 3) return [];
  const answers = await dnsQuery(domain, "A");
  if (answers.length === 0) {
    // Maybe a CNAME, follow it
    const cnames = await dnsQuery(domain, "CNAME");
    if (cnames.length > 0) return resolveA(cnames[0].data.replace(/\.$/, ""), hops + 1);
    return [];
  }
  return answers.map((a) => a.data);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { ...corsHeaders, "Access-Control-Allow-Methods": "GET, OPTIONS" } });
  }

  try {
    const url = new URL(req.url);
    const domain    = (url.searchParams.get("domain") ?? "").trim().toLowerCase()
      .replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    const txtToken  = (url.searchParams.get("token") ?? "").trim();
    const checkType = (url.searchParams.get("check") ?? "txt") as "txt" | "cname" | "all";

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: Record<string, unknown> = { domain };

    // ── TXT verification ──────────────────────────────────
    if (checkType === "txt" || checkType === "all") {
      if (!txtToken) {
        result.txt = { verified: false, error: "token param required for TXT check" };
      } else {
        const txtAnswers = await dnsQuery(domain, "TXT");
        const found = txtAnswers.some((a) => a.data === txtToken);
        result.txt = {
          verified: found,
          records: txtAnswers.map((a) => a.data),
          expected: txtToken,
          message: found
            ? "✅ TXT record found — ownership verified!"
            : txtAnswers.length === 0
              ? "⏳ No TXT records found yet. DNS may still be propagating (up to 48h)."
              : "⏳ TXT record found but token doesn't match. Make sure you copied the value exactly.",
        };
      }
    }

    // ── CNAME / A record check ────────────────────────────
    if (checkType === "cname" || checkType === "all") {
      const wwwDomain = domain.startsWith("www.") ? domain : `www.${domain}`;

      // Check CNAME for www
      const cnameAnswers = await dnsQuery(wwwDomain, "CNAME");
      const expectedCname = "cname.vercel-dns.com";
      const cnameOk = cnameAnswers.some((a) =>
        a.data.replace(/\.$/, "").toLowerCase() === expectedCname
      );

      // Check A record for root
      const aAnswers = await resolveA(domain);
      const expectedA = "76.76.21.21";
      const aOk = aAnswers.includes(expectedA);

      result.cname = {
        verified: cnameOk,
        domain: wwwDomain,
        records: cnameAnswers.map((a) => a.data),
        expected: expectedCname,
        message: cnameOk
          ? "✅ CNAME record verified!"
          : cnameAnswers.length === 0
            ? "⏳ No CNAME record found for www. Add it at your registrar."
            : `⏳ CNAME found but points to "${cnameAnswers[0]?.data}" — expected "${expectedCname}".`,
      };

      result.a = {
        verified: aOk,
        domain,
        records: aAnswers,
        expected: expectedA,
        message: aOk
          ? "✅ A record verified!"
          : aAnswers.length === 0
            ? "⏳ No A record found for root domain."
            : `⏳ A record found (${aAnswers.join(", ")}) but expected ${expectedA}.`,
      };
    }

    // Overall: verified only when both TXT + DNS point correctly
    const txtOk    = (result.txt    as Record<string, unknown> | undefined)?.verified ?? true;
    const cnameOk2 = (result.cname  as Record<string, unknown> | undefined)?.verified ?? true;
    const aOk2     = (result.a      as Record<string, unknown> | undefined)?.verified ?? true;
    result.allVerified = Boolean(txtOk && (cnameOk2 || aOk2));

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
