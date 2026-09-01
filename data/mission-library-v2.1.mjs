// Protótipo local e isolado. Não importar no Mission Engine atual.
import { missionLibraryV2 } from './mission-library-v2.mjs';

const rewriteIds = new Set([
  'L2-12-002','L2-12-003','L2-12-004','L2-12-007','L2-12-008','L2-12-009','L2-12-015','L2-12-018','L2-12-019',
  'L2-14-002','L2-14-004','L2-14-006','L2-14-007','L2-14-008','L2-14-010','L2-14-012','L2-14-013','L2-14-015','L2-14-017','L2-14-018','L2-14-019','L2-14-020',
  'L2-17-002','L2-17-003','L2-17-007','L2-17-009','L2-17-010','L2-17-012'
]);
const weakIds = new Set(['L2-12-011','L2-17-019']);

const rewriteGuidance = {
  'L2-12-002':'Ensina preço comparável antes da pesquisa e considera estado, frete e procura.',
  'L2-12-003':'Troca doméstica só entra com equivalência simples, direito de recusar e aprovação.',
  'L2-12-004':'Substitui “condição” por desconto, frete ou alternativa concreta em compra real.',
  'L2-12-007':'A comparação termina numa escolha ligada à conquista, não numa lista de preços.',
  'L2-12-008':'A conversa termina em uma ideia pequena testada pelo jovem.',
  'L2-12-009':'Ensina critérios com exemplo e desempate antes da decisão.',
  'L2-12-015':'O limite é contextual e o plano precisa virar uma escolha ou execução real.',
  'L2-12-018':'Reduz duração para três dias e liga a ação a uma habilidade necessária.',
  'L2-12-019':'Responsabilidade escolhida pelo jovem, curta, visível e nunca usada como punição.',
  'L2-14-002':'Explica oferta e custo com exemplo antes do teste e aceita sinal de interesse real.',
  'L2-14-004':'Começa com uma tentativa simples e ensina alternativa depois do resultado.',
  'L2-14-006':'A restrição passa a produzir algo útil para a conquista.',
  'L2-14-007':'Conversa mais curta seguida de microteste, não entrevista escolar.',
  'L2-14-008':'Usa somente gasto do próprio jovem ou dado autorizado e explica custo anual.',
  'L2-14-010':'Seleciona pessoas relevantes e transforma feedback em teste observável.',
  'L2-14-012':'Exige contexto seguro, opt-out e pedido concreto sem conteúdo íntimo.',
  'L2-14-013':'A explicação passa a ser sobre algo necessário à conquista e testada na prática.',
  'L2-14-015':'Vira plano de três dias com uma prioridade real, sem planner semanal.',
  'L2-14-017':'Define objeto, tarefa e usuário antes dos testes.',
  'L2-14-018':'Oferece método A/B concreto e medida simples.',
  'L2-14-019':'Responsabilidade curta e diretamente ligada à conquista.',
  'L2-14-020':'Liderança somente em projeto escolhido, com autoridade e duas entregas claras.',
  'L2-17-002':'Explica público e oferta mínima após uma primeira conversa real; prazo flexível.',
  'L2-17-003':'Ensina limite e alternativa usando uma negociação pequena antes do projeto.',
  'L2-17-007':'Divide custo de vida em descoberta guiada e explica renda líquida/imprevisto.',
  'L2-17-009':'Troca defesa corporativa por decisão real com comparação curta e destinatário legítimo.',
  'L2-17-010':'Ensina custo de oportunidade com um exemplo antes da escolha.',
  'L2-17-012':'Pitch só entra quando existe ideia real, pessoa relevante e pedido específico.',
  'L2-12-011':'Deixa de ser pesquisa genérica: uma conversa curta precisa mudar uma decisão real.',
  'L2-17-019':'Reduz de um mês para sete dias e usa orçamento próprio ou explicitamente autorizado.'
};

