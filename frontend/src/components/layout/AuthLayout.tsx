import { CheckCircle2 } from "lucide-react";
import { Outlet } from "react-router-dom";
import logo from "@/assets/logo.png";
import { BotaoTema } from "@/components/BotaoTema";

const DIFERENCIAIS = [
  "Alertas de vencimento em tempo real",
  "Compartilhe com quem divide as contas",
  "Histórico completo de pagamentos",
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden items-center justify-center bg-linear-to-r from-brand-900 via-brand-900 to-brand-600 px-16 py-12 text-white [view-transition-name:painel-marca] md:flex">
        <div className="flex w-full max-w-md flex-col gap-10 xl:max-w-lg 2xl:max-w-xl 2xl:gap-12">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-8 w-auto 2xl:h-10" />
            <span className="font-display text-[21px] font-extrabold 2xl:text-[26px]">BillWatch</span>
          </div>

          <div>
            <h1 className="font-display text-[38px] leading-[1.22] font-extrabold tracking-[-0.5px] xl:text-[44px] 2xl:text-[52px]">
              Suas contas, sempre <span className="text-brand-200 dark:text-brand-700">em dia.</span>
            </h1>
            <p className="mt-4 text-base leading-6 text-white/70 2xl:text-lg 2xl:leading-7">
              Organize seus boletos, acompanhe vencimentos e nunca mais perca um pagamento.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {DIFERENCIAIS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/85 2xl:text-base">
                <CheckCircle2 className="size-5 shrink-0 text-brand-200 dark:text-brand-700 2xl:size-6" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center px-6 py-12">
        <BotaoTema className="absolute top-4 right-4" />
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
