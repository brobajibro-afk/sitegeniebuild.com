import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const PACKAGES: Record<number, number> = {
  30000: 600,
  50000: 1000,
  100000: 2000,
  500000: 9000,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { amountPaise } = await req.json();
    const tokens = PACKAGES[amountPaise];
    if (!tokens) {
      return new Response(JSON.stringify({ error: "Invalid package" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

    console.log("keyId prefix:", keyId.slice(0, 15), "hasSecret:", keySecret.length > 0);

    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: "Payment not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const credentials = btoa(`${keyId}:${keySecret}`);

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `sg_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: { userId: user.id, tokens: String(tokens) },
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.text();
      console.error("Razorpay error:", err, "keyId:", keyId.slice(0, 15), "hasSecret:", keySecret.length > 0);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = await rzpRes.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabaseAdmin.from("razorpay_orders").insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount_paise: amountPaise,
      tokens,
      status: "created",
    });

    return new Response(
      JSON.stringify({ orderId: order.id, amount: amountPaise, tokens, keyId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Exception:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});