// Composer experimental local. Não conectado ao Mission Engine atual.
import { missionLibraryV21 } from '../data/mission-library-v2.1.mjs';

const arcs = {
  PHYSICAL_PRODUCT:['UNDERSTAND','EXPERIMENT','CONTRIBUTE','DECIDE','PREPARE','CONQUER'],
  TRAVEL:['IMAGINE','UNDERSTAND','PLAN','CONTRIBUTE','SOLVE','PREPARE'],
  SKILL:['EXPERIMENT','LEARN','PRACTICE','APPLY','SHOW','CONSISTENCY'],
  PROJECT:['PROBLEM','IDEA','TEST','FEEDBACK','IMPROVE','DELIVER'],
  EXPERIENCE:['UNDERSTAND','PLAN','CONTRIBUTE','PREPARE','SOLVE','READY'],
  CAREER:['EXPLORE','CONVERSE','EXPERIMENT','COMPARE','DECIDE','PREPARE'],
  FINANCIAL_GOAL:['RESOURCE','PROBLEM','OFFER','TEST','IMPROVE','EARN']
};

const profiles = {
  '12-casaco':{object:'seu casaco',thesis:'descobrir qual casaco realmente serve, contribuir com uma parte, mostrar cuidado e fazer uma escolha segura com sua família',interestUse:'use cor, estilo e uma referência visual que você realmente usaria'},
  '12-ps5':{object:'seu PS5',thesis:'entender qual versão vale a pena, contribuir com uma parte, provar responsabilidade e montar uma proposta realista',interestUse:'compare um jogo ou recurso que muda de verdade a versão escolhida'},
  '12-italia':{object:'sua viagem para a Itália',thesis:'escolher o que quer viver, entender um dia real, ajudar a preparar e resolver um imprevisto simples',interestUse:'inclua uma comida italiana que você gostaria de provar'},
  '12-show':{object:'seu show',thesis:'escolher o que quer viver, ajudar no plano, mostrar responsabilidade e chegar preparado',interestUse:'use uma música ou artista que você realmente acompanha'},
  '12-projeto':{object:'seu projeto de desenho',thesis:'escolher para quem vai criar, fazer uma primeira versão, receber uma reação e entregar algo melhor',interestUse:'escolha um formato visual que você teria vontade de mostrar'},
  '14-tenis':{object:'seu tênis',thesis:'comparar opções reais, testar o que importa, contribuir com o valor e decidir sem cair apenas na aparência',interestUse:'compare uso no esporte e estilo fora dele'},
  '14-celular':{object:'seu celular',thesis:'descobrir qual aparelho atende seu uso real, testar diferenças, contribuir e provar cuidado antes da compra',interestUse:'use câmera, edição de vídeo ou outro recurso que você realmente usaria'},
  '14-viagem':{object:'sua viagem com amigos',thesis:'transformar a ideia em um plano possível, contribuir, combinar responsabilidades e resolver riscos reais',interestUse:'inclua uma experiência musical ou lugar que o grupo realmente escolheria'},
  '14-negocio':{object:'seu primeiro negócio',thesis:'encontrar um problema pequeno, criar uma oferta simples, testar com pessoas reais, melhorar e fazer a primeira entrega',interestUse:'use comida ou arte como matéria-prima somente se isso combinar com o problema escolhido'},
  '14-guitarra':{object:'sua guitarra',thesis:'descobrir o som e o instrumento que combinam com você, praticar algo real, mostrar evolução e criar consistência',interestUse:'escolha uma música que você realmente teria vontade de tocar ou gravar'},
  '17-faculdade':{object:'sua escolha de faculdade',thesis:'explorar áreas, conversar com alguém, experimentar uma tarefa real, comparar opções e dar o próximo passo',interestUse:'teste uma tarefa ligada a tecnologia ou ciência, não apenas leia sobre o curso'},
  '17-italia':{object:'sua viagem sozinho para a Itália',thesis:'transformar vontade em orçamento, rota, autonomia e preparação para lidar com problemas reais',interestUse:'inclua uma experiência de comida e deslocamento que você realmente faria sozinho'},
  '17-renda':{object:'seu primeiro dinheiro',thesis:'identificar algo que consegue oferecer, testar uma oferta, conseguir uma resposta real, melhorar e fazer a primeira entrega',interestUse:'use tecnologia ou vídeo apenas se isso virar uma entrega útil para alguém'},
  '17-show':{object:'seu pequeno show',thesis:'definir público e experiência, testar interesse, organizar responsabilidades, melhorar o plano e realizar uma entrega real',interestUse:'use o tipo de música e identidade visual que o público escolhido reconheceria'},
  '17-portfolio':{object:'seu primeiro trabalho',thesis:'descobrir uma direção, conversar com alguém, provar habilidade, comparar oportunidades e criar um próximo passo real',interestUse:'produza uma prova de arte ou tecnologia que uma pessoa da área consiga avaliar'}
};

