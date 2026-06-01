f=open('src/components/workspace/AIChatPanel.tsx','r',encoding='utf-8')
c=f.read()
f.close()

c=c.replace(
  'onSendMessage: (message: string, files?: UploadedFile[]) => void;',
  'onSendMessage: (message: string, files?: UploadedFile[], model?: string) => void;'
)

c=c.replace(
  'const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);',
  'const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);\n  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-20250514");'
)

c=c.replace(
  'onSendMessage(message, uploadedFiles);',
  'onSendMessage(message, uploadedFiles, selectedModel);'
)

c=c.replace(
  '{/* Token balance badge */}',
  '{/* Model selector */}\n        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="h-6 px-1 rounded border border-border bg-background text-[11px] text-foreground shrink-0 max-w-[110px]" disabled={isGenerating}>\n          <option value="claude-sonnet-4-20250514">Claude Sonnet</option>\n          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>\n          <option value="gpt-4o">GPT-4o</option>\n          <option value="deepseek-chat">DeepSeek</option>\n          <option value="grok-3-mini">Grok 3 Mini</option>\n        </select>\n\n        {/* Token balance badge */}'
)

f=open('src/components/workspace/AIChatPanel.tsx','w',encoding='utf-8')
f.write(c)
f.close()
print('Done')