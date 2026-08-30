export type BirthdayState={age:number;ageTurning:number;daysUntil:number;monthsUntil:number;remainingDays:number;isBirthday:boolean;nextBirthday:Date;tier:'DISCREET'|'SECONDARY'|'RELEVANT'|'HIGHLIGHT'|'TODAY'};

function dateOnly(value:string|Date){
  if(value instanceof Date)return new Date(value.getFullYear(),value.getMonth(),value.getDate());
  const [year,month,day]=value.slice(0,10).split('-').map(Number);
  return new Date(year,month-1,day);
}

export function getBirthdayState(birthDate:string,now=new Date()):BirthdayState{
  const birth=dateOnly(birthDate),today=dateOnly(now);
  let age=today.getFullYear()-birth.getFullYear();
  const passed=today.getMonth()>birth.getMonth()||(today.getMonth()===birth.getMonth()&&today.getDate()>=birth.getDate());
  if(!passed)age--;
  let next=new Date(today.getFullYear(),birth.getMonth(),birth.getDate());
  if(next<today)next=new Date(today.getFullYear()+1,birth.getMonth(),birth.getDate());
  const daysUntil=Math.round((next.getTime()-today.getTime())/86400000);
  let cursor=new Date(today),monthsUntil=0;
  while(monthsUntil<12){const candidate=new Date(cursor.getFullYear(),cursor.getMonth()+1,cursor.getDate());if(candidate>next)break;cursor=candidate;monthsUntil++}
  const remainingDays=Math.max(0,Math.round((next.getTime()-cursor.getTime())/86400000));
  const tier=daysUntil===0?'TODAY':daysUntil<30?'HIGHLIGHT':daysUntil<90?'RELEVANT':daysUntil<=180?'SECONDARY':'DISCREET';
  return{age,ageTurning:age+1,daysUntil,monthsUntil,remainingDays,isBirthday:daysUntil===0,nextBirthday:next,tier};
}

export function ageBand(age:number){return age<=12?'JUNIOR':age<=14?'EXPLORER':'INDEPENDENT'}

export function ageGuidance(age:number){
  if(age<=12)return{tone:'Frases curtas, uma ação por vez e exemplo concreto.',support:'Peça ajuda de um adulto nas decisões e registre com foto ou poucas palavras.'};
  if(age<=14)return{tone:'Linguagem direta, escolhas guiadas e comparação simples.',support:'Explique sua escolha e mostre o resultado com uma evidência.'};
  return{tone:'Mais autonomia, contexto real e reflexão sobre consequência.',support:'Planeje, execute e justifique suas decisões com evidências.'};
}

export function moneyBRL(value:number){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value)}

export function formatBrazilianDateInput(value:string){
  const digits=value.replace(/\D/g,'').slice(0,8);
  return[digits.slice(0,2),digits.slice(2,4),digits.slice(4,8)].filter(Boolean).join(' / ');
}

export function parseBrazilianBirthDate(value:string,now=new Date()){
  const match=value.match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/);
  if(!match)return null;
  const day=Number(match[1]),month=Number(match[2]),year=Number(match[3]);
  const date=new Date(year,month-1,day);
  if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day)return null;
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  if(date>today||year<1900)return null;
  return`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export function friendlyError(error:unknown,fallback='Não foi possível concluir agora. Tente novamente.'){
  const message=typeof error==='string'?error:error&&typeof error==='object'&&'message' in error?String(error.message):'';
  if(message.includes('active_conquest'))return'Você já está correndo atrás de uma conquista.';
  if(/network|fetch|connection|timeout/i.test(message))return'Sem conexão no momento. Confira sua internet e tente novamente.';
  if(/unauthorized|permission|rls|policy|jwt/i.test(message))return'Você não tem permissão para fazer isso.';
  return fallback;
}

export function onboardingIsComplete(role:'PARENT'|'YOUTH'|'ADMIN',record:{onboarding_completed_at?:string|null;birth_date?:string|null}|null){
  if(role==='ADMIN')return true;
  if(!record?.onboarding_completed_at)return false;
  return role==='PARENT'||Boolean(record.birth_date);
}
