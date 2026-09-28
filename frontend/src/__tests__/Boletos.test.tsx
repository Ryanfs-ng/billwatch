import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusDot } from "../components/StatusDot";
import { filtrarBoletos } from "../pages/Boletos";
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
