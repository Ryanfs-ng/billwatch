import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusDot } from "../components/StatusDot";
import { filtrarBoletos } from "../pages/Boletos";
import { meses, porMes, proximosVencimentos } from "../pages/Dashboard";
import { corDoDia, diasDoMes } from "../pages/Calendario";
import type { Boleto } from "../types";

const boleto = (descricao: string, dataVencimento: string, status: Boleto["status"]): Boleto => ({
  id: descricao,
  descricao,
  valor: 10,
  dataVencimento,
  dataAnexado: null,
  dataPagamento: null,
  anexo: null,
  responsavelId: "u1",
  responsavelNome: "Ryan",
  status,
});

const lista = [
  boleto("Internet", "2026-09-30", "PENDENTE"),
  boleto("Conta de luz", "2026-09-18", "ATRASADO"),
  boleto("Aluguel", "2026-10-05", "PENDENTE"),
];
const semFiltro = { busca: "", status: "" as const, periodo: "qualquer" as const };
const HOJE = "2026-09-25";

describe("filtrarBoletos", () => {
  it("ordena por vencimento", () => {
    expect(filtrarBoletos(lista, semFiltro, HOJE).map((b) => b.descricao)).toEqual([
      "Conta de luz",
      "Internet",
      "Aluguel",
    ]);
  });

  it("busca sem diferenciar maiúsculas e filtra por status", () => {
    expect(filtrarBoletos(lista, { ...semFiltro, busca: "LUZ" }, HOJE)).toHaveLength(1);
    expect(filtrarBoletos(lista, { ...semFiltro, status: "PENDENTE" }, HOJE)).toHaveLength(2);
  });

  it("filtra por período, virando o mês", () => {
    expect(filtrarBoletos(lista, { ...semFiltro, periodo: "7" }, HOJE).map((b) => b.descricao)).toEqual(["Internet"]);
    expect(filtrarBoletos(lista, { ...semFiltro, periodo: "30" }, HOJE)).toHaveLength(2);
    expect(filtrarBoletos(lista, { ...semFiltro, periodo: "mes" }, HOJE)).toHaveLength(2);
  });
});

describe("StatusDot", () => {
  it("exibe o label do status", () => {
    render(<StatusDot status="ATRASADO" />);
    expect(screen.getByText("Atrasado")).toBeInTheDocument();
  });
});

describe("proximosVencimentos", () => {
  it("ignora pagos, ordena por data e limita", () => {
    const comPago = [...lista, boleto("Plano", "2026-09-01", "PAGO")];
    expect(proximosVencimentos(comPago, 2).map((b) => b.descricao)).toEqual(["Conta de luz", "Internet"]);
  });
});

describe("calendário", () => {
  it("monta a grade com espaços vazios e semanas completas", () => {
    const setembro2026 = diasDoMes(2026, 8);
    expect(setembro2026.slice(0, 3)).toEqual([null, null, 1]);
    expect(setembro2026.filter((d) => d !== null)).toHaveLength(30);
    expect(setembro2026.length % 7).toBe(0);
  });

  it("cor do dia: atrasado > a vencer/pendente > pago", () => {
    expect(corDoDia([boleto("a", "2026-09-01", "PAGO"), boleto("b", "2026-09-01", "ATRASADO")])).toBe("atrasado");
    expect(corDoDia([boleto("a", "2026-09-01", "PAGO"), boleto("b", "2026-09-01", "PENDENTE")])).toBe("aVencer");
    expect(corDoDia([boleto("a", "2026-09-01", "PAGO")])).toBe("pago");
  });
});

describe("gráficos do dashboard", () => {
  it("lista meses atravessando o ano", () => {
    expect(meses("2026-01-20", -2, 3)).toEqual(["2025-11", "2025-12", "2026-01"]);
  });

  it("soma valor pago por mês de pagamento", () => {
    const pago = { ...boleto("Água", "2026-08-10", "PAGO"), valor: 50, dataPagamento: "2026-09-02" };
    const lista2 = [pago, { ...pago, id: "x", dataPagamento: "2026-09-20" }, boleto("Gás", "2026-09-10", "PENDENTE")];
    expect(porMes(lista2, ["2026-08", "2026-09"], (b) => b.dataPagamento, (b) => b.valor)).toEqual([0, 100]);
  });
});
