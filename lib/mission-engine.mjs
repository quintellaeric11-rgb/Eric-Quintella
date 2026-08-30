const skillMap={
  'Educação financeira':'financial_literacy','Autonomia':'autonomy','Comunicação':'communication','Pensamento crítico':'critical_thinking','Tomada de decisão':'decision_making','Disciplina':'discipline','Empreendedorismo':'entrepreneurship','Organização':'organization','Responsabilidade':'responsibility','Iniciativa':'autonomy'
};
const patterns=[
  {test:/it[aá]lia|viag|roma|paris|jap[aã]o|interc[aâ]mbio/i,type:'travel',category:'travel',natural:x=>`a viagem para ${/it[aá]lia/i.test(x)?'a Itália':/jap[aã]o/i.test(x)?'o Japão':/roma/i.test(x)?'Roma':/paris/i.test(x)?'Paris':'o destino escolhido'}`,complexity:'very_high',components:{financial:'high',planning:'high',research:'high',logistics:'high',social:'high',pedagogical:'very_high'}},
  {test:/neg[oó]cio|empresa|empreend|loja|startup/i,type:'project',category:'entrepreneurship',natural:()=>`o primeiro negócio`,complexity:'very_high',components:{financial:'high',planning:'high',research:'high',logistics:'medium',social:'high',pedagogical:'very_high'}},
  {test:/show|festival|concerto|evento/i,type:'experience',category:'entertainment',natural:()=>`o show que você quer viver`,complexity:'medium',components:{financial:'medium',planning:'medium',research:'medium',logistics:'medium',social:'medium',pedagogical:'medium'}},
  {test:/ps5|playstation|xbox|notebook|celular|iphone|computador/i,type:'physical_product',category:'technology',natural:x=>/ps5|playstation/i.test(x)?'o PlayStation 5 que você quer':'o equipamento que você quer',complexity:'medium',components:{financial:'high',planning:'medium',research:'high',logistics:'low',social:'low',pedagogical:'high'}},
  {test:/casaco|t[eê]nis|roupa|jaqueta|vestido/i,type:'physical_product',category:'fashion',natural:x=>/casaco/i.test(x)?'o casaco que você quer':'a peça que você quer',complexity:'simple',components:{financial:'medium',planning:'low',research:'medium',logistics:'low',social:'low',pedagogical:'medium'}},
];
export function classifyGoal(raw){
  const cleaned=String(raw||'').trim().replace(/[.!?]+$/,'');const hit=patterns.find(p=>p.test.test(cleaned))||{type:'other',category:'other',natural:()=>`essa conquista`,complexity:'medium',components:{financial:'medium',planning:'medium',research:'medium',logistics:'low',social:'medium',pedagogical:'medium'}};
  let normalized=cleaned.replace(/^(eu\s+)?(quero|gostaria de|desejo)\s+/i,'').replace(/^(comprar|viajar para|ir a|ir ao|criar)\s+/i,'').trim();if(/it[aá]lia/i.test(cleaned))normalized='viagem para a Itália';if(/ps5|playstation/i.test(cleaned))normalized='PlayStation 5';if(/casaco/i.test(cleaned))normalized='casaco';if(/show/i.test(cleaned))normalized='show';if(/neg[oó]cio/i.test(cleaned))normalized='primeiro negócio';
  return{raw_goal:cleaned,normalized_goal:normalized,natural_reference:hit.natural(cleaned),goal_type:hit.type,goal_category:hit.category,natural_complexity:hit.complexity,...hit.components};
}
const bandValue={low:1,medium:2,high:3,very_high:4,simple:1};
const skillLabel={financial_literacy:'educação financeira',autonomy:'autonomia',communication:'comunicação',critical_thinking:'pensamento crítico',decision_making:'tomada de decisão',discipline:'disciplina',entrepreneurship:'empreendedorismo',organization:'organização',responsibility:'responsabilidade'};
function withPrep(reference,prep){const match=reference.match(/^(o|a|essa)\s+(.+)$/i);if(!match)return`${prep} ${reference}`;const[,article,rest]=match;if(prep==='de')return`${article.toLowerCase()==='o'?'do':article.toLowerCase()==='a'?'da':'dessa'} ${rest}`;if(prep==='em')return`${article.toLowerCase()==='o'?'no':article.toLowerCase()==='a'?'na':'nessa'} ${rest}`;if(prep==='a')return`${article.toLowerCase()==='o'?'ao':article.toLowerCase()==='a'?'à':'a essa'} ${rest}`;return`${prep} ${reference}`}
export function complexityFor(classification,parentGoals=[],age=14){
  const natural=bandValue[classification.natural_complexity]||2,pedagogy=bandValue[classification.pedagogical]||2,skills=Math.min(4,Math.max(1,new Set(parentGoals.map(x=>skillMap[x]||x)).size)),maturity=age<12?1:age<16?2:3,deadline=2;
  const score=(natural/4)*30+(pedagogy/4)*30+(skills/4)*15+(maturity/3)*10+(deadline/3)*15;
  const band=score<38?'very_simple':score<50?'simple':score<63?'medium':score<75?'robust':score<86?'complex':'large_project';const counts={very_simple:6,simple:8,medium:10,robust:14,complex:18,large_project:22};
  return{score:Number(score.toFixed(3)),band,count:counts[band],suggested_weeks:Math.max(6,Math.ceil(counts[band]*.75))};
}
const naturalCodes={
 physical_product:['CQ02','CQ03','CQ01','DC01','DC02','DC05','DC08','DC11','CQ04','CQ05','CQ06','DC04','CQ09','CQ10','CQ11','CQ12','EX03','EX04','EX06'],
 travel:['CQ02','CQ01','CQ05','DC06','DC07','DC01','DC02','DC03','DC05','DC08','DC09','DC12','DC16','CQ06','CQ08','CQ09','CQ11','CQ12','EX01','EX02','EX03','EX05','EX06'],
 experience:['CQ02','CQ01','CQ05','DC06','DC07','DC01','DC08','DC16','CQ08','CQ11','CQ12','EX02','EX03','EX06'],
 project:['CQ02','DC02','DC03','DC05','DC06','DC07','DC09','DC10','DC11','DC12','DC13','DC14','DC15','DC17','DC18','CQ01','CQ04','CQ06','CQ08','CQ09','CQ11','CQ12','EX01','EX03','EX04','EX05','EX06'],
 other:['CQ02','DC06','DC01','DC08','DC11','CQ01','CQ08','CQ11','CQ12','EX06']
};
const goalTitle={
 CQ02:c=>`Defina exatamente ${c.natural_reference}`,CQ03:c=>`Descubra o que realmente importa em ${c.natural_reference}`,CQ01:c=>`Descubra o custo real ${c.natural_reference.replace(/^o /,'do ').replace(/^a /,'da ')}`,DC01:c=>`Compare opções reais para ${c.natural_reference}`,DC08:c=>`Crie critérios para escolher ${c.natural_reference}`,CQ04:()=>`Defina um limite antes de decidir`,CQ05:c=>`Encontre os custos escondidos ${c.natural_reference.replace(/^o /,'do ').replace(/^a /,'da ')}`,CQ06:c=>`Encontre um caminho melhor para ${c.natural_reference}`,DC04:()=>`Tente conseguir uma condição melhor`,CQ09:c=>`Simule a experiência antes de decidir sobre ${c.natural_reference}`,CQ10:()=>`Espere um pouco antes da decisão final`,CQ11:c=>`Tome a decisão final sobre ${c.natural_reference}`,CQ12:c=>`Prepare tudo para ${c.natural_reference}`,DC06:c=>`Transforme ${c.natural_reference} em um plano`,DC07:()=>`Reserve tempo real para avançar`,DC03:c=>`Converse com alguém que entende de ${c.normalized_goal}`,DC12:c=>c.goal_type==='travel'?`Aprenda frases úteis para a viagem`:`Aprenda uma habilidade útil para a jornada`,DC16:c=>c.goal_type==='travel'?`Resolva uma conversa real sobre a viagem`:`Dê um passo fora da zona de conforto`,CQ08:c=>`Mapeie o caminho até ${c.natural_reference}`,EX03:c=>c.goal_type==='travel'?`Entenda como turismo, câmbio e transporte se conectam`:`Entenda o sistema por trás ${c.natural_reference.replace(/^o /,'do ').replace(/^a /,'da ')}`,EX05:c=>c.goal_type==='travel'?`Monte um minirroteiro completo`:`Construa um miniprojeto ligado a ${c.normalized_goal}`,EX06:()=>`Transforme o que aprendeu em conselho útil`};
