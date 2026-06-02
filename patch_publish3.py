f = open('src/components/workspace/DeployPublish.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''handlePublish = async () => {
    setIsPublishing(true);
    try {
      const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 7);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("published_sites").upsert({
        slug,
        user_id: user?.id,
        project_id: projectId || null,
        files,
        framework,
        project_name: projectName,
        updated_at: new Date().toISOString(),
      }, { onConflict: "slug" });
      if (error) throw error;
      const url = `https://${slug}.sitegeniebuild.com`;
      setLiveUrl(url);
      setVersion((v) => v + 1);
      setIsPublished(true);
      setHasUnpublishedChanges(false);
      setIsPublishing(false);
      toast.success("Published successfully!", { description: url });
    } catch (err) {
      setIsPublishing(false);
      toast.error("Publish failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };'''

new = '''handlePublish = async () => {
    setIsPublishing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("publish-site", {
        body: { files, projectName, projectId, framework },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw new Error(res.error.message);
      const { url } = res.data;
      setLiveUrl(url);
      setVersion((v) => v + 1);
      setIsPublished(true);
      setHasUnpublishedChanges(false);
      setIsPublishing(false);
      toast.success("Published successfully!", { description: url });
    } catch (err) {
      setIsPublishing(false);
      toast.error("Publish failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };'''

c = c.replace(old, new)
f = open('src/components/workspace/DeployPublish.tsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print('Done')