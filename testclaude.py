import urllib.request, json

url = 'https://zwwrpesqggkemiopyzxz.supabase.co/functions/v1/large-language-model'
token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3d3JwZXNxZ2dra2VtaW9weXp4eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE3MzI1OTUwLCJleHAiOjE4NzUxMDIzNTB9.DmvjsHoMr2gKKpVCNWTvMlPFKfWpvBs0TvYDRKOEMnM'

body = json.dumps({
    'contents': [{'role': 'user', 'parts': [{'text': 'create a todo app'}]}],
    'systemPrompt': 'Return ONLY raw JSON: {"/App.tsx": "code here"}',
}).encode()

req = urllib.request.Request(url, data=body, headers={
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
})

try:
    r = urllib.request.urlopen(req, timeout=60)
    result = json.loads(r.read().decode())
    print('TEXT:', result.get('text', '')[:2000])
except Exception as e:
    print('ERROR:', e)