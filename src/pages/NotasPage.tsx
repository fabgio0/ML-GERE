import { useMemo, useState } from "react";
import { Ban, Check, Copy, Eye, FileText, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { NotaFiscal, NotaTipo } from "@/lib/finance-data";
import { financeActions, useFinance } from "@/lib/finance-store";
import { dataCompleta, moeda } from "@/lib/format";

type FiltroNota = "todas" | "emitida" | "recebida" | "pendente" | "cancelada";

export function NotasPage() {
  const { notas } = useFinance();
  const [filtro, setFiltro] = useState<FiltroNota>("todas");
  const [busca, setBusca] = useState("");
  const [modalEmitir, setModalEmitir] = useState(false);
  const [notaVisualizada, setNotaVisualizada] = useState<NotaFiscal | null>(null);
  const [notaParaCancelar, setNotaParaCancelar] = useState<NotaFiscal | null>(null);

  const [tipo, setTipo] = useState<NotaTipo>("emitida");
  const [contraparte, setContraparte] = useState("");
  const [documento, setDocumento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [aliquotaIss, setAliquotaIss] = useState("5");
  const [dataEmissao, setDataEmissao] = useState("2026-11-22");
  const [autorizarAgora, setAutorizarAgora] = useState(true);

  const resumo = useMemo(() => {
    const emitidasAut = notas.filter(
      (n) => n.tipo === "emitida" && n.status === "autorizada"
    );
    const pendentes = notas.filter((n) => n.status === "pendente");
    const recebidas = notas.filter(
      (n) => n.tipo === "recebida" && n.status === "autorizada"
    );
    const totalIss = emitidasAut.reduce(
      (s, n) => s + (n.valor * n.aliquotaIss) / 100,
      0
    );
    return {
      faturado: emitidasAut.reduce((s, n) => s + n.valor, 0),
      emitidasCount: emitidasAut.length,
      pendentesCount: pendentes.length,
      recebidasTotal: recebidas.reduce((s, n) => s + n.valor, 0),
      totalIss,
    };
  }, [notas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return notas.filter((n) => {
      if (filtro === "emitida" && n.tipo !== "emitida") return false;
      if (filtro === "recebida" && n.tipo !== "recebida") return false;
      if (filtro === "pendente" && n.status !== "pendente") return false;
      if (filtro === "cancelada" && n.status !== "cancelada") return false;
      if (!termo) return true;
      return (
        n.numero.includes(termo) ||
        n.contraparte.toLowerCase().includes(termo) ||
        n.descricao.toLowerCase().includes(termo) ||
        n.documento.includes(termo)
      );
    });
  }, [notas, filtro, busca]);

  const handleEmitirNota = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = Number(valor.replace(",", "."));
    const issNum = Number(aliquotaIss.replace(",", "."));
    if (
      !contraparte.trim() ||
      !documento.trim() ||
      !descricao.trim() ||
      !Number.isFinite(valorNum) ||
      valorNum <= 0
    ) {
      toast.error("Preencha os dados do tomador, descrição e valor da nota");
      return;
    }
    const nova = financeActions.emitirNota({
      contraparte,
      documento,
      descricao,
      valor: valorNum,
      tipo,
      aliquotaIss: Number.isFinite(issNum) && issNum >= 0 ? issNum : 5,
      dataEmissao,
      autorizarImediatamente: autorizarAgora,
    });
    toast.success(`Nota ${nova.numero} ${autorizarAgora ? "emitida e autorizada" : "enviada para processamento"}`);
    setContraparte("");
    setDocumento("");
    setDescricao("");
    setValor("");
    setModalEmitir(false);
  };

  const tabs: { key: FiltroNota; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "emitida", label: "Emitidas" },
    { key: "recebida", label: "Recebidas" },
    { key: "pendente", label: "Pendentes" },
    { key: "cancelada", label: "Canceladas" },
  ];

  const valorPrevisto = Number(valor.replace(",", ".")) || 0;
  const issPrevisto = (valorPrevisto * (Number(aliquotaIss) || 0)) / 100;

  return (
    <>
      <PageHeader
        eyebrow="Documentos fiscais"
        title="Notas fiscais"
        description="Emita NFS-e, acompanhe autorizações na prefeitura e consulte chaves de acesso."
        actions={
          <Button onClick={() => setModalEmitir(true)}>
            <Plus /> Emitir nota
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Faturamento autorizado"
          value={moeda(resumo.faturado)}
          hint={`${resumo.emitidasCount} notas emitidas`}
        />
        <StatCard
          label="ISS estimado"
          value={moeda(resumo.totalIss)}
          hint="Sobre notas autorizadas"
        />
        <StatCard
          label="Notas pendentes"
          value={String(resumo.pendentesCount)}
          hint="Aguardando retorno fiscal"
        />
        <StatCard
          label="Notas recebidas"
          value={moeda(resumo.recebidasTotal)}
          hint="Serviços tomados"
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
              placeholder="Buscar número, CNPJ ou cliente..."
              aria-label="Buscar notas fiscais"
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhuma nota fiscal encontrada.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Emita uma nova NFS-e ou limpe os filtros atuais.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {(filtro !== "todas" || busca) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltro("todas");
                    setBusca("");
                  }}
                >
                  Limpar filtros
                </Button>
              )}
              <Button size="sm" onClick={() => setModalEmitir(true)}>
                <Plus /> Emitir nota
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Tomador / Prestador</th>
                  <th className="px-4 py-3">Emissão</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtradas.map((n) => (
                  <tr key={n.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                          <FileText className="size-4" />
                        </span>
                        <div>
                          <p className="font-mono text-xs font-semibold text-foreground">
                            NF {n.numero}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {n.tipo === "emitida" ? "Emitida" : "Recebida"} · Série {n.serie}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-foreground">{n.contraparte}</p>
                      <p className="truncate max-w-xs text-xs text-muted-foreground">
                        {n.documento} · {n.descricao}
                      </p>
                    </td>
                    <td className="num px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                      {dataCompleta(n.dataEmissao)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={n.status} />
                    </td>
                    <td className="num px-4 py-3.5 text-right font-semibold whitespace-nowrap">
                      {moeda(n.valor)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNotaVisualizada(n)}
                        >
                          <Eye /> Detalhes
                        </Button>
                        {n.status === "pendente" && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              financeActions.autorizarNota(n.id);
                              toast.success(`Nota ${n.numero} autorizada`);
                            }}
                          >
                            <Check /> Autorizar
                          </Button>
                        )}
                        {n.status !== "cancelada" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setNotaParaCancelar(n)}
                            aria-label={`Cancelar nota ${n.numero}`}
                          >
                            <Ban />
                          </Button>
                        )}
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
        open={modalEmitir}
        onClose={() => setModalEmitir(false)}
        title="Emitir nota fiscal"
        description="Preencha os dados do serviço para geração da NFS-e."
      >
        <form onSubmit={handleEmitirNota} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setTipo("emitida")}
              className={`h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tipo === "emitida"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nota emitida
            </button>
            <button
              type="button"
              onClick={() => setTipo("recebida")}
              className={`h-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tipo === "recebida"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nota recebida
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nf-contra" className="block text-sm font-medium">
                {tipo === "emitida" ? "Tomador (cliente)" : "Prestador (fornecedor)"}
              </label>
              <input
                id="nf-contra"
                type="text"
                value={contraparte}
                onChange={(e) => setContraparte(e.target.value)}
                placeholder="Razão social"
                className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                required
              />
            </div>

            <div>
              <label htmlFor="nf-doc" className="block text-sm font-medium">
                CNPJ / CPF
              </label>
              <input
                id="nf-doc"
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="num mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="nf-desc" className="block text-sm font-medium">
              Discriminação dos serviços
            </label>
            <textarea
              id="nf-desc"
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição detalhada do serviço prestado"
              className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="nf-valor" className="block text-sm font-medium">
                Valor bruto (R$)
              </label>
              <input
                id="nf-valor"
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
              <label htmlFor="nf-iss" className="block text-sm font-medium">
                ISS (%)
              </label>
              <input
                id="nf-iss"
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={aliquotaIss}
                onChange={(e) => setAliquotaIss(e.target.value)}
                className="num mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div>
              <label htmlFor="nf-data" className="block text-sm font-medium">
                Data emissão
              </label>
              <input
                id="nf-data"
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="num mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3.5 py-2.5 text-xs">
            <span className="text-muted-foreground">ISS calculado</span>
            <span className="num font-semibold text-foreground">{moeda(issPrevisto)}</span>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autorizarAgora}
              onChange={(e) => setAutorizarAgora(e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            <span>Autorizar imediatamente na prefeitura</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalEmitir(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Emitir nota</Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(notaVisualizada)}
        onClose={() => setNotaVisualizada(null)}
        title={notaVisualizada ? `Espelho da NFS-e ${notaVisualizada.numero}` : ""}
        description={
          notaVisualizada
            ? `Série ${notaVisualizada.serie} · Emissão ${dataCompleta(notaVisualizada.dataEmissao)}`
            : ""
        }
      >
        {notaVisualizada && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-muted-foreground">Situação fiscal</span>
              <StatusBadge status={notaVisualizada.status} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  {notaVisualizada.tipo === "emitida" ? "Tomador" : "Prestador"}
                </p>
                <p className="font-medium text-foreground">{notaVisualizada.contraparte}</p>
                <p className="num text-xs text-muted-foreground">{notaVisualizada.documento}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-muted-foreground">Valor do serviço</p>
                <p className="num text-lg font-semibold text-foreground">
                  {moeda(notaVisualizada.valor)}
                </p>
                <p className="num text-xs text-muted-foreground">
                  ISS ({notaVisualizada.aliquotaIss}%):{" "}
                  {moeda((notaVisualizada.valor * notaVisualizada.aliquotaIss) / 100)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Discriminação</p>
              <p className="mt-1 rounded-xl bg-muted/50 p-3 text-foreground">
                {notaVisualizada.descricao}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Chave de acesso</p>
              <div className="mt-1 flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <span className="truncate font-mono text-xs text-foreground">
                  {notaVisualizada.chaveAcesso}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(notaVisualizada.chaveAcesso);
                    toast.success("Chave de acesso copiada");
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0 cursor-pointer"
                >
                  <Copy className="size-3.5" /> Copiar
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setNotaVisualizada(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(notaParaCancelar)}
        onClose={() => setNotaParaCancelar(null)}
        onConfirm={() => {
          if (!notaParaCancelar) return;
          financeActions.cancelarNota(notaParaCancelar.id);
          toast(`Nota ${notaParaCancelar.numero} cancelada`);
        }}
        title="Cancelar nota fiscal?"
        description={
          notaParaCancelar
            ? `A nota ${notaParaCancelar.numero} (${notaParaCancelar.contraparte}) será marcada como cancelada.`
            : ""
        }
        confirmLabel="Cancelar nota"
        destructive
      />
    </>
  );
}
