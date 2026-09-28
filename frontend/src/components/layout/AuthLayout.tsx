import { CheckCircle2 } from "lucide-react";
import { Outlet } from "react-router-dom";
import logo from "@/assets/logo.png";

const DIFERENCIAIS = [
  "Alertas de vencimento em tempo real",
  "Compartilhe com quem divide as contas",
  "Histórico completo de pagamentos",
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-center gap-10 bg-brand-900 px-16 py-12 text-white md:flex">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="" className="h-8 w-auto" />
          <span className="font-display text-[21px] font-extrabold">BillWatch</span>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-[38px] leading-[1.22] font-extrabold tracking-[-0.5px]">
            Suas contas, sempre <span className="text-brand-200">em dia.</span>
          </h1>
          <p className="mt-4 text-base leading-6 text-white/70">
            Organize seus boletos, acompanhe vencimentos e nunca mais perca um pagamento.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {DIFERENCIAIS.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-white/85">
              <CheckCircle2 className="size-5 shrink-0 text-brand-200" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <img src={logo} alt="" className="h-8 w-auto" />
            <span className="font-display text-[21px] font-extrabold text-foreground">BillWatch</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