const teachBeforeCharge = {
  'L2-12-002':'Um preço comparável é de um objeto parecido em modelo, estado e itens incluídos.',
  'L2-12-003':'Uma troca justa é aquela que os dois entendem e podem recusar.',
  'L2-12-004':'Uma condição melhor pode ser desconto, frete menor ou uma opção mais barata.',
  'L2-12-009':'Critérios são as coisas que você usa para comparar, como preço, conforto e duração.',
  'L2-14-002':'Oferta é o que você entrega, para quem e por quanto. Custo é o que você gasta para fazer.',
  'L2-14-004':'Negociar é procurar um combinado que funcione para os dois, não pressionar alguém.',
  'L2-14-008':'Custo anual é o valor mensal multiplicado por 12.',
  'L2-14-010':'Feedback é uma reação; evidência é observar o que a pessoa realmente consegue fazer.',
  'L2-14-015':'Prioridade é o que precisa receber atenção primeiro porque muda mais o resultado.',
  'L2-14-018':'Medir é escolher um sinal simples, como tempo, erros ou resultado concluído.',
  'L2-17-002':'Público é o grupo que vive o problema. Oferta mínima é a menor solução que você consegue testar.',
  'L2-17-003':'Seu limite é o pior acordo que ainda vale aceitar. Alternativa é o que você fará se não houver acordo.',
  'L2-17-007':'Renda líquida é o dinheiro que realmente chega depois dos descontos. Imprevisto é um gasto que você não planejou.',
  'L2-17-009':'Restrição é um limite real, como dinheiro, prazo ou regra.',
  'L2-17-010':'Custo de oportunidade é o melhor benefício que você deixa para trás ao escolher outra opção.',
  'L2-17-012':'Um pedido claro diz exatamente o que você espera que a outra pessoa faça depois de ouvir.'
};

function revise(base) {
  const classification = weakIds.has(base.id) ? 'WEAK_REDESIGNED' : rewriteIds.has(base.id) ? 'REWRITTEN' : base.id === 'L2-17-015' ? 'RESTRICTED' : 'PRESERVED';
  const copy = structuredClone(base);
  copy.library_version = '2.1-local';
  copy.revision_status = classification;
  copy.v21_change = rewriteGuidance[base.id] || (classification === 'PRESERVED' ? 'Preservada após auditoria; poderá receber contextualização material pelo Composer.' : 'Disponível somente para metas explicitamente longas.');
  copy.generic_selection_allowed = classification === 'PRESERVED';
  copy.contextualization_required = ['REWRITTEN','WEAK_REDESIGNED'].includes(classification);
  copy.allowed_when = base.id === 'L2-17-015' ? ['EXPLICIT_LONG_TERM_GOAL'] : classification === 'PRESERVED' ? ['AGE_AND_CONTEXT_COMPATIBLE'] : ['MATERIAL_GOAL_CONTEXT_REQUIRED'];
  copy.energy = base.estimated_time >= 60 || base.repeatability === 'PERIODIC' ? 'HEAVY' : base.estimated_time <= 25 ? 'LIGHT' : 'MEDIUM';
  copy.pull_profile = weakIds.has(base.id) ? 'PUSH' : base.story_value === 'HIGH' ? 'PULL' : 'NEUTRAL';
  copy.narrative_relevance = 'DISCOVERY';
  copy.context_specificity = 'LOW';
  copy.dependency_on_others = ['HIGH','SUPERVISED'].includes(base.social_hook) ? 'MEDIUM' : 'LOW';
  copy.writing_load = base.proof_types.includes('TEXT') ? 'MEDIUM' : 'LOW';
  copy.time_span_days = base.repeatability === 'PERIODIC' ? 7 : 1;
  if (teachBeforeCharge[base.id]) copy.youth.example = `${teachBeforeCharge[base.id]} ${copy.youth.example}`;
  return copy;
}

