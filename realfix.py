f = open('src/lib/ai-agents.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''  const data = await res.json();
  if (data.files && Object.keys(data.files).length > 0) {
    generatedText = JSON.stringify(data.files);
    onStreamChunk(`✅ Generated ${Object.keys(data.files).length} files!\\n`);
  } else if (data.text) {
    generatedText = data.text;
  }

  onStepUpdate("ui", "completed");

  // Step 4: Backend
  onStepUpdate("backend", "running");
  const backendPrompt = `For the app: "${userPrompt}", describe the backend/database schema needed. List: tables, columns, relationships, and any API endpoints. Format as structured SQL + REST API spec.`;
  const backendOutput = await collectStreamText(
    [{ role: "user", parts: [{ text: backendPrompt }] }],
    "You are a backend architect. Provide a concise database schema and API spec.",
    signal
  );
  onStepUpdate("backend", "completed");
  onStreamChunk(`\\n⚙️ **Backend schema generated**\\n\\n${backendOutput.slice(0, 200)}...\\n\\n`);

  // Step 5: Fix — parse files, retry once if needed
  onStepUpdate("fix", "running");
  console.log("✅ RAW RESPONSE:"), generatedText.slice(0,500));
  console.log('GENERATED TEXT LENGTH:', generatedText.length);
  console.log('GENERATED TEXT SAMPLE:', generatedText.slice(0, 300));
  let files = parseFilesFromResponse(generatedText);'''

new = '''  const data = await res.json();
  
  // If backend already parsed files, use directly
  if (data.files && Object.keys(data.files).length > 0) {
    onStreamChunk(`✅ Generated ${Object.keys(data.files).length} files!\\n`);
    onStepUpdate("ui", "completed");
    onStepUpdate("backend", "running");
    const backendPrompt = `For the app: "${userPrompt}", describe the backend/database schema needed.`;
    const backendOutput = await collectStreamText(
      [{ role: "user", parts: [{ text: backendPrompt }] }],
      "You are a backend architect.",
      signal
    );
    onStepUpdate("backend", "completed");
    return { files: data.files, requirementsOutput: "", backendOutput };
  }
  
  // Fallback: parse raw text
  generatedText = data.text || "";
  onStepUpdate("ui", "completed");
  onStepUpdate("backend", "running");
  const backendPrompt = `For the app: "${userPrompt}", describe the backend/database schema needed.`;
  const backendOutput = await collectStreamText(
    [{ role: "user", parts: [{ text: backendPrompt }] }],
    "You are a backend architect.",
    signal
  );
  onStepUpdate("backend", "completed");
  
  let files = parseFilesFromResponse(generatedText);'''

if old in c:
    c = c.replace(old, new)
    print('✅ FIXED!')
else:
    print('❌ NOT FOUND')

f = open('src/lib/ai-agents.ts', 'w', encoding='utf-8')
f.write(c)
f.close()