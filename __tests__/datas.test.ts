import { diasAtras, diasDesde, diasEntre, formatarDataBR, parseDataBR } from "../src/utils/datas";

const HOJE = new Date(2026, 9, 19, 10, 0, 0); // 19/10/2026

describe("datas", () => {
  test("formatarDataBR usa dd/mm/aaaa com zero à esquerda", () => {
    expect(formatarDataBR(new Date(2026, 0, 5))).toBe("05/01/2026");
  });

  test("parseDataBR aceita data válida e rejeita lixo", () => {
    expect(parseDataBR("19/10/2026")?.getMonth()).toBe(9);
    expect(parseDataBR("2026-10-19")).toBeNull();
    expect(parseDataBR("")).toBeNull();
  });

  test("diasAtras atravessa a virada de mês", () => {
    expect(diasAtras(19, HOJE)).toBe("30/09/2026");
    expect(diasAtras(0, HOJE)).toBe("19/10/2026");
  });

  test("diasEntre calcula a diferença e devolve null para data inválida", () => {
    expect(diasEntre("10/10/2026", "19/10/2026")).toBe(9);
    expect(diasEntre("19/10/2026", "10/10/2026")).toBe(-9);
    expect(diasEntre("x", "19/10/2026")).toBeNull();
  });

  test("diasDesde nunca é negativo", () => {
    expect(diasDesde("12/10/2026", HOJE)).toBe(7);
    expect(diasDesde("25/10/2026", HOJE)).toBe(0);
  });
});
