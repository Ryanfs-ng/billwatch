import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { baixarFoto } from "@/api/usuarios";
import { cn } from "@/lib/utils";

interface AvatarProps {
  usuarioId?: string;
  temFoto?: boolean;
  nome?: string | null;
  email?: string | null;
  className?: string;
}

function iniciais(nome?: string | null, email?: string | null): string {
  const partes = nome?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!partes.length) return (email ?? "").slice(0, 2).toUpperCase();
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ usuarioId, temFoto, nome, email, className }: AvatarProps) {
  const foto = useQuery({
    queryKey: ["foto", usuarioId],
    queryFn: () => baixarFoto(usuarioId!),
    enabled: !!usuarioId && !!temFoto,
    staleTime: Infinity,
    retry: false,
  });
  const blob = temFoto ? foto.data : undefined;

  const mostrarFoto = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img || !blob) return;
      const url = URL.createObjectURL(blob);
      img.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [blob],
  );

  return (
    <span
      aria-hidden
      className={cn(
        "grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700",
        className,
      )}
    >
      {blob ? <img ref={mostrarFoto} alt="" className="size-full object-cover" /> : iniciais(nome, email)}
    </span>
  );
}
