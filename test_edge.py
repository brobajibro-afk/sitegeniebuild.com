import urllib.request
import json

url = 'https://zwwrpesqggkemiopyzxz.supabase.co/functions/v1/large-language-model'
token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3d3JwZXNxZ2dra2VtaW9weXp4eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE3MzI1OTUwLCJleHAiOjE4NzUxMDIzNTB9.DmvjsHoMr2gKKpVCNWTvMlPFKfWpvBs0TvYDRKOEMnM'

body = json.dumps({
    'contents': [{'role': 'user', 'parts': [{'text': 'create a simple hello world react app'}]}],
    'systemPrompt': 'Return ONLY valid JSON',
    'model': 'anthropic/claude-sonnet-4-5'
}).encode()

req = urllib.request.Request(
    url,
    data=body,
    headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
)

try:
    r = urllib.request.urlopen(req)
    result = r.read().decode()
    print(result[:1500])
except Exception as e:
    print(f'ERROR: {e}')