const discoveryByGoal = {
  CAREER:{title:'Descubra um caminho que você não conhecia',challenge:'Converse por dez minutos com alguém sobre uma rota menos óbvia até {object}.',competency:'COMMUNICATION',proof:'Envie três descobertas e diga se alguma mudou seu próximo passo.'},
  TRAVEL:{title:'Viva um pedaço do destino antes de viajar',challenge:'Prepare, visite ou experimente algo cultural ligado a {object}.',competency:'AUTONOMY',proof:'Envie uma foto ou áudio e conte o que ficou mais real para você.'},
  FINANCIAL_GOAL:{title:'Descubra como alguém conseguiu o primeiro sim',challenge:'Pergunte a alguém conhecido como conseguiu o primeiro cliente, trabalho ou pagamento.',competency:'COMMUNICATION',proof:'Envie a ideia mais útil e como você poderia testá-la.'},
  PROJECT:{title:'Encontre uma referência fora da sua bolha',challenge:'Veja um projeto real parecido com {object} e escolha uma decisão que vale testar.',competency:'CRITICAL_THINKING',proof:'Envie a referência e a decisão que você vai experimentar.'}
};

const stageReasons = {
  UNDERSTAND:'Antes de escolher, você precisa saber qual opção realmente serve para o que quer.',EXPERIMENT:'Testar uma parte agora evita gastar esforço ou dinheiro na opção errada.',CONTRIBUTE:'Contribuir com uma parte transforma vontade em avanço real.',DECIDE:'Uma escolha clara impede que a conquista vire apenas impulso.',PREPARE:'Preparar uma responsabilidade mostra que você consegue cuidar do que quer.',CONQUER:'Juntar decisão, valor e próximo passo deixa a conquista pronta para um combinado real.',IMAGINE:'Escolher o que mais quer viver dá direção ao restante da viagem.',PLAN:'Um plano possível transforma uma ideia em algo que pode acontecer.',SOLVE:'Resolver um risco antes evita que um imprevisto derrube o plano.',LEARN:'Uma técnica pequena destrava a próxima tentativa.',PRACTICE:'Repetir com uma mudança por vez faz a evolução aparecer.',APPLY:'Usar a habilidade em algo escolhido por você torna o treino útil.',SHOW:'O antes e depois prova uma evolução que você consegue ver.',CONSISTENCY:'Um plano curto ajuda a continuar sem depender de cobrança.',PROBLEM:'Um projeto só vale a pena quando existe alguém e um resultado claros.',IDEA:'Uma versão pequena coloca a ideia no mundo sem enrolação.',TEST:'Uma reação real vale mais do que imaginar se a ideia funciona.',FEEDBACK:'Mudar uma coisa importante faz o projeto avançar sem recomeçar.',IMPROVE:'A segunda versão mostra que você usou o que descobriu.',DELIVER:'Entregar para alguém transforma projeto em resultado real.',READY:'Reunir o essencial mostra que a experiência pode acontecer com responsabilidade.',EXPLORE:'Experimentar uma área é mais útil do que decidir só pelo nome.',CONVERSE:'Uma conversa real revela coisas que a descrição de um curso ou vaga não mostra.',COMPARE:'Comparar rotina, entrada e oportunidade deixa a escolha mais honesta.',RESOURCE:'Começar pelo que você já sabe fazer reduz a distância até o primeiro resultado.',OFFER:'Uma oferta clara permite que alguém responda sim ou não de verdade.',EARN:'Registrar receita e custo mostra o que você realmente conquistou.'
};

const naturalCompetencies = {
  PHYSICAL_PRODUCT:{CONTRIBUTE:['FINANCIAL_LITERACY','ENTREPRENEURSHIP'],DECIDE:['DECISION_MAKING','CRITICAL_THINKING'],PREPARE:['RESPONSIBILITY','DISCIPLINE']},
  TRAVEL:{PLAN:['ORGANIZATION','COMMUNICATION'],CONTRIBUTE:['FINANCIAL_LITERACY','AUTONOMY'],PREPARE:['RESPONSIBILITY','AUTONOMY']},
  SKILL:{PRACTICE:['DISCIPLINE'],APPLY:['AUTONOMY'],SHOW:['COMMUNICATION'],CONSISTENCY:['RESPONSIBILITY','DISCIPLINE']},
  PROJECT:{IDEA:['ENTREPRENEURSHIP','AUTONOMY'],TEST:['COMMUNICATION'],IMPROVE:['ORGANIZATION','DISCIPLINE'],DELIVER:['RESPONSIBILITY']},
  EXPERIENCE:{PLAN:['ORGANIZATION'],CONTRIBUTE:['RESPONSIBILITY','DISCIPLINE'],PREPARE:['COMMUNICATION'],READY:['COMMUNICATION','RESPONSIBILITY']},
  CAREER:{EXPERIMENT:['CRITICAL_THINKING','AUTONOMY'],COMPARE:['DECISION_MAKING','CRITICAL_THINKING'],CONVERSE:['COMMUNICATION'],PREPARE:['AUTONOMY']},
  FINANCIAL_GOAL:{PROBLEM:['ENTREPRENEURSHIP','CRITICAL_THINKING'],OFFER:['ENTREPRENEURSHIP'],TEST:['COMMUNICATION'],EARN:['FINANCIAL_LITERACY','RESPONSIBILITY']}
};

