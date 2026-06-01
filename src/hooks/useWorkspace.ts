import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { WorkspaceState, ChatMessage, AgentStep, Framework } from "@/types/types";
import { DEFAULT_PROJECT_FILES, getDefaultFile } from "@/lib/file-system";
import {
  generateProject,
  editProject,
  isEditRequest,
  AGENT_STEPS,
} from "@/lib/ai-agents";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";

const AUTOSAVE_DEBOUNCE = 3000;

function buildInitialState(projectId: string | null = null, projectName = "my-app"): WorkspaceState {
  return {
    files: DEFAULT_PROJECT_FILES,
    activeFile: "/App.tsx",
    openFiles: ["/App.tsx"],
    messages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Welcome to **SiteGenie**! I'm your AI coding assistant.\n\nDescribe the app you want to build and I'll generate a complete React project for you.\n\nTry:\n- *\"Build a SaaS landing page with pricing\"*\n- *\"Create a restaurant website with menu\"*\n- *\"Make a portfolio site with dark theme\"*\n- *\"Build a task management dashboard\"*",
        timestamp: new Date(),
      },
    ],
    isGenerating: false,
    agentSteps: AGENT_STEPS.map((s) => ({ ...s })),
    projectName,
    projectId,
    requirementsOutput: "",
    backendOutput: "",
    enabledPlugins: [],
    framework: "react-ts",
  };
}

