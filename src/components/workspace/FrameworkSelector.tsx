import { ChevronDown, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FRAMEWORKS } from "@/lib/frameworks";
import type { Framework } from "@/types/types";
import { cn } from "@/lib/utils";

interface FrameworkSelectorProps {
  value: Framework;
  onChange: (fw: Framework) => void;
  disabled?: boolean;
}

const frontendFrameworks = FRAMEWORKS.filter((f) => !f.isBackend);
const backendFrameworks = FRAMEWORKS.filter((f) => f.isBackend);

export function FrameworkSelector({ value, onChange, disabled }: FrameworkSelectorProps) {
  const current = FRAMEWORKS.find((f) => f.id === value) ?? FRAMEWORKS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-7 px-2 gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent border border-border/60"
        >
          <span>{current.icon}</span>
          <span className="hidden sm:inline max-w-[80px] truncate">{current.label}</span>
          <ChevronDown className="w-3 h-3 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          <Monitor className="w-3 h-3" />
          Frontend
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {frontendFrameworks.map((fw) => (
            <DropdownMenuItem
              key={fw.id}
              onSelect={() => onChange(fw.id)}
              className={cn(
                "flex items-center gap-2 text-xs cursor-pointer",
                value === fw.id && "bg-primary/10 text-primary font-medium"
              )}
            >
              <span className="text-base leading-none">{fw.icon}</span>
              <span className="flex-1">{fw.label}</span>
              {value === fw.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          🖥️ Backend (Scaffold)
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {backendFrameworks.map((fw) => (
            <DropdownMenuItem
              key={fw.id}
              onSelect={() => onChange(fw.id)}
              className={cn(
                "flex items-center gap-2 text-xs cursor-pointer",
                value === fw.id && "bg-primary/10 text-primary font-medium"
              )}
            >
              <span className="text-base leading-none">{fw.icon}</span>
              <span className="flex-1">{fw.label}</span>
              {value === fw.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
