import React from "react";
import { Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Collaborator {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface CollaboratorPresenceProps {
  collaborators: Collaborator[];
  maxVisible?: number;
}

const AVATAR_COLORS = [
  "bg-[#FF6B6B]",
  "bg-[#4ECDC4]",
  "bg-[#45B7D1]",
  "bg-[#96CEB4]",
  "bg-[#FFEAA7]",
  "bg-[#DDA0DD]",
];

export function CollaboratorPresence({ collaborators, maxVisible = 4 }: CollaboratorPresenceProps) {
  const active = collaborators.filter((c) => c.isActive);
  const visible = active.slice(0, maxVisible);
  const overflow = active.length - maxVisible;

  if (active.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {/* Avatars */}
          <div className="flex -space-x-2">
            {visible.map((collab, i) => (
              <Tooltip key={collab.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 border-editor-panel flex items-center justify-center text-[9px] font-bold text-white cursor-pointer",
                      AVATAR_COLORS[i % AVATAR_COLORS.length]
                    )}
                    style={{ zIndex: visible.length - i }}
                  >
                    {collab.name.charAt(0).toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>{collab.name}</p>
                  <p className="text-muted-foreground text-[10px]">Editing...</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {overflow > 0 && (
              <div
                className="w-6 h-6 rounded-full border-2 border-editor-panel bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground"
                style={{ zIndex: 0 }}
              >
                +{overflow}
              </div>
            )}
          </div>
        </div>

        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-chart-3 animate-pulse" />
          <span className="text-[10px] text-chart-3 font-medium">
            {active.length} live
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Simulated collaborator cursor overlay for the editor
interface CollaboratorCursorProps {
  name: string;
  colorIndex: number;
  line: number;
  column: number;
}

export function CollaboratorCursor({ name, colorIndex, line, column }: CollaboratorCursorProps) {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#DDA0DD"];
  const color = colors[colorIndex % colors.length];

  return (
    <div
      className="absolute pointer-events-none flex flex-col items-start"
      style={{
        top: `${line * 20}px`,
        left: `${column * 7.5}px`,
        zIndex: 10,
      }}
    >
      <div
        className="w-0.5 h-5"
        style={{ backgroundColor: color }}
      />
      <div
        className="text-[9px] text-white px-1 py-0.5 rounded-sm whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  );
}

// Hook to simulate real-time collaborators (demo mode)
export function useDemoCollaborators(enabled = false): Collaborator[] {
  const [collaborators] = React.useState<Collaborator[]>(
    enabled
      ? [
          { id: "collab-1", name: "Alex", color: "#FF6B6B", isActive: true },
          { id: "collab-2", name: "Sam", color: "#4ECDC4", isActive: true },
        ]
      : []
  );
  return collaborators;
}