function phaseFor(code,index,total){if(['CQ02','CQ03','CQ01','DC01'].includes(code))return 1;if(['DC06','DC07','DC08','CQ04','CQ05','DC11'].includes(code))return 2;if(['DC03','DC04','DC12','DC13','DC14','DC15','DC16','DC17','CQ06','CQ08','CQ09'].includes(code))return 3;if(['CQ11','CQ12','EX05','EX06'].includes(code))return 4;return index<total*.25?1:index<total*.6?2:index<total*.85?3:4}
export function pedagogicalBand(age){return age<=12?'12':age<=15?'14':'17'}
function ageTitle(code,base,c,band){
  if(band==='14')return base;
  const younger={CQ02:`Deixe claro qual ${c.normalized_goal} você quer`,CQ03:`Descubra o que mais importa nessa escolha`,CQ01:`Some o preço e os custos extras`,DC01:`Compare duas opções de ${c.normalized_goal}`,DC08:`Escolha três critérios simples`,CQ04:`Combine um limite com seu responsável`,CQ05:`Procure os gastos que não aparecem de primeira`,CQ11:`Escolha e conte o motivo`,CQ12:`Prepare o que falta para dar o próximo passo`};
  const older={CQ02:`Defina requisitos, limites e prioridades para ${c.natural_reference}`,CQ03:`Priorize critérios e trade-offs da decisão`,CQ01:`Analise custo total e custo de oportunidade`,DC01:`Compare alternativas com critérios ponderados`,DC08:`Construa uma matriz de decisão`,CQ04:`Estabeleça um limite e justifique a escolha`,CQ05:`Investigue custos indiretos e riscos`,CQ11:`Defenda a decisão final com evidências`,CQ12:`Planeje a execução e antecipe riscos`};
  return(band==='12'?younger[code]:older[code])||(band==='12'?`Pratique esta habilidade: ${base.charAt(0).toLowerCase()+base.slice(1)}`:`Aprofunde a análise: ${base.charAt(0).toLowerCase()+base.slice(1)}`);
}
function adaptPedagogy({age,classification,archetype,baseSteps}){
  const band=pedagogicalBand(age),reference=classification.natural_reference,objective=archetype.pedagogical_objective||archetype.base_micro_lesson;
  const example12=classification.goal_type==='project'?`Para ${reference}, compare duas ideias simples de produto ou serviço. Anote para quem cada ideia ajuda, do que você precisa para testar e qual parece mais viável.`:`Para ${reference}, compare duas opções lado a lado. Anote o preço, o que vem junto e uma diferença importante. Depois diga: “eu escolheria esta porque...”.`;
  const example14=classification.goal_type==='project'?`Para ${reference}, monte uma tabela com três formas de testar a ideia. Compare público, custo, tempo e aprendizado esperado; escolha uma e justifique.`:`Para ${reference}, monte uma tabela com três alternativas. Compare custo total, benefícios e limitações; escolha uma e explique por que ela atende melhor ao objetivo.`;
  const example17=classification.goal_type==='project'?`Para ${reference}, compare três modelos ou canais de venda. Estime demanda, margem, custo inicial e risco; depois teste como a escolha muda em um cenário mais conservador.`:`Para ${reference}, compare compra nova, usada e adiamento. Calcule custo total, incluindo acessórios e serviços, avalie garantia e risco, e explique o custo de oportunidade da opção escolhida.`;
  if(band==='12')return{
    age_band:band,
    intro:`Você vai aprender fazendo uma parte concreta relacionada ${withPrep(reference,'a')}. O objetivo é entender uma escolha de cada vez, com um responsável por perto quando precisar.`,
    micro_lesson:`Em palavras simples: ${archetype.base_micro_lesson} Use uma informação real e confira se ela faz sentido antes de escolher.`,
    steps:[`Leia o desafio e conte ao seu responsável o que você entendeu.`,`Faça esta parte concreta: ${baseSteps[0]||objective}`,`Compare duas opções ou dois resultados.`,`Registre sua escolha e explique em uma frase o que aprendeu.`],
    technique:`Técnica Pare → Olhe → Escolha: pare antes de decidir, olhe duas opções reais e escolha usando um motivo claro. Peça ao responsável apenas para conferir se faltou algo importante.`,
    example:example12,
    autonomy:`Você faz a comparação e toma a primeira decisão; o responsável ajuda a conferir informações e segurança.`,
    parent_support:`O Parent pode ajudar a encontrar duas fontes, fazer perguntas curtas e revisar o resultado, sem escolher pelo jovem.`,
    reflection:`O que você descobriu fazendo? Qual detalhe ajudou mais na sua escolha?`,
    evidence:`Envie uma foto ou print do que comparou e escreva de 2 a 3 frases: o que fez, o que escolheu e por quê.`,
    checklist:['Mostre duas opções reais','Marque uma diferença importante','Explique sua escolha em 2 ou 3 frases'],
    evidence_types:['TEXT',...(archetype.allowed_evidence_types.includes('IMAGE')?['IMAGE']:[])]
  };
  if(band==='14')return{
    age_band:band,
    intro:`Esta missão transforma uma parte do objetivo em uma decisão prática ligada ${withPrep(reference,'a')}. Você conduz a atividade e justifica o caminho escolhido.`,
    micro_lesson:`${archetype.base_micro_lesson} Uma boa decisão compara alternativas pelos mesmos critérios e explica por que um deles pesa mais.`,
    steps:[`Defina o resultado que precisa alcançar nesta missão.`,...(baseSteps.slice(0,2)),`Compare pelo menos três alternativas usando os mesmos critérios.`,`Escolha uma alternativa e justifique com dados; peça ao Parent uma pergunta crítica antes de finalizar.`],
    technique:`Técnica Critérios → Comparação → Justificativa: escolha de três a cinco critérios, aplique-os a pelo menos três alternativas e explique qual critério determinou a decisão.`,
    example:example14,
    autonomy:`Você pesquisa, organiza a comparação e propõe a decisão. O Parent entra como revisor e faz uma pergunta antes do envio.`,
    parent_support:`O Parent revisa os critérios e questiona uma suposição, mas não executa a pesquisa nem escreve a justificativa.`,
    reflection:`Qual critério mais influenciou sua decisão? Que nova informação faria você escolher diferente?`,
    evidence:`Envie a comparação de pelo menos três alternativas, indique as fontes e escreva uma justificativa baseada nos critérios.`,
    checklist:['Compare pelo menos três alternativas','Use os mesmos critérios em todas','Registre fontes e justificativa'],
    evidence_types:['TEXT',...archetype.allowed_evidence_types.filter(x=>['IMAGE','LINK'].includes(x))]
  };
  return{
    age_band:band,
    intro:`Você vai investigar uma decisão importante com autonomia e produzir uma recomendação defensável sobre ${reference}, deixando explícitos limites, riscos e trade-offs.`,
    micro_lesson:`${archetype.base_micro_lesson} Decisões robustas distinguem fatos, suposições e preferências, consideram custo de oportunidade e registram incertezas.`,
    steps:[`Formule a pergunta de decisão e defina o que seria um bom resultado.`,`Pesquise de forma independente em pelo menos três fontes e registre data e contexto.`,...(baseSteps.slice(0,2)),`Atribua pesos aos critérios e analise benefícios, custos, riscos e custo de oportunidade.`,`Teste um cenário alternativo e defenda a decisão, incluindo o que poderia invalidá-la.`],
    technique:`Técnica Matriz ponderada + cenários: atribua pesos aos critérios, pontue alternativas com fontes verificáveis e teste como a decisão muda se custo, prazo ou prioridade variar.`,
    example:example17,
    autonomy:`Você define método, fontes e recomendação. O Parent valida limites familiares e questiona riscos, sem dirigir a análise.`,
    parent_support:`O Parent informa restrições reais da família e atua como contraponto na defesa final; pesquisa, análise e recomendação ficam com o jovem.`,
    reflection:`Qual trade-off você aceitou? Qual suposição é mais frágil e como a decisão mudaria em outro cenário?`,
    evidence:`Entregue uma análise com fontes, critérios e pesos, cenário alternativo, trade-offs, riscos e uma defesa final da decisão.`,
    checklist:['Cite pelo menos três fontes','Separe fatos de suposições','Mostre pesos, trade-offs e cenário alternativo','Defenda a recomendação e seus limites'],
    evidence_types:['TEXT',...archetype.allowed_evidence_types.filter(x=>['LINK','IMAGE','AUDIO'].includes(x))]
  };
}
export function buildJourney({classification,complexity,archetypes,parentGoals=[],interests=[],age=14}){
  const allowed=new Set(naturalCodes[classification.goal_type]||naturalCodes.other),desired=new Set(parentGoals.map(x=>skillMap[x]||x));const recent=new Set();
  const scored=archetypes.filter(a=>a.is_active&&allowed.has(a.code)&&age>=a.age_min&&age<=a.age_max).map(a=>{let score=5;const hits=(a.primary_skills||[]).filter(x=>desired.has(x)).length;score+=hits*5;score+=3;const interestHit=interests.some(i=>classification.normalized_goal.toLowerCase().includes(i.toLowerCase())||classification.goal_category.toLowerCase().includes(i.toLowerCase()));if(interestHit)score+=3;if(recent.has(a.code))score-=5;const namedSkills=a.primary_skills.slice(0,2).map(x=>skillLabel[x]||x).join(' e '),why=hits?`Esta missão aproxima o jovem ${withPrep(classification.natural_reference,'de')} enquanto desenvolve ${namedSkills}, competências escolhidas pela família.`:`Esta missão produz uma decisão ou resultado concreto necessário para avançar ${withPrep(classification.natural_reference,'em')}.`;return{a,score,why}}).sort((x,y)=>y.score-x.score);
  const targets={DEVELOPMENT_CONTEXTUALIZED:Math.round(complexity.count*.5),CONQUEST:Math.round(complexity.count*.35)};targets.EXPANSION=complexity.count-targets.DEVELOPMENT_CONTEXTUALIZED-targets.CONQUEST;
  const selected=[];for(const category of Object.keys(targets)){const pool=scored.filter(x=>x.a.category===category);for(const x of pool.slice(0,targets[category]))selected.push(x)}for(const x of scored)if(selected.length<complexity.count&&!selected.includes(x))selected.push(x);
  selected.sort((x,y)=>phaseFor(x.a.code,0,selected.length)-phaseFor(y.a.code,0,selected.length)||x.a.default_effort_weight-y.a.default_effort_weight);
  const total=selected.reduce((s,x)=>s+x.a.default_effort_weight,0);let allocated=0;
  return selected.map((x,i)=>{const last=i===selected.length-1;const progress=last?Number((100-allocated).toFixed(4)):Number((x.a.default_effort_weight/total*100).toFixed(4));allocated+=progress;const baseTitle=(goalTitle[x.a.code]||(()=>x.a.title_template))(classification),baseSteps=Array.isArray(x.a.base_steps)?x.a.base_steps:['Entenda o desafio.','Use dados reais.','Registre o resultado.'],pedagogy=adaptPedagogy({age,classification,archetype:x.a,baseSteps});return{archetype:x.a,title:ageTitle(x.a.code,baseTitle,classification,pedagogy.age_band),contextualized_intro:pedagogy.intro,contextualized_micro_lesson:pedagogy.micro_lesson,contextualized_steps:pedagogy.steps,contextualized_evidence_request:pedagogy.evidence,follow_up_question:pedagogy.reflection,why_this_mission:x.why,phase:phaseFor(x.a.code,i,selected.length),effort_weight:x.a.default_effort_weight,progress_percentage:progress,recommendation_score:x.score,pedagogical_age_band:pedagogy.age_band,technique_explanation:pedagogy.technique,contextualized_example:pedagogy.example,autonomy_guidance:pedagogy.autonomy,parent_support_guidance:pedagogy.parent_support,reflection_depth:pedagogy.reflection,evidence_checklist:pedagogy.checklist,evidence_types:pedagogy.evidence_types};});
}
