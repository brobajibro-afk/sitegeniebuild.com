f = open('supabase/functions/large-language-model/index.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

# Move credit deduction to AFTER successful API call
c = c.replace(
    '''  const model = DEFAULT_MODEL;
  await supabase.from("profiles").update({ token_balance: profile.token_balance - TOKEN_COST }).eq("id", user.id);
  await supabase.from("token_transactions").insert({ user_id: user.id, amount: -TOKEN_COST, type: "generation", description: `AI generation (${model})` });

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");''',
    '''  const model = DEFAULT_MODEL;

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");'''
)

c = c.replace(
    '''  return new Response(upstream.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });''',
    '''  // Deduct credits only after successful response
  await supabase.from("profiles").update({ token_balance: profile.token_balance - TOKEN_COST }).eq("id", user.id);
  await supabase.from("token_transactions").insert({ user_id: user.id, amount: -TOKEN_COST, type: "generation", description: `AI generation (${model})` });

  return new Response(upstream.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });'''
)

f = open('supabase/functions/large-language-model/index.ts', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done')