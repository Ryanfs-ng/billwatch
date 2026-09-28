import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { cn } from "@/lib/utils";

const TEMA_KEY = "billwatch_tema";
type Tema = "light" | "dark";

function temaInicial(): Tema {
  try {
    const salvo = localStorage.getItem(TEMA_KEY);
    if (salvo === "light" || salvo === "dark") return salvo;
  } catch {
    // storage indisponível: segue a preferência do sistema
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function BotaoTema({ className }: { className?: string }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    try {
      localStorage.setItem(TEMA_KEY, tema);
    } catch {
      // ignora: o tema só não fica salvo
    }
  }, [tema]);

  return (
    <IconButton
      label={tema === "dark" ? "Usar tema claro" : "Usar tema escuro"}
      onClick={() => setTema(tema === "dark" ? "light" : "dark")}
      className={cn("size-10 border", className)}
    >
      {tema === "dark" ? <Sun /> : <Moon />}
    </IconButton>
  );
}
