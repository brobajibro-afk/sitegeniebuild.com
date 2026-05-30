import { corsHeaders } from "../_shared/cors.ts";

interface DomainAssignResult {
  domain: string;
  assigned: boolean;
  cnameTarget: string;
  aRecord: string;
  error?: string;
  alreadyExists?: boolean;
}

interface DeployRequest {
  token: string;
  projectName: string;
  files: Record<string, string>;
  customDomains?: string[];   // multi-domain support (replaces single customDomain)
  customDomain?: string;      // backwards compat single domain
}

async function assignDomain(
  token: string,
  projectId: string,
  domain: string
): Promise<DomainAssignResult> {
  const cleanDomain = domain.trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  if (!cleanDomain) return { domain, assigned: false, cnameTarget: "", aRecord: "" };

  try {
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: cleanDomain }),
      }
    );
    const data = await res.json();

    if (res.ok) {
      return {
        domain: cleanDomain,
        assigned: true,
        cnameTarget: data.cname ?? "cname.vercel-dns.com",
        aRecord: "76.76.21.21",
      };
    }

    const code = data?.error?.code ?? "";
    const alreadyExists = code === "domain_already_in_use" || code === "domain_conflict";
    return {
      domain: cleanDomain,
      assigned: false,
      cnameTarget: "cname.vercel-dns.com",
      aRecord: "76.76.21.21",
      error: alreadyExists
        ? "Domain already linked — verify DNS below."
        : (data?.error?.message ?? "Could not assign domain automatically."),
      alreadyExists,
    };
  } catch {
    return {
      domain: cleanDomain,
      assigned: false,
      cnameTarget: "cname.vercel-dns.com",
      aRecord: "76.76.21.21",
      error: "Domain assignment network error.",
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: DeployRequest = await req.json();
    const { token, projectName, files } = body;

    // Normalise domains: accept array or single string
    const rawDomains: string[] = Array.isArray(body.customDomains)
      ? body.customDomains
      : body.customDomain
      ? [body.customDomain]
      : [];
    const domains = rawDomains.map((d) =>
      d.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase()
    ).filter(Boolean);

    if (!token?.trim()) {
      return new Response(
        JSON.stringify({ error: "Vercel token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!projectName?.trim()) {
      return new Response(
        JSON.stringify({ error: "Project name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileEntries = Object.entries(files ?? {});
    if (fileEntries.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files to deploy" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const slug = projectName.toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Build file list
    const vercelFiles = fileEntries.map(([path, content]) => ({
      file: path.startsWith("/") ? path.slice(1) : path,
      data: content,
      encoding: "utf8",
    }));

    const hasIndexHtml = fileEntries.some(([p]) =>
      p === "/index.html" || p === "index.html" ||
      p === "/public/index.html" || p === "public/index.html"
    );
    if (!hasIndexHtml) {
      vercelFiles.push({
        file: "index.html",
        data: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${projectName}</title></head><body><div id="root"></div></body></html>`,
        encoding: "utf8",
      });
    }

    // Step 1: Deploy
    const vercelRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: slug,
        files: vercelFiles,
        projectSettings: {
          framework: null,
          buildCommand: null,
          outputDirectory: null,
          devCommand: null,
          installCommand: null,
        },
        target: "production",
      }),
    });

    const vercelData = await vercelRes.json();

    if (!vercelRes.ok) {
      return new Response(
        JSON.stringify({
          error: vercelData?.error?.message || vercelData?.message || "Vercel deployment failed",
        }),
        { status: vercelRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deployUrl = vercelData.url
      ? `https://${vercelData.url}`
      : `https://${slug}.vercel.app`;

    const projectId: string | undefined = vercelData.projectId;

    // Step 2: Assign all domains in parallel
    let domainResults: DomainAssignResult[] = [];
    if (domains.length > 0 && projectId) {
      domainResults = await Promise.all(
        domains.map((d) => assignDomain(token, projectId, d))
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: deployUrl,
        deploymentId: vercelData.id,
        projectId,
        readyState: vercelData.readyState,
        domains: domainResults,
        // backwards compat: keep single `domain` field if only one was requested
        domain: domainResults[0] ?? { assigned: false },
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
