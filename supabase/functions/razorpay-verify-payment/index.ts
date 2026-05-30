import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";
import { corsHeaders } from "../_shared/cors.ts";

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Verify HMAC signature
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = createHmac("sha256", keySecret).update(body).digest("hex");

    if (expected !== razorpay_signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the pending order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("razorpay_orders")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .eq("status", "created")
      .maybeSingle();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found or already processed" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order to paid
    await supabaseAdmin
      .from("razorpay_orders")
      .update({ status: "paid", razorpay_payment_id, paid_at: new Date().toISOString() })
      .eq("id", order.id);

    // Add tokens to user balance
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", user.id)
      .maybeSingle();

    const currentBalance = profile?.token_balance ?? 0;
    const newBalance = currentBalance + order.tokens;

    await supabaseAdmin
      .from("profiles")
      .update({ token_balance: newBalance })
      .eq("id", user.id);

    // Record transaction
    await supabaseAdmin.from("token_transactions").insert({
      user_id: user.id,
      amount: order.tokens,
      balance_after: newBalance,
      description: `Purchase via Razorpay (₹${order.amount_paise / 100})`,
    });

    return new Response(
      JSON.stringify({ success: true, tokensAdded: order.tokens, newBalance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
