import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "../store/themeStore";

type Props = {
  className?: string;
  variant?: "default" | "outline" | "ghost";
};

export function ThemeToggle({
  className = "",
  variant = "outline",
}: Props) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={`rounded-full border-border bg-background/80 backdrop-blur-sm shadow-sm ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-foreground" />
      )}
    </Button>
  );
}