function fill(text,object){return text.replaceAll('{goal_object}',object).replaceAll('{object}',object)}
function ageCopy(age, mission, profile){
  const younger=age<=12,older=age>=16;
  const steps=younger
    ? ['Escolha uma opção com seu responsável por perto.', 'Faça a menor tentativa possível.', 'Registre o resultado com foto ou áudio.', 'Conte o que isso muda na sua conquista.']
    : older
      ? ['Defina o resultado observável antes de começar.', 'Faça uma tentativa no mundo real.', 'Registre custo, reação ou resultado sem esconder o que falhou.', 'Use o que aconteceu para tomar a próxima decisão.']
      : ['Escolha uma situação real e aprovada.', 'Faça uma primeira tentativa curta.', 'Registre o que aconteceu.', 'Mude uma coisa usando o resultado.'];
  const concept = mission.stage === 'OFFER' ? 'Oferta é o que você entrega, para quem e por qual valor.' : mission.stage === 'COMPARE' ? 'Comparar não é listar tudo: é olhar as diferenças que mudam sua decisão.' : mission.stage === 'CONTRIBUTE' ? 'Contribuir pode ser economizar, gerar uma pequena parte ou assumir um custo aprovado.' : null;
  return {
    title:fill(mission.youth.title,profile.object),
    challenge:fill(mission.youth.challenge,profile.object),
    why:stageReasons[mission.stage] || 'O resultado desta missão será usado na próxima etapa.',
    steps:concept ? [concept,...steps].slice(0,5) : steps,
    example:`${profile.interestUse}.`,
    tip:younger?'Peça ajuda apenas na parte que envolve dinheiro, contato ou segurança.':older?'Prefira um resultado pequeno e real a um plano grande que nunca sai do papel.':'Comece pequeno e use uma resposta real para decidir o próximo passo.',
    proof:proofFor(mission.stage,profile.object)
  };
}

function proofFor(stage,object){
  const map={UNDERSTAND:`Envie as opções de ${object} e diga qual eliminou e por quê.`,EXPERIMENT:`Envie foto, áudio ou link da tentativa e uma diferença que mudou sua opinião.`,CONTRIBUTE:`Mostre quanto economizou ou gerou, como fez e quanto isso aproxima você de ${object}.`,DECIDE:`Envie os critérios, a opção escolhida e o principal motivo.`,PREPARE:`Envie o combinado, o resultado e uma foto ou registro permitido.`,CONQUER:`Envie a proposta final com opção, valor, quanto falta e próximo passo.`,IMAGINE:`Envie a experiência escolhida e uma imagem, áudio ou link que mostre por que ela importa.`,PLAN:`Envie o plano em ordem, os custos principais e uma decisão tomada.`,SOLVE:`Envie o problema escolhido e seu plano B em três passos.`,LEARN:`Envie a técnica, a primeira tentativa e o que conseguiu fazer depois.`,PRACTICE:`Envie a primeira e a terceira tentativa e conte qual mudança ajudou.`,APPLY:`Envie a criação final e mostre onde usou a habilidade.`,SHOW:`Envie o antes, o depois e uma frase sobre a maior evolução.`,CONSISTENCY:`Envie os três momentos escolhidos e por que cabem na sua semana.`,PROBLEM:`Envie para quem é o projeto, o problema e o resultado esperado.`,IDEA:`Envie foto, vídeo ou link da primeira versão funcionando.`,TEST:`Envie o que a pessoa tentou fazer e o que aconteceu.`,FEEDBACK:`Envie o ponto observado e a mudança escolhida.`,IMPROVE:`Envie as duas versões lado a lado e destaque a melhoria.`,DELIVER:`Envie o resultado entregue e a reação ou avaliação recebida.`,READY:`Envie o plano final e o próximo passo confirmado.`,EXPLORE:`Envie a área, a tarefa real encontrada e sua reação.`,CONVERSE:`Envie as três respostas e uma coisa que você não sabia.`,COMPARE:`Envie a comparação e a diferença que mais pesa na sua escolha.`,RESOURCE:`Envie três recursos que você já tem e qual vai testar primeiro.`,OFFER:`Envie o texto da oferta com entrega, público, prazo e valor.`,EARN:`Envie o combinado, a entrega, receita, custo e resultado final.`};
  return map[stage] || `Envie o resultado concreto e conte o que ele mudou em ${object}.`;
}

