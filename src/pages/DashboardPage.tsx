import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/db/supabase";
import { AppShell } from "@/components/layouts/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Loader2,
  Search,
  Trash2,
  MoreHorizontal,
  Heart,
  Globe,
  Circle,
  ChevronDown,
  FileCode2,
} from "lucide-react";
import { toast } from "sonner";

// Only the columns we SELECT — avoids casting full Project type
interface DashboardProject {
  id: string;
  name: string;
  user_id: string;
  team_id: string | null;
  updated_at: string | null;
  created_at: string;
  enabled_plugins: string[] | null;
  framework: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function editedLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return `Yesterday ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
}

// Gradient backgrounds per framework/index for card thumbnails
const CARD_GRADIENTS = [
  "from-violet-400 to-indigo-500",
  "from-pink-400 to-rose-500",
  "from-cyan-400 to-blue-500",
  "from-orange-400 to-amber-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-400 to-purple-500",
  "from-sky-400 to-blue-600",
  "from-lime-400 to-green-500",
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshTokenBalance } = useAuth();

  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"created" | "liked">("created");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DashboardProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user) refreshTokenBalance();
  }, [authLoading, user, refreshTokenBalance]);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    setProjectsLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, user_id, team_id, updated_at, created_at, enabled_plugins, framework")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) toast.error("Failed to load projects");
    else setProjects((data ?? []) as unknown as DashboardProject[]);
    setProjectsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) loadProjects();
  }, [authLoading, user, loadProjects]);

  const handleDeleteProject = async () => {
    if (!deleteTarget || !user) return;
    setDeleting(true);
    await supabase.from("project_messages").delete().eq("project_id", deleteTarget.id);
    await supabase.from("project_versions").delete().eq("project_id", deleteTarget.id);
    const { error } = await supabase.from("projects").delete().eq("id", deleteTarget.id).eq("user_id", user.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) toast.error("Delete failed", { description: error.message });
    else {
      toast.success(`"${deleteTarget.name}" deleted`);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget!.id));
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full px-6 py-6">

          {/* Page title */}
          <h1 className="text-2xl font-bold text-foreground mb-5">Project</h1>

          {/* Tabs + filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
            {/* Created / Liked tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 border border-border/50 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("created")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "created" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Created
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("liked")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "liked" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Liked
              </button>
            </div>

            <div className="flex-1" />

            {/* Right side filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                All statuses <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                All <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="h-8 pl-8 pr-3 text-sm rounded-lg border border-border/60 bg-muted/40 outline-none focus:border-primary transition-colors w-36"
                />
              </div>
              <Button
                className="h-8 gap-1.5 text-sm px-4 bg-foreground text-background hover:opacity-80"
                onClick={() => navigate("/workspace/new")}
              >
                <Plus className="w-3.5 h-3.5" />
                Create project
              </Button>
            </div>
          </div>

          {/* Project grid */}
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                  <Skeleton className="aspect-video w-full bg-muted" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-3.5 w-3/4 bg-muted" />
                    <Skeleton className="h-3 w-1/2 bg-muted" />
                    <Skeleton className="h-5 w-16 bg-muted rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              {search ? (
                <>
                  <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium">No projects match "{search}"</p>
                  <button type="button" className="text-xs text-primary mt-2 hover:underline" onClick={() => setSearch("")}>
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <FileCode2 className="w-9 h-9 text-primary" />
                  </div>
                  <p className="text-base font-semibold mb-1">No projects yet</p>
                  <p className="text-sm text-muted-foreground mb-5 max-w-xs text-pretty">
                    Describe what you want to build and SiteGenie will generate it in seconds.
                  </p>
                  <Button
                    className="gap-2 bg-foreground text-background hover:opacity-80"
                    onClick={() => navigate("/workspace/new")}
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Project
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {(filtered as DashboardProject[]).map((project, idx) => {
                const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                return (
                  <div
                    key={project.id}
                    className="group rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all duration-150 flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div
                      className={`relative aspect-video bg-gradient-to-br ${gradient} cursor-pointer overflow-hidden`}
                      onClick={() => navigate(`/workspace/${project.id}`)}
                    >
                      {/* Simulated app screenshot */}
                      <div className="absolute inset-0 flex flex-col">
                        {/* Fake navbar */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10">
                          <span className="text-[9px] font-bold text-white/90 truncate flex-1">{project.name}</span>
                          <span className="text-[8px] text-white/70 px-1.5 py-0.5 rounded bg-white/20">Start Building</span>
                        </div>
                        {/* Fake content */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 px-4">
                          <div className="w-24 h-2.5 bg-white/30 rounded-full" />
                          <div className="w-16 h-1.5 bg-white/20 rounded-full" />
                          <div className="w-20 h-5 mt-1 bg-white/25 rounded-lg" />
                        </div>
                        <div className="px-3 pb-2 flex gap-1">
                          <div className="h-1.5 flex-1 bg-white/15 rounded-full" />
                          <div className="h-1.5 w-8 bg-white/15 rounded-full" />
                        </div>
                      </div>

                      {/* Online badge */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                        <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                        <span className="text-[9px] text-white font-medium">online</span>
                      </div>

                      {/* Heart */}
                      <button
                        type="button"
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/70 hover:text-pink-400 transition-colors opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Like"
                      >
                        <Heart className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Card info */}
                    <div className="px-3 pt-2.5 pb-2 flex-1 flex flex-col gap-1.5">
                      <div className="flex items-start gap-1 min-w-0">
                        <p
                          className="text-xs font-semibold text-foreground truncate flex-1 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/workspace/${project.id}`)}
                        >
                          {project.name}
                        </p>
                        {/* Kebab menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              aria-label="More options"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => navigate(`/workspace/${project.id}`)}>
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(project)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className="text-[10px] text-muted-foreground">
                        Edited {editedLabel(project.updated_at ?? project.created_at)}
                      </p>

                      {/* Webpage badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-border/60 text-[10px] text-muted-foreground bg-muted/30">
                          <Globe className="w-2.5 h-2.5" />
                          Webpage
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Create new card */}
              <button
                type="button"
                onClick={() => navigate("/workspace/new")}
                className="aspect-video rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">New Task</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" and all its files, messages, and version history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteProject}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