export function useWorkspace(projectId?: string | null) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<WorkspaceState>(() => buildInitialState(projectId ?? null));
  const abortRef = useRef<AbortController | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedFilesRef = useRef<string>("");
  // Tracks the live projectId — may be updated after first-generation project creation
  const liveProjectIdRef = useRef<string | null>(projectId ?? null);

  // Load project from Supabase on mount
  useEffect(() => {
    if (!projectId || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        toast.error("Project not found");
        navigate("/dashboard");
        return;
      }

      const files = data.files && typeof data.files === "object" && Object.keys(data.files).length > 0
        ? data.files as Record<string, string>
        : DEFAULT_PROJECT_FILES;

      const defaultFile = getDefaultFile(files);

      // Load chat history
      const { data: msgs } = await supabase
        .from("project_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(100);

      const chatMessages: ChatMessage[] = [
        {
          id: "welcome",
          role: "assistant",
          content: "👋 Welcome back! Your project has been loaded. Continue building or describe changes you want to make.",
          timestamp: new Date(),
        },
      ];

      if (Array.isArray(msgs) && msgs.length > 0) {
        for (const m of msgs) {
          chatMessages.push({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at),
          });
        }
      }

      setState((prev) => ({
        ...prev,
        files,
        activeFile: defaultFile,
        openFiles: defaultFile ? [defaultFile] : [],
        messages: chatMessages,
        projectName: data.name,
        projectId: data.id,
        requirementsOutput: data.requirements_output ?? "",
        backendOutput: data.backend_output ?? "",
        enabledPlugins: data.enabled_plugins ?? [],
        framework: (data.framework as Framework) ?? "react-ts",
      }));

      lastSavedFilesRef.current = JSON.stringify(files);
      liveProjectIdRef.current = data.id; // sync ref when loading existing project
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user]);

  // Auto-save to Supabase — creates new project if one doesn't exist yet
  const saveToSupabase = useCallback(
    async (
      files: Record<string, string>,
      requirementsOutput?: string,
      backendOutput?: string,
      projectName?: string,
      framework?: string,
    ) => {
      if (!user) return;
      const filesJson = JSON.stringify(files);
      const currentPid = liveProjectIdRef.current;

      if (!currentPid) {
        // ── First save: INSERT a brand-new project row ──
        const name = projectName ?? state.projectName ?? "my-app";
        const fw = framework ?? state.framework ?? "react-ts";
        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            name,
            files,
            framework: fw,
            requirements_output: requirementsOutput ?? "",
            backend_output: backendOutput ?? "",
          })
          .select("id")
          .maybeSingle();

        if (error || !data) {
          console.error("Failed to create project:", error?.message);
          return;
        }

        const newId = data.id as string;
        liveProjectIdRef.current = newId;
        lastSavedFilesRef.current = filesJson;

        setState((prev) => ({ ...prev, projectId: newId }));
        // Navigate to the permanent URL so refresh/back works
        navigate(`/workspace/${newId}`, { replace: true });
        return;
      }

      // ── Subsequent saves: UPDATE existing row ──
      if (filesJson === lastSavedFilesRef.current) return;
      lastSavedFilesRef.current = filesJson;

      await supabase
        .from("projects")
        .update({
          files,
          requirements_output: requirementsOutput ?? state.requirementsOutput,
          backend_output: backendOutput ?? state.backendOutput,
          framework: framework ?? state.framework,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentPid)
        .eq("user_id", user.id);
    },
    [user, state.projectName, state.requirementsOutput, state.backendOutput, state.framework, navigate]
  );

  // Persist message to Supabase (uses liveProjectIdRef for new projects)
  const persistMessage = useCallback(
    async (role: string, content: string) => {
      const pid = liveProjectIdRef.current;
      if (!pid || !user) return;
      await supabase.from("project_messages").insert({
        project_id: pid,
        role,
        content,
      });
    },
    [user]
  );

  // Save version snapshot (uses liveProjectIdRef for new projects)
  const saveVersion = useCallback(
    async (message: string) => {
      const pid = liveProjectIdRef.current;
      if (!pid || !user) return;
      await supabase.from("project_versions").insert({
        project_id: pid,
        user_id: user.id,
        files: state.files,
        message,
      });
      toast.success(`Version saved: "${message}"`);
    },
    [user, state.files]
  );

  const openFile = useCallback((filePath: string) => {
    setState((prev) => ({
      ...prev,
      activeFile: filePath,
      openFiles: prev.openFiles.includes(filePath)
        ? prev.openFiles
        : [...prev.openFiles, filePath],
    }));
  }, []);

  const closeFile = useCallback((filePath: string) => {
    setState((prev) => {
      const newOpenFiles = prev.openFiles.filter((f) => f !== filePath);
      const newActiveFile =
        prev.activeFile === filePath
          ? (newOpenFiles[newOpenFiles.length - 1] ?? null)
          : prev.activeFile;
      return { ...prev, openFiles: newOpenFiles, activeFile: newActiveFile };
    });
  }, []);

  const updateFileContent = useCallback(
    (filePath: string, content: string) => {
      setState((prev) => {
        const newFiles = { ...prev.files, [filePath]: content };
        // Debounced auto-save
        if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
          saveToSupabase(newFiles);
        }, AUTOSAVE_DEBOUNCE);
        return { ...prev, files: newFiles };
      });
    },
    [saveToSupabase]
  );

  const updateAgentStep = useCallback(
    (stepId: string, status: AgentStep["status"]) => {
      setState((prev) => ({
        ...prev,
        agentSteps: prev.agentSteps.map((s) =>
          s.id === stepId ? { ...s, status } : s
        ),
      }));
    },
    []
  );

  const updateStreamingMessage = useCallback(
    (id: string, contentChunk: string) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === id ? { ...m, content: m.content + contentChunk } : m
        ),
      }));
    },
    []
  );

  const sendMessage = useCallback(
    async (userInput: string, files?: unknown, model: string = "claude-sonnet-4-20250514") => {
      if (!userInput.trim() || state.isGenerating) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userInput,
        timestamp: new Date(),
      };
      const assistantMsgId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      abortRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        isGenerating: true,
        messages: [...prev.messages, userMsg, assistantMsg],
        agentSteps: AGENT_STEPS.map((s) => ({ ...s, status: "pending" as const })),
      }));

      // Persist user message
      persistMessage("user", userInput);

      const onStreamChunk = (chunk: string) => {
        updateStreamingMessage(assistantMsgId, chunk);
      };

      try {
        const hasExistingProject =
          Object.keys(state.files).length > 1 ||
          !state.files["/App.tsx"]?.includes("Welcome to SiteGenie");
        const shouldEdit = hasExistingProject && isEditRequest(userInput);

        let newFiles: Record<string, string>;
        let requirementsText = state.requirementsOutput;
        let backendText = state.backendOutput;

        if (shouldEdit) {
          newFiles = await editProject(
            userInput,
            state.files,
            onStreamChunk,
            abortRef.current.signal,
            state.framework
          );
          onStreamChunk("\n\n✅ **Changes applied!** Your app has been updated.");
        } else {
          const result = await generateProject(
            userInput,
            updateAgentStep,
            onStreamChunk,
            abortRef.current.signal,
            state.enabledPlugins,
            state.framework
          );
          newFiles = result.files;
          requirementsText = result.requirementsOutput;
          backendText = result.backendOutput;
          onStreamChunk(
            `\n\n✅ **Project generated!** ${Object.keys(newFiles).length} files created.`
          );
        }

        const defaultFile = getDefaultFile(newFiles);
        const newOpenFiles = defaultFile ? [defaultFile] : [];

        setState((prev) => ({
          ...prev,
          files: newFiles,
          activeFile: defaultFile,
          openFiles: newOpenFiles,
          isGenerating: false,
          requirementsOutput: requirementsText,
          backendOutput: backendText,
          messages: prev.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          ),
        }));

        // Save to Supabase — creates project row on first generation, updates on subsequent
        // Derive a readable project name from the first prompt (max 40 chars)
        const derivedName = !liveProjectIdRef.current
          ? userInput.replace(/[^a-zA-Z0-9 ]/g, "").trim().slice(0, 40) || "my-app"
          : state.projectName;
        await saveToSupabase(newFiles, requirementsText, backendText, derivedName, state.framework);

        // Persist assistant response (liveProjectIdRef is now set after saveToSupabase)
        const finalContent = state.messages.find((m) => m.id === assistantMsgId)?.content ?? "";
        persistMessage("assistant", finalContent || "Project generated successfully.");

        // Auto-create version snapshot on new generation
        if (!shouldEdit && liveProjectIdRef.current && user?.id) {
          await supabase.from("project_versions").insert({
            project_id: liveProjectIdRef.current,
            user_id: user.id,
            files: newFiles,
            message: `Generated: ${userInput.slice(0, 50)}`,
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "An unknown error occurred";
        if (abortRef.current?.signal.aborted) {
          updateStreamingMessage(assistantMsgId, "\n\n⛔ Generation cancelled.");
        } else {
          updateStreamingMessage(assistantMsgId, `\n\n❌ **Error**: ${errMsg}`);
          toast.error("Generation failed", { description: errMsg });
        }
        setState((prev) => ({
          ...prev,
          isGenerating: false,
          messages: prev.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          ),
        }));
      }
    },
    [state.isGenerating, state.files, state.requirementsOutput, state.backendOutput, state.enabledPlugins, state.framework, state.projectName, state.messages, updateAgentStep, updateStreamingMessage, saveToSupabase, persistMessage, user]
  );

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetProject = useCallback(() => {
    setState(buildInitialState(liveProjectIdRef.current, state.projectName));
    toast.success("Project reset to starter template");
  }, [state.projectName]);

  const togglePlugin = useCallback((pluginId: string) => {
    setState((prev) => {
      const enabled = prev.enabledPlugins.includes(pluginId)
        ? prev.enabledPlugins.filter((p) => p !== pluginId)
        : [...prev.enabledPlugins, pluginId];
      const pid = liveProjectIdRef.current;
      if (pid && user) {
        supabase.from("projects").update({ enabled_plugins: enabled }).eq("id", pid).eq("user_id", user.id);
      }
      return { ...prev, enabledPlugins: enabled };
    });
  }, [user]);

  const setFramework = useCallback((fw: Framework) => {
    setState((prev) => ({ ...prev, framework: fw }));
  }, []);

  return {
    state,
    openFile,
    closeFile,
    updateFileContent,
    sendMessage,
    cancelGeneration,
    resetProject,
    saveVersion,
    togglePlugin,
    setFramework,
    saveToSupabase,
  };
}
