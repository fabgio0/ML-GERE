import { useMemo, useState } from "react";
import { Check, Plus, RotateCcw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Servico, ServicoDirecao } from "@/lib/finance-data";
import { financeActions, useFinance } from "@/lib/finance-store";
import { dataHora, moeda } from "@/lib/format";

type FiltroServico = "todos" | "aguardando" | "autorizado" | "negado";

export function ServicosPage() {
  const { servicos } = useFinance();
  const [filtro, setFiltro] = useState<FiltroServico>("todos");
  const [direcaoFiltro, setDirecaoFiltro] = useState<"todas" | ServicoDirecao>("todas");
  const [busca, setBusca] = useState("");
  const [modalNovo, setModalNovo] = useState(false);
  const [servicoParaNegar, setServicoParaNegar] = useState<Servico | null>(null);

  const [titulo, setTitulo] = useState("");
  const [contraparte, setContraparte] = useState("");
  const [direcao, setDirecao] = useState<ServicoDirecao>("saida");
  const [valor, setValor] = useState("");
  const [observacao, setObservacao] = useState("");

  const resumo = useMemo(() => {
    const aguardando = servicos.filter((s) => s.status === "aguardando");
    const autorizados = servicos.filter((s) => s.status === "autorizado");
    const negados = servicos.filter((s) => s.status === "negado");
    return {
      aguardandoCount: aguardando.length,
      aguardandoTotal: aguardando.reduce((s, x) => s + x.valor, 0),
      autorizadosTotal: autorizados.reduce((s, x) => s + x.valor, 0),
      autorizadosCount: autorizados.length,
      negadosCount: negados.length,
    };
  }, [servicos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return servicos.filter((s) => {
      if (filtro !== "todos" && s.status !== filtro) return false;
      if (direcaoFiltro !== "todas" && s.direcao !== direcaoFiltro) return false;
      if (!termo) return true;
      return (
        s.titulo.toLowerCase().includes(termo) ||
        s.contraparte.toLowerCase().includes(termo) ||
        (s.observacao ?? "").toLowerCase().includes(termo)
      );
    });
  }, [servicos, filtro, direcaoFiltro, busca]);

  const handleCriarServico = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = Number(valor.replace(",", "."));
    if (!titulo.trim() || !contraparte.trim() || !Number.isFinite(valorNum) || valorNum <= 0) {
      toast.error("Preencha título, contraparte e valor válido");
      return;
    }
    financeActions.adicionarServico({
      titulo,
      contraparte,
      direcao,
      valor: valorNum,
      observacao,
    });
    toast.success("Serviço registrado e enviado para autorização");
    setTitulo("");
    setContraparte("");
    setValor("");
    setObservacao("");
    setModalNovo(false);
  };

  const tabs: { key: FiltroServico; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "aguardando", label: "Aguardando" },
    { key: "autorizado", label: "Autorizados" },
    { key: "negado", label: "Negados" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Controle operacional"
        title="Entradas e saídas"
        description="Autorize ou negue ordens de serviço antes do faturamento ou contratação."
        actions={
          <Button onClick={() => setModalNovo(true)}>
            <Plus /> Registrar serviço
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Aguardando autorização"
          value={String(resumo.aguardandoCount)}
          hint={<span className="num">{moeda(resumo.aguardandoTotal)} em análise</span>}
        />
        <StatCard
          label="Autorizados"
          value={moeda(resumo.autorizadosTotal)}
          hint={`${resumo.autorizadosCount} serviços liberados`}
        />
        <StatCard
          label="Negados"
          value={String(resumo.negadosCount)}
          hint="Bloqueados na revisão"
        />
      </section>

      <section className="surface mt-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
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

            <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
              {(
                [
                  { key: "todas", label: "Chegadas e saídas" },
                  { key: "entrada", label: "Chegadas" },
                  { key: "saida", label: "Saídas" },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setDirecaoFiltro(item.key)}
                  className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    direcaoFiltro === item.key
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar serviço ou empresa..."
              aria-label="Buscar serviços"
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhum serviço encontrado.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajuste os filtros ou registre uma nova entrada ou saída de serviço.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {(filtro !== "todos" || direcaoFiltro !== "todas" || busca) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltro("todos");
                    setDirecaoFiltro("todas");
                    setBusca("");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
              <Button size="sm" onClick={() => setModalNovo(true)}>
                <Plus /> Registrar serviço
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtrados.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-background p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        s.direcao === "entrada" ? "text-info" : "text-primary"
                      }`}
                    >
                      {s.direcao === "entrada" ? "Chegada" : "Saída"}
                    </span>
                    <span className="num text-muted-foreground">{dataHora(s.data)}</span>
                  </div>
                  <p className="mt-2 font-semibold text-foreground">{s.titulo}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.contraparte}</p>
                  {s.observacao && (
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {s.observacao}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
                  <div>
                    <p className="num font-semibold text-foreground">{moeda(s.valor)}</p>
                    <div className="mt-0.5">
                      <StatusBadge status={s.status} />
                    </div>
                  </div>

                  {s.status === "aguardando" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setServicoParaNegar(s)}
                      >
                        <X /> Negar
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => {
                          financeActions.decidirServico(s.id, "autorizado");
                          toast.success(`${s.titulo} autorizado`);
                        }}
                      >
                        <Check /> Autorizar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        financeActions.reabrirServico(s.id);
                        toast(`"${s.titulo}" retornou para análise`);
                      }}
                    >
                      <RotateCcw /> Reabrir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={modalNovo}
        onClose={() => setModalNovo(false)}
        title="Registrar serviço"
        description="Adicione uma chegada ou saída de serviço para validação financeira."
      >
        <form onSubmit={handleCriarServico} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setDirecao("saida")}
              className={`h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                direcao === "saida"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Saída (prestado)
            </button>
            <button
              type="button"
              onClick={() => setDirecao("entrada")}
              className={`h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                direcao === "entrada"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Chegada (contratado)
            </button>
          </div>

          <div>
            <label htmlFor="srv-titulo" className="block text-sm font-medium">
              Título do serviço
            </label>
            <input
              id="srv-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Integração ERP contábil"
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="srv-contra" className="block text-sm font-medium">
                Cliente ou fornecedor
              </label>
              <input
                id="srv-contra"
                type="text"
                value={contraparte}
                onChange={(e) => setContraparte(e.target.value)}
                placeholder="Nome da empresa"
                className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                required
              />
            </div>
            <div>
              <label htmlFor="srv-valor" className="block text-sm font-medium">
                Valor (R$)
              </label>
              <input
                id="srv-valor"
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
          </div>

          <div>
            <label htmlFor="srv-obs" className="block text-sm font-medium">
              Observação (opcional)
            </label>
            <textarea
              id="srv-obs"
              rows={2}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Contexto para aprovação"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalNovo(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Enviar para autorização</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(servicoParaNegar)}
        onClose={() => setServicoParaNegar(null)}
        onConfirm={() => {
          if (!servicoParaNegar) return;
          financeActions.decidirServico(servicoParaNegar.id, "negado");
          toast(`${servicoParaNegar.titulo} negado`);
        }}
        title="Negar serviço?"
        description={
          servicoParaNegar
            ? `Tem certeza que deseja negar "${servicoParaNegar.titulo}" (${servicoParaNegar.contraparte})?`
            : ""
        }
        confirmLabel="Negar serviço"
        destructive
      />
    </>
  );
}
