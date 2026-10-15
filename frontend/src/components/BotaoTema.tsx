import { useTheme } from "next-themes";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { cn } from "@/lib/utils";

// Alternador de tema com a animação de "revelar" do animate-ui. O tema em si (classe .dark no <html>,
// salvo em localStorage) é cuidado pelo ThemeProvider do next-themes, no main.tsx.
export function BotaoTema({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const label = resolvedTheme === "dark" ? "Usar tema claro" : "Usar tema escuro";

  return (
    <ThemeTogglerButton
      modes={["light", "dark"]}
      variant="outline"
      size="lg"
      aria-label={label}
      title={label}
      className={cn("bg-card text-ink-600 hover:bg-surface-hover hover:text-foreground [&_svg]:size-[18px]", className)}
    />
  );
}
