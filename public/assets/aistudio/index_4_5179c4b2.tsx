import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Check, Clock, FileText, Receipt, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { fluxoMensal } from "@/lib/finance-data";
import { financeActions, useFinance } from "@/lib/finance-store";
import { dataCurta, dataHora, moeda } from "@/lib/format";

// TODO: trocar pelo saldo real em caixa vindo do store (ex.: useFinance().saldoAtual)
const SALDO_EM_CAIXA = 14600;

// TODO: trocar pelo nome do usuário logado
const NOME_USUARIO = "Marina";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel financeiro — Fluxa" },
      { name: "description", content: "Visão geral de boletos a pagar e receber, notas emitidas e serviços aguardando autorização." },
      { property: "og:title", content: "Painel financeiro — Fluxa" },
      { property: "og:description", content: "Visão geral de boletos, notas fiscais e autorizações de serviços." },
      { property: "og:type", content: "website" },
      // "summary" porque a página não tem og:image; use "summary_large_image" quando adicionar uma imagem
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Painel,
});

/** "AAAA-MM" do mês atual, para comparar com datas ISO (AAAA-MM-DD). */
function mesAtualISO(agora: Date) {
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

function rotuloMes(agora: Date) {
  const texto = agora.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(" de ", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function saudacao(hora: number) {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * Calcula saudação e mês só no navegador, depois de montar,
 * para não haver diferença entre o HTML do servidor e o do cliente (hydration).
 */
function useCabecalho() {
  const [estado, setEstado] = useState({ saudacao: "Olá", mes: "" });
  useEffect(() => {
    const agora = new Date();
    setEstado({ saudacao: saudacao(agora.getHours()), mes: rotuloMes(agora) });
  }, []);
  return estado;
}

function Painel() {
  const { boletos, notas, servicos } = useFinance();
  const cabecalho = useCabecalho();
  const mesAtual = mesAtualISO(new Date());

  const abertos = boletos.filter((b) => b.status !== "pago");
  // Saldo do mês: boletos em aberto que vencem até o fim deste mês (inclui os já vencidos)
  const abertosAteFimDoMes = abertos.filter((b) => b.vencimento.slice(0, 7) <= mesAtual);
  const aPagar = abertosAteFimDoMes.filter((b) => b.tipo === "pagar").reduce((a, b) => a + b.valor, 0);
  const aReceber = abertosAteFimDoMes.filter((b) => b.tipo === "receber").reduce((a, b) => a + b.valor, 0);
  const vencidos = boletos.filter((b) => b.status === "vencido");
  // TODO: filtrar também pelo mês da emissão quando confirmar o nome do campo de data da nota
  const notasAut = notas.filter((n) => n.tipo === "emitida" && n.status === "autorizada");
  const aguardando = servicos.filter((s) => s.status === "aguardando");
  // Ordenação por texto funciona porque vencimento está em ISO (AAAA-MM-DD)
  const proximos = [...abertos].sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow={cabecalho.mes}
        title={`${cabecalho.saudacao}, ${NOME_USUARIO}`}
        description="Veja o que vence, o que entra e o que está esperando sua aprovação hoje."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/boletos">
                <Receipt /> Novo boleto
              </Link>
            </Button>
            <Button asChild>
              <Link to="/notas">
                <FileText /> Emitir nota
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="hero-panel rise-in relative flex flex-col overflow-hidden p-6 lg:col-span-2">
          <p className="text-sm text-sidebar-muted">Saldo previsto do mês</p>
          <p className="num mt-2 text-4xl font-semibold sm:text-5xl">{moeda(SALDO_EM_CAIXA + aReceber - aPagar)}</p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
            <div className="rounded-xl bg-sidebar-accent/70 p-3.5">
              <p className="flex items-center gap-1.5 text-xs text-sidebar-muted">
                <ArrowDownLeft className="size-3.5 text-sidebar-primary" /> A receber
              </p>
              <p className="num mt-1 text-lg font-semibold">{moeda(aReceber)}</p>
            </div>
            <div className="rounded-xl bg-sidebar-accent/70 p-3.5">
              <p className="flex items-center gap-1.5 text-xs text-sidebar-muted">
                <ArrowUpRight className="size-3.5" /> A pagar
              </p>
              <p className="num mt-1 text-lg font-semibold">{moeda(aPagar)}</p>
            </div>
          </div>
          <div className="mt-auto flex flex-wrap gap-x-6 gap-y-1 pt-6 text-sm text-sidebar-muted">
            <span><span className="num font-semibold text-sidebar-foreground">{abertos.length}</span> boletos em aberto</span>
            <span><span className="num font-semibold text-sidebar-primary">{aguardando.length}</span> serviços aguardando autorização</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            label="Boletos vencidos"
            value={String(vencidos.length)}
            icon={<Clock className="size-4" />}
            hint={<span className="text-destructive">{moeda(vencidos.reduce((a, b) => a + b.valor, 0))} em atraso</span>}
          />
          <StatCard
            label="Notas autorizadas no mês"
            value={String(notasAut.length)}
            icon={<FileText className="size-4" />}
            hint={`${moeda(notasAut.reduce((a, b) => a + b.valor, 0))} faturados`}
          />
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="surface p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Fluxo de caixa</h2>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" />Entradas</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2" />Saídas</span>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fluxoMensal} margin={{ left: -12, right: 4, top: 4 }}>
                <defs>
                  <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  formatter={(v) => moeda(Number(v))}
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="entradas" name="Entradas" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gEnt)" />
                <Area type="monotone" dataKey="saidas" name="Saídas" stroke="var(--chart-2)" strokeWidth={1.5} fill="url(#gSai)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Próximos vencimentos</h2>
            <Link to="/boletos" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todos <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {proximos.length === 0 ? (
            <div className="mt-6 rounded-xl bg-success-soft p-4 text-sm text-success">
              <p className="font-medium">Nenhum boleto em aberto.</p>
              <Link to="/boletos" className="mt-1 inline-block underline">
                Cadastrar um boleto
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y">
              {proximos.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${b.tipo === "receber" ? "bg-success-soft text-success" : "bg-secondary text-secondary-foreground"}`}
                  >
                    {b.tipo === "receber" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{b.descricao}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.contraparte} · {dataCurta(b.vencimento)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm font-semibold">{moeda(b.valor)}</p>
                    <StatusBadge status={b.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="surface mt-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Aguardando sua autorização</h2>
            <p className="text-sm text-muted-foreground">Serviços que chegaram ou vão sair e ainda não foram liberados.</p>
          </div>
          <Link to="/servicos" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Entradas e saídas <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {aguardando.length === 0 ? (
          <p className="mt-6 rounded-xl bg-success-soft p-4 text-sm font-medium text-success">Tudo em dia — nenhum serviço pendente.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {aguardando.map((s) => (
              <div key={s.id} className="rounded-xl border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${s.direcao === "entrada" ? "text-info" : "text-primary"}`}>
                    {s.direcao === "entrada" ? "Chegada" : "Saída"}
                  </span>
                  <span className="text-xs text-muted-foreground">{dataHora(s.data)}</span>
                </div>
                <p className="mt-2 font-semibold">{s.titulo}</p>
                <p className="text-sm text-muted-foreground">{s.contraparte}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="num font-semibold">{moeda(s.valor)}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!window.confirm(`Negar "${s.titulo}"?`)) return;
                        financeActions.decidirServico(s.id, "negado");
                        toast(`${s.titulo} negado`);
                      }}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