const stageDefinitions = {
  PHYSICAL_PRODUCT: [
    ['UNDERSTAND','Descubra qual versão vale seu dinheiro','Compare três versões reais de {goal_object} e elimine uma que não serve para você.','DECISION_MAKING','LIGHT','CORE'],
    ['EXPERIMENT','Teste antes de escolher','Experimente ou assista a uma demonstração confiável de {goal_object} e registre uma diferença que mudou sua opinião.','CRITICAL_THINKING','MEDIUM','CORE'],
    ['CONTRIBUTE','Contribua com uma parte da conquista','Escolha uma forma segura de economizar ou gerar uma pequena parte do valor de {goal_object}.','FINANCIAL_LITERACY','HEAVY','BRIDGE'],
    ['DECIDE','Escolha com três critérios reais','Use preço, qualidade e um critério seu para escolher a melhor opção de {goal_object}.','DECISION_MAKING','LIGHT','CORE'],
    ['PREPARE','Mostre que você consegue cuidar da conquista','Assuma por três dias um cuidado parecido com o que {goal_object} vai exigir.','RESPONSIBILITY','MEDIUM','BRIDGE'],
    ['CONQUER','Monte a proposta final','Mostre a opção escolhida, quanto falta e o próximo passo real para conquistar {goal_object}.','COMMUNICATION','LIGHT','CORE']
  ],
  TRAVEL: [
    ['IMAGINE','Escolha um momento que faria a viagem valer','Encontre uma experiência em {goal_object} que você realmente gostaria de viver e explique por quê.','AUTONOMY','LIGHT','CORE'],
    ['UNDERSTAND','Descubra o custo de um dia real','Monte o custo de um dia de {goal_object} com comida, transporte e uma atividade.','FINANCIAL_LITERACY','MEDIUM','CORE'],
    ['PLAN','Monte uma rota que funcione','Escolha três pontos e monte uma ordem possível para viver esse dia em {goal_object}.','ORGANIZATION','MEDIUM','CORE'],
    ['CONTRIBUTE','Contribua para a viagem','Crie uma forma segura de economizar ou gerar uma pequena parte do orçamento de {goal_object}.','FINANCIAL_LITERACY','HEAVY','BRIDGE'],
    ['SOLVE','Resolva um imprevisto de viagem','Escolha um problema possível em {goal_object} e prepare um plano B simples.','CRITICAL_THINKING','LIGHT','BRIDGE'],
    ['PREPARE','Prepare uma parte da viagem de verdade','Organize um documento, item, frase útil ou responsabilidade necessária para {goal_object}.','RESPONSIBILITY','MEDIUM','CORE']
  ],
  SKILL: [
    ['EXPERIMENT','Experimente o resultado que você quer alcançar','Escolha uma música ou resultado de {goal_object} e tente reproduzir uma parte curta hoje.','AUTONOMY','LIGHT','CORE'],
    ['LEARN','Aprenda uma técnica que destrava o próximo passo','Descubra uma técnica pequena de {goal_object}, veja um exemplo e teste imediatamente.','CRITICAL_THINKING','MEDIUM','CORE'],
    ['PRACTICE','Faça três tentativas curtas','Pratique a mesma parte de {goal_object} três vezes e mude uma coisa por tentativa.','DISCIPLINE','MEDIUM','CORE'],
    ['APPLY','Use a habilidade em algo que você escolheu','Aplique o que aprendeu em uma música, vídeo ou criação ligada a {goal_object}.','AUTONOMY','MEDIUM','BRIDGE'],
    ['SHOW','Mostre seu antes e depois','Registre a primeira e a melhor tentativa de {goal_object} e conte o que mudou.','COMMUNICATION','LIGHT','CORE'],
    ['CONSISTENCY','Crie um jeito de continuar sem cobrança','Escolha três momentos curtos da próxima semana para continuar {goal_object}.','RESPONSIBILITY','LIGHT','BRIDGE']
  ],
  PROJECT: [
    ['PROBLEM','Escolha o resultado real do projeto','Defina para quem é {goal_object} e qual resultado essa pessoa deve perceber.','CRITICAL_THINKING','LIGHT','CORE'],
    ['IDEA','Crie a menor versão que já funciona','Faça uma primeira versão simples de {goal_object} que possa ser mostrada hoje.','ENTREPRENEURSHIP','MEDIUM','CORE'],
    ['TEST','Mostre para uma pessoa certa','Peça para alguém do público usar ou reagir à primeira versão de {goal_object}.','COMMUNICATION','MEDIUM','BRIDGE'],
    ['FEEDBACK','Mude uma coisa que realmente importa','Observe onde a pessoa travou ou se interessou e melhore uma parte de {goal_object}.','DECISION_MAKING','LIGHT','CORE'],
    ['IMPROVE','Entregue uma versão melhor','Finalize uma segunda versão de {goal_object} com a melhoria escolhida.','DISCIPLINE','HEAVY','CORE'],
    ['DELIVER','Coloque o projeto no mundo real','Entregue, apresente ou teste {goal_object} com alguém real e registre o resultado.','RESPONSIBILITY','MEDIUM','CORE']
  ],
  EXPERIENCE: [
    ['UNDERSTAND','Escolha o que você mais quer viver','Descubra qual parte de {goal_object} faria essa experiência valer de verdade para você.','AUTONOMY','LIGHT','CORE'],
    ['PLAN','Monte o plano essencial','Descubra data, acesso, transporte e custo principal de {goal_object}.','ORGANIZATION','MEDIUM','CORE'],
    ['CONTRIBUTE','Contribua com uma parte','Economize, gere ou assuma uma responsabilidade que ajude {goal_object} a acontecer.','RESPONSIBILITY','HEAVY','BRIDGE'],
    ['PREPARE','Treine uma habilidade útil para o evento','Faça algo ligado a {goal_object} que melhore sua preparação, comunicação ou segurança.','COMMUNICATION','MEDIUM','BRIDGE'],
    ['SOLVE','Crie um plano B','Escolha um problema possível em {goal_object} e prepare uma solução simples.','CRITICAL_THINKING','LIGHT','BRIDGE'],
    ['READY','Mostre que está tudo pronto','Reúna decisão, custo, responsabilidade e próximo passo de {goal_object} em uma proposta curta.','COMMUNICATION','LIGHT','CORE']
  ],
  CAREER: [
    ['EXPLORE','Descubra uma opção que combina com você','Escolha uma área ligada a {goal_object} e encontre uma tarefa real que ela exige.','AUTONOMY','LIGHT','CORE'],
    ['CONVERSE','Converse com alguém que conhece esse caminho','Faça três perguntas curtas para alguém que estudou ou trabalha perto de {goal_object}.','COMMUNICATION','MEDIUM','BRIDGE'],
    ['EXPERIMENT','Teste uma parte do caminho','Faça uma tarefa pequena parecida com algo exigido por {goal_object}.','CRITICAL_THINKING','MEDIUM','CORE'],
    ['COMPARE','Compare duas opções pelo que muda sua vida','Compare rotina, custo, entrada e oportunidade de duas opções de {goal_object}.','DECISION_MAKING','MEDIUM','CORE'],
    ['DECIDE','Elimine uma opção com um motivo real','Use o que testou para manter ou eliminar uma opção de {goal_object}.','DECISION_MAKING','LIGHT','CORE'],
    ['PREPARE','Crie a primeira prova do seu caminho','Produza uma pequena prova de habilidade ou próximo passo para {goal_object}.','AUTONOMY','HEAVY','BRIDGE']
  ],
  FINANCIAL_GOAL: [
    ['RESOURCE','Descubra o que você já pode oferecer','Liste três habilidades, objetos ou ajudas que poderiam aproximar você de {goal_object}.','AUTONOMY','LIGHT','BRIDGE'],
    ['PROBLEM','Encontre um problema pequeno que vale resolver','Converse com duas pessoas e escolha um problema pelo qual alguém aceitaria ajuda.','ENTREPRENEURSHIP','MEDIUM','BRIDGE'],
    ['OFFER','Crie uma oferta que cabe em um dia','Defina o que fará, para quem, em quanto tempo e por qual valor para avançar em {goal_object}.','ENTREPRENEURSHIP','MEDIUM','CORE'],
    ['TEST','Tente conseguir o primeiro sim','Mostre sua oferta para pessoas conhecidas por um canal aprovado e registre respostas reais.','COMMUNICATION','HEAVY','CORE'],
    ['IMPROVE','Melhore usando o que aconteceu','Mude preço, explicação ou entrega com base nas respostas da tentativa.','DECISION_MAKING','LIGHT','BRIDGE'],
    ['EARN','Entregue e registre o primeiro resultado','Faça a entrega combinada e registre receita, custo e quanto isso aproximou você de {goal_object}.','FINANCIAL_LITERACY','MEDIUM','CORE']
  ]
};

