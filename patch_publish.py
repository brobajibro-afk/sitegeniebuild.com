f = open('src/components/workspace/DeployPublish.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

old = '''handlePublish = async () => {
    setIsPublishing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setVersion((v) => v + 1);
    setIsPublished(true);
    setHasUnpublishedChanges(false);
    setIsPublishing(false);
    toast.success("Published successfully!", { description: liveUrl });
  };'''

new = '''handlePublish = async () => {
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