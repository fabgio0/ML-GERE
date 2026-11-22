export type BoletoTipo = "pagar" | "receber";
export type BoletoStatus = "aberto" | "vencido" | "pago";

export interface Boleto {
  id: string;
  descricao: string;
  contraparte: string;
  tipo: BoletoTipo;
  valor: number;
  vencimento: string; // ISO YYYY-MM-DD
  status: BoletoStatus;
  categoria: string;
  codigoBarras?: string;
}

export type NotaTipo = "emitida" | "recebida";
export type NotaStatus = "autorizada" | "pendente" | "cancelada";

export interface NotaFiscal {
  id: string;
  numero: string;
  serie: string;
  tipo: NotaTipo;
  status: NotaStatus;
  contraparte: string;
  documento: string; // CNPJ/CPF
  descricao: string;
  valor: number;
  aliquotaIss: number;
  dataEmissao: string; // ISO YYYY-MM-DD
  chaveAcesso: string;
}

export type ServicoDirecao = "entrada" | "saida";
export type ServicoStatus = "aguardando" | "autorizado" | "negado";

export interface Servico {
  id: string;
  titulo: string;
  contraparte: string;
  direcao: ServicoDirecao;
  valor: number;
  data: string; // ISO YYYY-MM-DDTHH:mm:ss
  status: ServicoStatus;
  observacao?: string;
}

export interface FluxoMensalItem {
  mes: string;
  entradas: number;
  saidas: number;
}

export const fluxoMensal: FluxoMensalItem[] = [
  { mes: "Jun", entradas: 38400, saidas: 24100 },
  { mes: "Jul", entradas: 42900, saidas: 26800 },
  { mes: "Ago", entradas: 39600, saidas: 29400 },
  { mes: "Set", entradas: 48200, saidas: 27900 },
  { mes: "Out", entradas: 51800, saidas: 31200 },
  { mes: "Nov", entradas: 56400, saidas: 28950 },
];

export const initialBoletos: Boleto[] = [
  {
    id: "bol-1",
    descricao: "Consultoria de arquitetura em nuvem",
    contraparte: "Grupo Horizonte S.A.",
    tipo: "receber",
    valor: 12400,
    vencimento: "2026-11-24",
    status: "aberto",
    categoria: "Serviços recorrentes",
    codigoBarras: "34191.79001 01043.510047 91020.150008 6 98940001240000",
  },
  {
    id: "bol-2",
    descricao: "Licenciamento de infraestrutura AWS",
    contraparte: "Amazon Web Services Brasil",
    tipo: "pagar",
    valor: 3890.5,
    vencimento: "2026-11-20",
    status: "vencido",
    categoria: "Infraestrutura",
    codigoBarras: "03399.63290 64000.000018 00145.670109 1 98900000389050",
  },
  {
    id: "bol-3",
    descricao: "Desenvolvimento módulo fiscal — Parcela 2/3",
    contraparte: "Vértice Logística Ltda.",
    tipo: "receber",
    valor: 8900,
    vencimento: "2026-11-27",
    status: "aberto",
    categoria: "Projetos sob demanda",
    codigoBarras: "34191.79001 01043.510047 91020.150008 4 98970000890000",
  },
  {
    id: "bol-4",
    descricao: "Aluguel e condomínio — Sala 904",
    contraparte: "Edifício Paulista Corporate",
    tipo: "pagar",
    valor: 4250,
    vencimento: "2026-11-25",
    status: "aberto",
    categoria: "Ocupação",
    codigoBarras: "23793.38128 60000.000003 00000.000409 8 98950000425000",
  },
  {
    id: "bol-5",
    descricao: "Honorários contábeis — Competência Nov",
    contraparte: "Bastos & Nogueira Contabilidade",
    tipo: "pagar",
    valor: 1650,
    vencimento: "2026-11-18",
    status: "vencido",
    categoria: "Contabilidade",
    codigoBarras: "00190.00009 02759.104004 20193.291174 2 98880000165000",
  },
  {
    id: "bol-6",
    descricao: "Manutenção plataforma e SLA mensal",
    contraparte: "Clínica São Lucas",
    tipo: "receber",
    valor: 6400,
    vencimento: "2026-11-29",
    status: "aberto",
    categoria: "Serviços recorrentes",
    codigoBarras: "34191.79001 01043.510047 91020.150008 9 98990000640000",
  },
  {
    id: "bol-7",
    descricao: "Assinatura suíte de design e prototipagem",
    contraparte: "Figma Organization",
    tipo: "pagar",
    valor: 980,
    vencimento: "2026-11-12",
    status: "pago",
    categoria: "Software",
  },
  {
    id: "bol-8",
    descricao: "Implantação painel de indicadores",
    contraparte: "Norte Sul Distribuidora",
    tipo: "receber",
    valor: 11200,
    vencimento: "2026-11-10",
    status: "pago",
    categoria: "Projetos sob demanda",
  },
  {
    id: "bol-9",
    descricao: "Auditoria de segurança — Fase 1",
    contraparte: "Atlas Fintech S.A.",
    tipo: "receber",
    valor: 14500,
    vencimento: "2026-12-05",
    status: "aberto",
    categoria: "Consultoria",
  },
];

