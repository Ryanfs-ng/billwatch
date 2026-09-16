import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BadgeStatus } from "../components/BadgeStatus";

describe("BadgeStatus", () => {
  it("exibe o label correspondente ao status", () => {
    render(<BadgeStatus status="ATRASADO" />);
    expect(screen.getByText("Atrasado")).toBeInTheDocument();
  });
});
