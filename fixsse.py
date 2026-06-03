f = open('src/lib/sse.ts', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''      onEvent: (event) => {
        if (!event.data) return;
        options.onEvent?.(event);
        for (const chunk of event.data.split("\\n")) options.onData(chunk);
      },'''

new = '''      onEvent: (event) => {
        if (!event.data) return;
        options.onEvent?.(event);
        options.onData(event.data);
      },'''

if old in c:
    c = c.replace(old, new)
    print('Replaced SSE handler')
else:
    print('NOT FOUND - printing current onEvent section:')
    idx = c.find('onEvent')
    print(c[idx:idx+300])

f = open('src/lib/sse.ts', 'w', encoding='utf-8')
f.write(c)
f.close()