export const initialNotas: NotaFiscal[] = [
  {
    id: "nf-1",
    numero: "001482",
    serie: "1",
    tipo: "emitida",
    status: "autorizada",
    contraparte: "Grupo Horizonte S.A.",
    documento: "18.492.310/0001-44",
    descricao: "Consultoria de arquitetura em nuvem e sustentação técnica",
    valor: 12400,
    aliquotaIss: 5,
    dataEmissao: "2026-11-04",
    chaveAcesso: "35261118492310000144550010000014821048291032",
  },
  {
    id: "nf-2",
    numero: "001483",
    serie: "1",
    tipo: "emitida",
    status: "autorizada",
    contraparte: "Norte Sul Distribuidora",
    documento: "42.103.889/0001-19",
    descricao: "Implantação de painel executivo de indicadores financeiros",
    valor: 11200,
    aliquotaIss: 5,
    dataEmissao: "2026-11-08",
    chaveAcesso: "35261142103889000119550010000014831928374610",
  },
  {
    id: "nf-3",
    numero: "001484",
    serie: "1",
    tipo: "emitida",
    status: "autorizada",
    contraparte: "Vértice Logística Ltda.",
    documento: "09.774.215/0001-82",
    descricao: "Desenvolvimento de módulo fiscal integrado — Parcela 2/3",
    valor: 8900,
    aliquotaIss: 3,
    dataEmissao: "2026-11-15",
    chaveAcesso: "35261109774215000182550010000014841564738291",
  },
  {
    id: "nf-4",
    numero: "001485",
    serie: "1",
    tipo: "emitida",
    status: "pendente",
    contraparte: "Clínica São Lucas",
    documento: "27.319.640/0001-05",
    descricao: "Manutenção de plataforma e atendimento SLA — Novembro/2026",
    valor: 6400,
    aliquotaIss: 5,
    dataEmissao: "2026-11-21",
    chaveAcesso: "35261127319640000105550010000014851120394857",
  },
  {
    id: "nf-5",
    numero: "089211",
    serie: "2",
    tipo: "recebida",
    status: "autorizada",
    contraparte: "Bastos & Nogueira Contabilidade",
    documento: "11.204.588/0001-70",
    descricao: "Assessoria contábil e apuração fiscal mensal",
    valor: 1650,
    aliquotaIss: 2,
    dataEmissao: "2026-11-11",
    chaveAcesso: "35261111204588000170550020000892111839201945",
  },
  {
    id: "nf-6",
    numero: "001480",
    serie: "1",
    tipo: "emitida",
    status: "cancelada",
    contraparte: "Estúdio Prisma Arquitetura",
    documento: "33.908.112/0001-61",
    descricao: "Serviço substituído por ajuste de CNPJ do tomador",
    valor: 3200,
    aliquotaIss: 5,
    dataEmissao: "2026-11-02",
    chaveAcesso: "35261133908112000161550010000014801002938475",
  },
];

export const initialServicos: Servico[] = [
  {
    id: "srv-1",
    titulo: "Migração de banco de dados em produção",
    contraparte: "Grupo Horizonte S.A.",
    direcao: "saida",
    valor: 4800,
    data: "2026-11-22T14:30:00",
    status: "aguardando",
    observacao: "Janela agendada para sábado às 22h com equipe de plantão.",
  },
  {
    id: "srv-2",
    titulo: "Auditoria de conformidade LGPD",
    contraparte: "Ferramenta Segura Consultoria",
    direcao: "entrada",
    valor: 3450,
    data: "2026-11-22T10:15:00",
    status: "aguardando",
    observacao: "Escopo revisado pela diretoria jurídica.",
  },
  {
    id: "srv-3",
    titulo: "Integração de gateway PIX recorrente",
    contraparte: "Clínica São Lucas",
    direcao: "saida",
    valor: 5600,
    data: "2026-11-21T17:45:00",
    status: "aguardando",
    observacao: "Aguarda liberação de credenciais de homologação.",
  },
  {
    id: "srv-4",
    titulo: "Manutenção preventiva de servidores",
    contraparte: "DataCore Infraestrutura",
    direcao: "entrada",
    valor: 2100,
    data: "2026-11-19T09:00:00",
    status: "autorizado",
    observacao: "Concluído conforme SLA.",
  },
  {
    id: "srv-5",
    titulo: "Treinamento de equipe comercial",
    contraparte: "Vértice Logística Ltda.",
    direcao: "saida",
    valor: 2900,
    data: "2026-11-17T15:20:00",
    status: "autorizado",
    observacao: "Faturado na competência atual.",
  },
  {
    id: "srv-6",
    titulo: "Expansão de licenças temporárias",
    contraparte: "Nuvem Ágil Ltda.",
    direcao: "entrada",
    valor: 1850,
    data: "2026-11-14T11:10:00",
    status: "negado",
    observacao: "Substituído pelo contrato anual existente.",
  },
];