const mechanicByStage = {UNDERSTAND:'INVESTIGATE_COMPARE',EXPERIMENT:'EXPERIMENT_PRACTICE',CONTRIBUTE:'EARN_SELL',DECIDE:'DECIDE',PREPARE:'PLAN_ORGANIZE',CONQUER:'CONNECT_COMMUNICATE',IMAGINE:'CREATE_BUILD',PLAN:'PLAN_ORGANIZE',SOLVE:'SOLVE_IMPROVE',LEARN:'TEACH_DEMONSTRATE',PRACTICE:'EXPERIMENT_PRACTICE',APPLY:'CREATE_BUILD',SHOW:'TEACH_DEMONSTRATE',CONSISTENCY:'PLAN_ORGANIZE',PROBLEM:'INVESTIGATE_COMPARE',IDEA:'CREATE_BUILD',TEST:'CONNECT_COMMUNICATE',FEEDBACK:'DECIDE',IMPROVE:'SOLVE_IMPROVE',DELIVER:'TAKE_RESPONSIBILITY',READY:'CONNECT_COMMUNICATE',EXPLORE:'INVESTIGATE_COMPARE',CONVERSE:'CONNECT_COMMUNICATE',COMPARE:'INVESTIGATE_COMPARE',RESOURCE:'INVESTIGATE_COMPARE',OFFER:'EARN_SELL',EARN:'EARN_SELL'};