function discovery(input,profile,order){
  const d=discoveryByGoal[input.goalType] || discoveryByGoal.PROJECT;
  return {id:`L21-DISCOVERY-${input.id}`,library_version:'2.1-local',order,stage:'DISCOVERY',mechanic:'CONNECT_COMMUNICATE',competencies:[d.competency],energy:'LIGHT',cognitive_load:'LIGHT',narrative_relevance:'DISCOVERY',goal_relevance:'DISCOVERY',pull_profile:'NEUTRAL',story_value:'MEDIUM',proof_types:['AUDIO','TEXT'],safety_level:input.age<16?'GUARDED':'LOW',selection_reason_youth:'Esta missão abre uma possibilidade nova sem tirar sua conquista do centro.',youth:{title:d.title,challenge:fill(d.challenge,profile.object),why:'Uma descoberta fora do caminho óbvio pode melhorar sua próxima decisão.',steps:['Escolha uma pessoa, lugar ou referência acessível.','Faça uma experiência curta de até 20 minutos.','Guarde apenas a descoberta que muda alguma coisa.'],example:`${profile.interestUse}.`,tip:'Se não mudar nada, não force uma conclusão.',proof:fill(d.proof,profile.object)}};
}

export function buildJourneyV21(input){
  const profile=profiles[input.id] || {object:input.goal.toLowerCase(),thesis:`entender, agir e provar avanços reais até ${input.goal.toLowerCase()}`,interestUse:'use um interesse somente se ele mudar a forma de executar'};
  const stages=arcs[input.goalType];
  if(!stages)throw new Error(`goal_type_not_supported:${input.goalType}`);
  const templates=missionLibraryV21.filter(x=>x.library_version==='2.1-local'&&x.revision_status==='NEW'&&x.compatible_goal_types?.includes(input.goalType));
  const journey=stages.map((stage,index)=>{
    const template=templates.find(x=>x.stage===stage);
    if(!template)throw new Error(`missing_stage:${input.goalType}:${stage}`);
    const youth=ageCopy(input.age,template,profile);
    const competencies=[...new Set([...(naturalCompetencies[input.goalType]?.[stage]||template.competencies)])];
    return {...structuredClone(template),competencies,order:index+1,youth,selection_reason_youth:stageReasons[stage],safety_level:input.age<=12&&['CONTRIBUTE','TEST','DELIVER'].includes(stage)?'SUPERVISED':template.safety_level,parent_involvement:input.age<=12?'GUIDED':input.age<=15?'AWARE':'ON_REQUEST'};
  });
  if(input.age>=16)journey.splice(Math.max(2,journey.length-1),0,discovery(input,profile,0));
  journey.forEach((x,i)=>x.order=i+1);
  return {journey_thesis:`Para ${input.goal.toLowerCase()}, esta jornada vai ajudar você a ${profile.thesis}.`,arc:stages,missions:journey};
}

export function auditJourneyV21(result,input){
  const m=result.missions,pct=n=>Number((n/Math.max(1,m.length)*100).toFixed(1));
  const relevance=Object.fromEntries(['CORE','BRIDGE','DISCOVERY'].map(k=>[k,m.filter(x=>x.narrative_relevance===k).length]));
  const motivation=Object.fromEntries(['PULL','NEUTRAL','PUSH'].map(k=>[k,m.filter(x=>x.pull_profile===k).length]));
  return {count:m.length,relevance,relevance_pct:Object.fromEntries(Object.entries(relevance).map(([k,v])=>[k,pct(v)])),motivation,motivation_pct:Object.fromEntries(Object.entries(motivation).map(([k,v])=>[k,pct(v)])),heavy:m.filter(x=>x.energy==='HEAVY').length,consecutive_heavy:m.some((x,i)=>i&&x.energy==='HEAVY'&&m[i-1].energy==='HEAVY'),direct_or_bridge_pct:pct(m.filter(x=>['CORE','BRIDGE'].includes(x.narrative_relevance)).length),random_missions:m.filter(x=>!x.selection_reason_youth||x.selection_reason_youth.length>180).map(x=>x.id),competencies:[...new Set(m.flatMap(x=>x.competencies))],requested_covered:input.competencies.filter(c=>m.some(x=>x.competencies.includes(c))),writing_heavy_pct:pct(m.filter(x=>x.writing_load==='HIGH').length),adult_dependency_pct:pct(m.filter(x=>x.dependency_on_others==='HIGH').length)};
}

export { arcs, profiles };
