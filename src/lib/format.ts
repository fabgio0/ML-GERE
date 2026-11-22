const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function moeda(valor: number): string {
  return brlFormatter.format(valor);
}

/**
 * Formata data ISO (AAAA-MM-DD) como "25 nov".
 */
export function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  const data = new Date(ano, mes - 1, dia);
  return data
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
}

/**
 * Formata data ISO (AAAA-MM-DD) como "25/11/2026".
 */
export function dataCompleta(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  if (!ano || !mes || !dia) return iso;
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

/**
 * Formata data/hora ISO (ex: "2026-11-22T14:30:00") como "22 nov · 14:30".
 */
export function dataHora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  const diaMes = data
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${diaMes} · ${hora}`;
}