const newExperiences = Object.entries(stageDefinitions).flatMap(([goalType, stages]) => stages.map(([stage,title,challenge,competency,energy,relevance], index) => ({
  id:`L21-${goalType}-${String(index + 1).padStart(2,'0')}`,
  library_version:'2.1-local',
  revision_status:'NEW',
  mechanic:mechanicByStage[stage] || 'DECIDE',
  experience_pattern:`${goalType.toLowerCase()}_${stage.toLowerCase()}`,
  competencies:[competency],
  age_min:11,
  age_max:18,
  difficulty:energy === 'HEAVY' ? 'HIGH' : energy === 'LIGHT' ? 'LOW' : 'MEDIUM',
  estimated_time:energy === 'HEAVY' ? 60 : energy === 'LIGHT' ? 15 : 35,
  real_world_level:'REAL',
  autonomy_level:'AGE_ADAPTED',
  money_hook:['CONTRIBUTE','EARN','OFFER'].includes(stage) ? 'HIGH' : 'NONE',
  social_hook:['CONVERSE','TEST','DELIVER','CONQUER','READY'].includes(stage) ? 'HIGH' : 'MEDIUM',
  creativity_hook:['IDEA','APPLY','IMAGINE'].includes(stage) ? 'HIGH' : 'MEDIUM',
  story_value:['CONTRIBUTE','EARN','DELIVER','SHOW','CONQUER'].includes(stage) ? 'HIGH' : 'MEDIUM',
  goal_relevance:relevance,
  narrative_relevance:relevance,
  compatible_interests:['ANY'],
  compatible_goal_types:[goalType],
  proof_types:['IMAGE','TEXT'],
  proof_requirements:'Será materializada pelo Composer com uma prova específica da conquista.',
  safety_level:'AGE_ADAPTED',
  parent_involvement:'AGE_ADAPTED',
  repeatability:'GOAL_CONTEXT',
  novelty_group:`${goalType}_${stage}`,
  outcome_type:`${goalType}_${stage}`,
  cognitive_load:energy,
  energy,
  pull_profile:relevance === 'CORE' ? 'PULL' : 'NEUTRAL',
  context_specificity:'HIGH',
  dependency_on_others:['CONVERSE','TEST','DELIVER'].includes(stage) ? 'MEDIUM' : 'LOW',
  writing_load:'LOW',
  time_span_days:energy === 'HEAVY' ? 3 : 1,
  stage,
  youth:{title,challenge,why:'O resultado desta missão será usado na próxima etapa da sua conquista.',steps:['Comece pela ação indicada.','Registre o que aconteceu.','Use o resultado na próxima decisão.'],example:'O exemplo será adaptado à conquista e à idade.',tip:'Faça a menor versão que já produza um resultado real.',proof:'Mostre o resultado concreto e conte o que ele mudou.'}
})));

export const missionLibraryV21 = [...missionLibraryV2.map(revise), ...newExperiences];
export const libraryV21Changes = {
  preserved: missionLibraryV21.filter(x=>x.revision_status === 'PRESERVED').map(x=>x.id),
  rewritten: missionLibraryV21.filter(x=>x.revision_status === 'REWRITTEN').map(x=>x.id),
  redesigned: missionLibraryV21.filter(x=>x.revision_status === 'WEAK_REDESIGNED').map(x=>x.id),
  restricted: missionLibraryV21.filter(x=>x.revision_status === 'RESTRICTED').map(x=>x.id),
  added: missionLibraryV21.filter(x=>x.revision_status === 'NEW').map(x=>x.id)
};

export function libraryV21Stats(){
  return {count:missionLibraryV21.length,base:60,new:newExperiences.length,...Object.fromEntries(Object.entries(libraryV21Changes).map(([k,v])=>[k,v.length]))};
}
