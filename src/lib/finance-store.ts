import { useSyncExternalStore } from "react";
import {
  Boleto,
  BoletoTipo,
  NotaFiscal,
  NotaTipo,
  Servico,
  ServicoDirecao,
  ServicoStatus,
  initialBoletos,
  initialNotas,
  initialServicos,
} from "./finance-data";

export interface FinanceState {
  saldoEmCaixa: number;
  boletos: Boleto[];
  notas: NotaFiscal[];
  servicos: Servico[];
}

const STORAGE_KEY = "fluxa:finance:v1";

function createInitialState(): FinanceState {
  return {
    saldoEmCaixa: 14600,
    boletos: initialBoletos,
    notas: initialNotas,
    servicos: initialServicos,
  };
}

function loadState(): FinanceState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<FinanceState>;
    if (
      typeof parsed.saldoEmCaixa !== "number" ||
      !Array.isArray(parsed.boletos) ||
      !Array.isArray(parsed.notas) ||
      !Array.isArray(parsed.servicos)
    ) {
      return createInitialState();
    }
    return {
      saldoEmCaixa: parsed.saldoEmCaixa,
      boletos: parsed.boletos,
      notas: parsed.notas,
      servicos: parsed.servicos,
    };
  } catch {
    return createInitialState();
  }
}

let state: FinanceState = loadState();
const listeners = new Set<() => void>();

function emit() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }
  listeners.forEach((listener) => listener());
}

function setState(updater: (prev: FinanceState) => FinanceState) {
  state = updater(state);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

function gerarId(prefixo: string) {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function gerarChaveAcesso(numero: string) {
  const base = `3526111849231000014455001000${numero.padStart(6, "0")}`;
  const sufixo = String(Math.floor(1000000000 + Math.random() * 8999999999));
  return `${base}${sufixo}`.slice(0, 44);
}

function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const financeActions = {
  atualizarSaldoCaixa(novoSaldo: number) {
    setState((prev) => ({
      ...prev,
      saldoEmCaixa: Math.max(0, Number.isFinite(novoSaldo) ? novoSaldo : prev.saldoEmCaixa),
    }));
  },

  decidirServico(id: string, status: Exclude<ServicoStatus, "aguardando">) {
    setState((prev) => ({
      ...prev,
      servicos: prev.servicos.map((s) => (s.id === id ? { ...s, status } : s)),
    }));
  },

  reabrirServico(id: string) {
    setState((prev) => ({
      ...prev,
      servicos: prev.servicos.map((s) => (s.id === id ? { ...s, status: "aguardando" } : s)),
    }));
  },

  adicionarServico(input: {
    titulo: string;
    contraparte: string;
    direcao: ServicoDirecao;
    valor: number;
    observacao?: string;
  }) {
    const novo: Servico = {
      id: gerarId("srv"),
      titulo: input.titulo.trim(),
      contraparte: input.contraparte.trim(),
      direcao: input.direcao,
      valor: input.valor,
      data: new Date().toISOString().slice(0, 19),
      status: "aguardando",
      observacao: input.observacao?.trim() || undefined,
    };
    setState((prev) => ({
      ...prev,
      servicos: [novo, ...prev.servicos],
    }));
    return novo;
  },

  adicionarBoleto(input: {
    descricao: string;
    contraparte: string;
    tipo: BoletoTipo;
    valor: number;
    vencimento: string;
    categoria: string;
  }) {
    const hoje = hojeISO();
    const status = input.vencimento < hoje ? "vencido" : "aberto";
    const novo: Boleto = {
      id: gerarId("bol"),
      descricao: input.descricao.trim(),
      contraparte: input.contraparte.trim(),
      tipo: input.tipo,
      valor: input.valor,
      vencimento: input.vencimento,
      status,
      categoria: input.categoria.trim() || "Geral",
    };
    setState((prev) => ({
      ...prev,
      boletos: [novo, ...prev.boletos],
    }));
    return novo;
  },

  alternarPagamentoBoleto(id: string) {
    const hoje = hojeISO();
    setState((prev) => {
      const alvo = prev.boletos.find((b) => b.id === id);
      if (!alvo) return prev;
      const marcandoPago = alvo.status !== "pago";
      const novoStatus = marcandoPago
        ? "pago"
        : alvo.vencimento < hoje
          ? "vencido"
          : "aberto";
      const deltaCaixa = marcandoPago
        ? alvo.tipo === "receber"
          ? alvo.valor
          : -alvo.valor
        : alvo.tipo === "receber"
          ? -alvo.valor
          : alvo.valor;
      return {
        ...prev,
        saldoEmCaixa: prev.saldoEmCaixa + deltaCaixa,
        boletos: prev.boletos.map((b) =>
          b.id === id ? { ...b, status: novoStatus } : b
        ),
      };
    });
  },

  removerBoleto(id: string) {
    setState((prev) => ({
      ...prev,
      boletos: prev.boletos.filter((b) => b.id !== id),
    }));
  },

  emitirNota(input: {
    contraparte: string;
    documento: string;
    descricao: string;
    valor: number;
    tipo: NotaTipo;
    aliquotaIss: number;
    dataEmissao: string;
    autorizarImediatamente: boolean;
  }) {
    const ultimoNum = state.notas.reduce((max, n) => {
      const num = parseInt(n.numero, 10);
      return Number.isFinite(num) && num < 50000 ? Math.max(max, num) : max;
    }, 1485);
    const proximoNumero = String(ultimoNum + 1).padStart(6, "0");
    const nova: NotaFiscal = {
      id: gerarId("nf"),
      numero: proximoNumero,
      serie: "1",
      tipo: input.tipo,
      status: input.autorizarImediatamente ? "autorizada" : "pendente",
      contraparte: input.contraparte.trim(),
      documento: input.documento.trim(),
      descricao: input.descricao.trim(),
      valor: input.valor,
      aliquotaIss: input.aliquotaIss,
      dataEmissao: input.dataEmissao,
      chaveAcesso: gerarChaveAcesso(proximoNumero),
    };
    setState((prev) => ({
      ...prev,
      notas: [nova, ...prev.notas],
    }));
    return nova;
  },

  autorizarNota(id: string) {
    setState((prev) => ({
      ...prev,
      notas: prev.notas.map((n) =>
        n.id === id ? { ...n, status: "autorizada" } : n
      ),
    }));
  },

  cancelarNota(id: string) {
    setState((prev) => ({
      ...prev,
      notas: prev.notas.map((n) =>
        n.id === id ? { ...n, status: "cancelada" } : n
      ),
    }));
  },

  restaurarDados() {
    state = createInitialState();
    emit();
  },
};

export function useFinance(): FinanceState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
