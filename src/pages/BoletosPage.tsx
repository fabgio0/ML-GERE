import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Boleto, BoletoTipo } from "@/lib/finance-data";
import { financeActions, useFinance } from "@/lib/finance-store";
import { dataCompleta, moeda } from "@/lib/format";

type FiltroBoleto = "todos" | "receber" | "pagar" | "vencidos" | "pagos";

export function BoletosPage() {
  const { boletos } = useFinance();
  const [filtro, setFiltro] = useState<FiltroBoleto>("todos");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [boletoParaExcluir, setBoletoParaExcluir] = useState<Boleto | null>(null);

  const [descricao, setDescricao] = useState("");
  const [contraparte, setContraparte] = useState("");
  const [tipo, setTipo] = useState<BoletoTipo>("receber");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("2026-11-28");
  const [categoria, setCategoria] = useState("Serviços recorrentes");

  const resumo = useMemo(() => {
    const abertos = boletos.filter((b) => b.status !== "pago");
    const receber = abertos
      .filter((b) => b.tipo === "receber")
      .reduce((s, b) => s + b.valor, 0);
    const pagar = abertos
      .filter((b) => b.tipo === "pagar")
      .reduce((s, b) => s + b.valor, 0);
    const vencidos = boletos.filter((b) => b.status === "vencido");
    const pagos = boletos
      .filter((b) => b.status === "pago")
      .reduce((s, b) => s + b.valor, 0);
    return {
      receber,
      pagar,
      vencidosCount: vencidos.length,
      vencidosTotal: vencidos.reduce((s, b) => s + b.valor, 0),
      pagos,
    };
  }, [boletos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return boletos
      .filter((b) => {
        if (filtro === "receber" && b.tipo !== "receber") return false;
        if (filtro === "pagar" && b.tipo !== "pagar") return false;
        if (filtro === "vencidos" && b.status !== "vencido") return false;
        if (filtro === "pagos" && b.status !== "pago") return false;
        if (!termo) return true;
        return (
          b.descricao.toLowerCase().includes(termo) ||
          b.contraparte.toLowerCase().includes(termo) ||
          b.categoria.toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }, [boletos, filtro, busca]);

  const handleCriarBoleto = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = Number(valor.replace(",", "."));
    if (!descricao.trim() || !contraparte.trim() || !Number.isFinite(valorNum) || valorNum <= 0) {
      toast.error("Preencha descrição, contraparte e um valor válido");
      return;
    }
    financeActions.adicionarBoleto({
      descricao,
      contraparte,
      tipo,
      valor: valorNum,
      vencimento,
      categoria,
    });
    toast.success("Boleto cadastrado com sucesso");
    setDescricao("");
    setContraparte("");
    setValor("");
    setModalAberto(false);
  };

  const tabs: { key: FiltroBoleto; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "receber", label: "A receber" },
    { key: "pagar", label: "A pagar" },
    { key: "vencidos", label: "Vencidos" },
    { key: "pagos", label: "Pagos" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contas a pagar e receber"
        title="Boletos"
        description="Acompanhe vencimentos, dê baixa em pagamentos e cadastre novos lançamentos."
        actions={
          <Button onClick={() => setModalAberto(true)}>
            <Plus /> Novo boleto
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="A receber em aberto"
          value={moeda(resumo.receber)}
          hint="Entradas previstas"
        />
        <StatCard
          label="A pagar em aberto"
          value={moeda(resumo.pagar)}
          hint="Compromissos pendentes"
        />
        <StatCard
          label="Em atraso"
          value={moeda(resumo.vencidosTotal)}
          hint={
            <span className="text-destructive">
              {resumo.vencidosCount} {resumo.vencidosCount === 1 ? "boleto vencido" : "boletos vencidos"}
            </span>
          }
        />
        <StatCard
          label="Liquidados no período"
          value={moeda(resumo.pagos)}
          hint="Movimentação confirmada"
        />
      </section>

      <section className="surface mt-4 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFiltro(tab.key)}
                className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filtro === tab.key
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar descrição ou empresa..."
              aria-label="Buscar boletos"
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhum boleto encontrado para os filtros selecionados.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajuste a busca ou cadastre um novo boleto para começar.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {(filtro !== "todos" || busca) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltro("todos");
                    setBusca("");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
              <Button size="sm" onClick={() => setModalAberto(true)}>
                <Plus /> Novo boleto
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Lançamento</th>
                  <th className="px-4 py-3">Contraparte</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtrados.map((b) => (
                  <tr
                    key={b.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                            b.tipo === "receber"
                              ? "bg-success-soft text-success"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {b.tipo === "receber" ? (
                            <ArrowDownLeft className="size-4" />
                          ) : (
                            <ArrowUpRight className="size-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{b.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.tipo === "receber" ? "Recebimento" : "Pagamento"} · {b.categoria}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{b.contraparte}</td>
                    <td className="num px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                      {dataCompleta(b.vencimento)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="num px-4 py-3.5 text-right font-semibold whitespace-nowrap">
                      <span
                        className={
                          b.tipo === "receber" ? "text-success" : "text-foreground"
                        }
                      >
                        {b.tipo === "receber" ? "+" : "-"} {moeda(b.valor)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant={b.status === "pago" ? "outline" : "success"}
                          onClick={() => {
                            financeActions.alternarPagamentoBoleto(b.id);
                            toast.success(
                              b.status === "pago"
                                ? `Boleto "${b.descricao}" reaberto`
                                : `Baixa registrada em "${b.descricao}"`
                            );
                          }}
                        >
                          {b.status === "pago" ? (
                            <>
                              <RotateCcw /> Reabrir
                            </>
                          ) : (
                            <>
                              <Check /> Dar baixa
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBoletoParaExcluir(b)}
                          aria-label={`Excluir ${b.descricao}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Novo boleto"
        description="Cadastre uma conta a pagar ou a receber no fluxo financeiro."
      >
        <form onSubmit={handleCriarBoleto} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setTipo("receber")}
              className={`h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tipo === "receber"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              A receber
            </button>
            <button
              type="button"
              onClick={() => setTipo("pagar")}
              className={`h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tipo === "pagar"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              A pagar
            </button>
          </div>

          <div>
            <label htmlFor="bol-desc" className="block text-sm font-medium">
              Descrição
            </label>
            <input
              id="bol-desc"
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Mensalidade consultoria técnica"
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              required
            />
          </div>

          <div>
            <label htmlFor="bol-contra" className="block text-sm font-medium">
              {tipo === "receber" ? "Cliente / Pagador" : "Fornecedor / Beneficiário"}
            </label>
            <input
              id="bol-contra"
              type="text"
              value={contraparte}
              onChange={(e) => setContraparte(e.target.value)}
              placeholder="Nome ou razão social"
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bol-valor" className="block text-sm font-medium">
                Valor (R$)
              </label>
              <input
                id="bol-valor"
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="num mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                required
              />
            </div>

            <div>
              <label htmlFor="bol-venc" className="block text-sm font-medium">
                Vencimento
              </label>
              <input
                id="bol-venc"
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="num mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="bol-cat" className="block text-sm font-medium">
              Categoria
            </label>
            <input
              id="bol-cat"
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAberto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar boleto</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(boletoParaExcluir)}
        onClose={() => setBoletoParaExcluir(null)}
        onConfirm={() => {
          if (!boletoParaExcluir) return;
          financeActions.removerBoleto(boletoParaExcluir.id);
          toast(`Boleto "${boletoParaExcluir.descricao}" removido`);
        }}
        title="Excluir boleto?"
        description={
          boletoParaExcluir
            ? `O lançamento "${boletoParaExcluir.descricao}" será removido permanentemente.`
            : ""
        }
        confirmLabel="Excluir"
        destructive
      />
    </>
  );
}
