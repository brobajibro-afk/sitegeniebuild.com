f = open('src/components/workspace/DeployPublish.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

c = c.replace(
    'const [version, setVersion] = useState(1);',
    'const [version, setVersion] = useState(1);\n  const [liveUrl, setLiveUrl] = useState("");'
)

c = c.replace(
    'const url = `https://${slug}.sitegeniebuild.com`;',
    'const url = `https://${slug}.sitegeniebuild.com`;\n      setLiveUrl(url);'
)

f = open('src/components/workspace/DeployPublish.tsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done')