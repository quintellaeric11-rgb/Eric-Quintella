const normalized=(value?:string|null)=>String(value||'').trim().toUpperCase().replaceAll('-','_').replaceAll(' ','_');

const status:Record<string,string>={DRAFT:'Rascunho',PENDING:'Pendente',PENDING_REVIEW:'Aguardando revisão',CHANGES_REQUESTED:'Ajustes solicitados',APPROVED:'Aprovada',ACTIVE:'Ativa',COMPLETED:'Concluída',ARCHIVED:'Encerrada',CANCELLED:'Cancelada',LOCKED:'Bloqueada',AVAILABLE:'Disponível',STARTED:'Em andamento',SUBMITTED:'Aguardando revisão',NEEDS_CHANGES:'Precisa de ajuste',SAVED:'Guardada'};
const evidence:Record<string,string>={TEXT:'Texto',IMAGE:'Foto',AUDIO:'Áudio',LINK:'Link'};
const role:Record<string,string>={PARENT:'Responsável',YOUTH:'Jovem',ADMIN:'Administrador'};
const skill:Record<string,string>={FINANCIAL_EDUCATION:'Educação financeira',FINANCIAL_LITERACY:'Educação financeira',DECISION_MAKING:'Tomada de decisão',CRITICAL_THINKING:'Pensamento crítico',PROBLEM_SOLVING:'Resolução de problemas',TIME_MANAGEMENT:'Gestão do tempo',SELF_KNOWLEDGE:'Autoconhecimento',ENTREPRENEURSHIP:'Empreendedorismo',AUTONOMY:'Autonomia',COMMUNICATION:'Comunicação',DISCIPLINE:'Disciplina',ORGANIZATION:'Organização',RESPONSIBILITY:'Responsabilidade',INITIATIVE:'Iniciativa'};

export const statusLabel=(value?:string|null)=>status[normalized(value)]||value||'Não informado';
export const evidenceLabel=(value?:string|null)=>evidence[normalized(value)]||value||'Não informado';
export const roleLabel=(value?:string|null)=>role[normalized(value)]||value||'Não informado';
export const skillLabel=(value?:string|null)=>skill[normalized(value)]||value||'Não informado';
