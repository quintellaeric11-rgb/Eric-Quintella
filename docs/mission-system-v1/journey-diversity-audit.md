# Auditoria de diversidade da jornada V1

Data: 31 de agosto de 2026  
Status de entrada: `MISSION_COMPOSER_TECH_STATUS = SHADOW_REVIEW_READY`  
Natureza: diagnóstico local, sem alteração de Composer, contratos, conteúdo, fixtures ou produto

## Resumo executivo

O V1 ainda não demonstra que consegue construir jornadas completas e equilibradas. Nos quatro casos, a trajetória verificável chegou a apenas 1 ou 2 missões antes de encontrar uma dependência humana, ficar sem rota elegível ou violar o próprio limite de sobreposição semântica quando o Composer foi executado novamente.

O problema não é apenas “pesquisa demais”. Há três problemas mais fundamentais:

1. **A recomposição incremental perde memória de composição.** `missionHistory` impede repetir o mesmo `missionId`, mas `semantic overlap`, novelty e sequence recebem apenas as missões selecionadas na chamada atual. Como cada nova chamada pede uma missão, o caso PS5 propõe M12 depois de M38, embora as duas pertençam ao grupo semântico `GOAL_DECISION`.
2. **Os outputs produzidos raramente determinam a próxima escolha.** Na maioria das transições observadas, o que libera o catálogo seguinte é a mudança de `INITIAL` para `ACTIVE`, não um output pedagógico específico da missão anterior.
3. **Competências e interesses têm influência desigual.** As competências Parent alteraram materialmente apenas o caso guitarra. Os interesses declarados não entram no score: o campo chamado `declaredInterest` concede pontos por compatibilidade de `goalType`, não por correspondência com `youth.interests`.

Não houve evidência suficiente para chamar o conjunto de “pesquisador ambulante” em todos os casos, pois três trajetórias pararam cedo. No caso PS5, porém, a primeira sequência proposta já formaria um loop de pesquisar/comparar/decidir sobre o mesmo objeto e foi barrada nesta auditoria por sobreposição semântica.

## Metodologia e limites

- Foram usados exatamente os quatro contextos solicitados.
- O Composer real foi chamado com `targetMissionCount = 1` após cada conclusão simulada.
- A conclusão só foi considerada quando o completion contract permitia produzir seus outputs sem presumir uma resposta humana.
- O estado inicial continha apenas os fatos canônicos derivados de uma conquista nova: `goal_defined`, `decision_open` e, no caso PROJECT, `project_goal_exists`.
- Após uma conclusão válida, foram aplicados somente os itens de `producedState` declarados pelo contrato.
- Não foram inventados aprovação Parent, permissões, pessoas, preços prévios, respostas, acordos, feedbacks ou valores de runtime.
- Uma missão que pede pesquisa ou criação feita pelo próprio jovem pode ser concluída no ramo hipotético de sucesso. Uma missão que depende da ação ou resposta de outra pessoa marca uma bifurcação e encerra a progressão determinística.
- Para respeitar os requisitos da auditoria, cada nova proposta foi confrontada também com todas as missões anteriores. Quando o Composer propôs uma missão semanticamente conflitante, a auditoria parou em vez de escolher manualmente uma alternativa.

## Visão geral

| Caso | Missões na trajetória | CORE | BRIDGE | DISCOVERY | Competências Parent cobertas | Red flags | Veredito |
|---|---:|---:|---:|---:|---|---|---|
| A. PS5 | 1 válida; 1 proposta rejeitada | 1 (100%) | 0 | 0 | Financeira 1/1; Responsabilidade 0/1 | `RESEARCH_LOOP`, `GOAL_OBSESSION`, `COMPETENCY_NEGLECT`, `LOW_VARIETY`, `MISSION_REPETITION`, `HOMEWORK_FEEL`, `PARENT_VALUE_GAP` | `SEQUENCE_FAILURE` |
| B. Itália | 2 | 2 (100%) | 0 | 0 | Autonomia 1/2; Organização 1/2 | `GOAL_OBSESSION`, `LOW_VARIETY`; rota termina em `NEEDS_PARENT_APPROVAL` | `NEEDS_TUNING` |
| C. Guitarra | 2, sendo a 2ª dependente de resposta | 1 (50%) | 1 (50%) | 0 | Disciplina 1/2; Comunicação 1/2 | `LOW_VARIETY`; bifurcação humana na posição 2 | `NEEDS_TUNING` |
| D. Primeiro negócio | 1, dependente de pessoa/teste | 1 (100%) | 0 | 0 | Empreendedorismo 0/1; Iniciativa 0/1 | `COMPETENCY_NEGLECT`, `LOW_VARIETY`, `PARENT_VALUE_GAP` | `COMPETENCY_FAILURE` |

Os percentuais são sobre as missões efetivamente selecionadas até a interrupção. Não devem ser comparados como se fossem jornadas completas de 10 missões.

---

## Caso A — Quero comprar um PS5

Idade 14; interesses Games e Vídeos; competências Parent Educação financeira e Responsabilidade.

### Posição 1 — M38

- **Título:** Descubra qual versão realmente vale a pena para você
- **Papel:** CORE
- **Competência principal:** Tomada de decisão
- **Secundárias:** Educação financeira e pesquisa
- **Conexão:** DIRETA
- **Por que foi escolhida:** é o bootstrap autorizado para `PHYSICAL_PRODUCT`, tem coerência CORE, produz estado útil, é compatível com o tipo da conquista e recebe 7,5 pontos por Educação financeira. Score: 92,5.
- **Em linguagem simples:** definir para que usará o PS5, escolher critérios, pesquisar pelo menos três opções/versões, eliminar uma e justificar a escolha atual.
- **Resultado concreto:** uma comparação de versões com uso, critérios, opção eliminada, escolha e preço.
- **Novos outputs:** `goal_options_compared = true`; `preferred_option_exists = true`.
- **Influência na próxima missão:** nenhum desses outputs é requisito da proposta seguinte. A passagem geral de `INITIAL` para `ACTIVE` é que amplia as opções do Composer.

### Proposta para a posição 2 — M12, rejeitada pela auditoria

- **Título:** Escolha usando o que realmente importa
- **Papel:** CORE
- **Competência principal:** Tomada de decisão
- **Secundária:** Pensamento crítico
- **Conexão:** DIRETA
- **Por que o Composer propôs:** score CORE alto e nenhum match adicional de competência necessário. Score: 80.
- **Em linguagem simples:** escolher três critérios, comparar 2 ou 3 opções reais e justificar a escolha.
- **Resultado concreto previsto:** outra matriz de comparação e decisão.
- **Outputs previstos:** `criteria_defined`, `options_compared`, `preferred_option_exists`.
- **Por que não entrou na jornada:** M38 e M12 compartilham `GOAL_DECISION`. A checagem acumulada retornou `OVERLAP_GOAL_DECISION`. O Composer não percebeu o conflito porque `overlapConflicts` recebeu apenas o array `selected` vazio da nova chamada.

### Diversidade observada

| Dimensão | Contagem |
|---|---:|
| Pesquisar | 1 |
| Comparar | 1 |
| Conversar | 0 |
| Criar | 0 |
| Executar | 0 |
| Organizar | 0 |
| Decidir | 1 |
| Assumir responsabilidade | 0 |
| Resolver problema | 0 |
| Ensinar/demonstrar | 0 |
| Lidar com dinheiro | 1 |
| Experimentar/testar | 0 |

Há 3 competências trabalhadas. Educação financeira aparece de forma prática na posição 1. Responsabilidade não aparece.

### Contrafactual Parent

Sem as competências Parent, M38 continua na posição 1 e M12 continua sendo a proposta inválida para a posição 2. A única mudança é o score de M38, de 92,5 para 85. **A jornada não muda.**

### Respostas de produto

1. **Desenvolvimento ou pesquisa?** A primeira missão desenvolve decisão financeira, mas a continuação proposta repete comparação do PS5. O início tende a pesquisa monotemática.
2. **Competências Parent alteraram a jornada?** Não.
3. **Sem competências Parent mudaria?** Não; só muda a pontuação.
4. **Interesses personalizam?** Não há evidência. Games e Vídeos não entram no score nem mudam o conteúdo canônico.
5. **Alternância de ações?** Não. Há apenas pesquisar, comparar e decidir.
6. **Sensação de progresso?** Moderada: o jovem escolhe melhor a versão, mas ainda não produz valor, contribuição ou avanço financeiro.
7. **Valor percebido pelo Parent?** Parcial. Educação financeira aparece; Responsabilidade é negligenciada.

---

## Caso B — Quero fazer uma viagem para a Itália

Idade 14; interesses Viagens e Culinária; competências Parent Autonomia e Organização.

### Posição 1 — M43

- **Título:** Prepare uma parte real da sua conquista
- **Papel:** CORE
- **Competência principal:** Organização
- **Secundárias:** Autonomia, execução e responsabilidade
- **Conexão:** DIRETA
- **Por que foi escolhida:** é o bootstrap seguro de `TRAVEL`, cobre as duas competências Parent e alcança score 100.
- **Em linguagem simples:** escolher uma parte pequena e terminável da viagem, descobrir só o necessário e produzir algo utilizável, como trecho do roteiro, checklist ou plano de deslocamento.
- **Resultado concreto:** uma parte real da preparação da viagem pronta.
- **Novo output:** `goal_component_ready = true`.
- **Influência na próxima missão:** o output não é requisito de M12. Novamente, a transição para `ACTIVE` tem mais efeito que o fato produzido.

### Posição 2 — M12

- **Título:** Escolha usando o que realmente importa
- **Papel:** CORE
- **Competência principal:** Tomada de decisão
- **Secundária:** Pensamento crítico
- **Conexão:** DIRETA
- **Por que foi escolhida:** entre as opções restantes elegíveis, mantém coerência CORE e produz três outputs. Não cobre competências Parent. Score: 85.
- **Em linguagem simples:** escolher opções reais relacionadas à viagem, definir três critérios e justificar uma decisão.
- **Resultado concreto:** comparação e escolha documentadas.
- **Novos outputs:** `criteria_defined = true`; `options_compared = true`; `preferred_option_exists = true`.
- **Influência na próxima missão:** não houve próxima missão. A chamada seguinte retornou `NEEDS_PARENT_APPROVAL`.

### Ponto de interrupção

Depois de M12, nenhuma missão pronta passou pelos hard filters. O result code foi `NEEDS_PARENT_APPROVAL`. Não foi presumida aprovação para continuar.

### Diversidade observada

| Dimensão | Contagem |
|---|---:|
| Pesquisar | 2 |
| Comparar | 1 |
| Conversar | 0 |
| Criar | 1 |
| Executar | 1 |
| Organizar | 1 |
| Decidir | 1 |
| Assumir responsabilidade | 1 |
| Resolver problema | 0 |
| Ensinar/demonstrar | 0 |
| Lidar com dinheiro | 0, salvo se a parte escolhida for orçamento |
| Experimentar/testar | 0 |

Há 6 competências diferentes. Autonomia e Organização aparecem juntas e de forma prática na posição 1, mas não voltam a aparecer.

### Contrafactual Parent

Sem as competências Parent, a ordem continua M43 → M12 e a jornada para no mesmo ponto. M43 cai de score 100 para 85; M12 permanece 85. **As preferências Parent não mudam a seleção.**

### Respostas de produto

1. **Desenvolvimento ou pesquisa?** M43 é ação concreta e reduz o risco de “pesquisador”. M12 volta à comparação. O conjunto é curto demais para demonstrar desenvolvimento amplo.
2. **Competências Parent alteraram a jornada?** Não, embora aumentem muito o score de M43.
3. **Sem competências Parent mudaria?** Não.
4. **Interesses personalizam?** Viagens coincide com o goal type; Culinária não produz personalização observável.
5. **Alternância de ações?** Há fazer/organizar e depois pensar/decidir, mas nenhuma conversa, teste ou responsabilidade sustentada.
6. **Sensação de progresso?** Sim na posição 1; uma parte da viagem fica pronta.
7. **Valor percebido pelo Parent?** Sim, mas concentrado em uma única missão.

---

## Caso C — Quero aprender a tocar guitarra

Idade 14; interesses Música e Vídeos; competências Parent Disciplina e Comunicação.

### Posição 1 — M29

- **Título:** Mostre seu antes e depois
- **Papel:** CORE
- **Competência principal:** Prática
- **Secundárias:** Autopercepção e disciplina
- **Conexão:** DIRETA
- **Por que foi escolhida:** é o bootstrap de `SKILL`, cobre Disciplina e produz baseline. Score: 92,5.
- **Em linguagem simples:** tocar um trecho antes, escolher uma coisa para melhorar, praticar e repetir o mesmo teste.
- **Resultado concreto:** registro comparável de antes/depois na guitarra.
- **Novo output:** `baseline_exists = true`.
- **Influência na próxima missão:** M09 não exige baseline. A escolha seguinte vem do score de Comunicação, não do output produzido.

### Posição 2 — M09, bifurcação humana

- **Título:** Faça uma troca boa para os dois
- **Papel:** BRIDGE
- **Competência principal:** Comunicação
- **Secundárias:** Negociação e empatia
- **Conexão:** NATURAL, porém não específica à guitarra
- **Por que foi escolhida:** é BRIDGE e recebe 7,5 pontos por Comunicação, superando as alternativas sem match Parent. Score: 85,5.
- **Em linguagem simples:** escolher uma situação pequena, entender o que cada lado quer, fazer duas propostas e conversar sobre um combinado.
- **Resultado concreto possível:** uma proposta real e a resposta/acordo registrado.
- **Output somente após conclusão real:** `response_received = true`.
- **O que interrompe a simulação:** o completion contract exige `person` e `third_party_response`. Não é legítimo presumir pessoa, resposta ou acordo. A jornada bifurca aqui.

### Diversidade observada

| Dimensão | Contagem |
|---|---:|
| Pesquisar | 0 |
| Comparar | 1 (antes/depois) |
| Conversar | 1 |
| Criar | 0 |
| Executar | 1 |
| Organizar | 0 |
| Decidir | 1 |
| Assumir responsabilidade | 0 |
| Resolver problema | 0 |
| Ensinar/demonstrar | 1 |
| Lidar com dinheiro | 0 |
| Experimentar/testar | 1 |

Há 6 competências diferentes nas duas missões. Disciplina aparece de forma prática na posição 1. Comunicação aparece de forma prática na posição 2, condicionada à interação real.

### Contrafactual Parent

Sem competências Parent:

- posição 1: M29 permanece;
- posição 2: M09 é substituída por M12;
- posição 3: M38;
- posição 4: M43;
- posição 5: M09 e então a mesma bifurcação humana.

Esse contrafactual também revela outro defeito: M38, na posição 3, conflita semanticamente com M12 (`GOAL_DECISION`) e deveria interromper essa rota antes. **Este é o único caso em que as competências Parent mudam materialmente a seleção, trazendo Comunicação para a posição 2 e evitando temporariamente uma cadeia CORE ligada à conquista.**

### Respostas de produto

1. **Desenvolvimento ou pesquisa?** Aqui há prática observável e conversa real. É a trajetória mais equilibrada da amostra.
2. **Competências Parent alteraram a jornada?** Sim, materialmente na posição 2.
3. **Sem competências Parent mudaria?** Sim; M09 cai para a posição 5 e a rota tenta três CORE seguidas.
4. **Interesses personalizam?** O conteúdo de M29 cita violão como exemplo canônico, mas isso não decorre do interesse Música/Vídeos. Vídeos não afeta a seleção nem a materialização.
5. **Alternância de ações?** Sim, de praticar/demonstrar para conversar/negociar, embora a amostra pare cedo.
6. **Sensação de progresso?** Forte na primeira missão; a segunda desenvolve Comunicação, mas não avança diretamente a guitarra.
7. **Valor percebido pelo Parent?** Sim: as duas competências escolhidas aparecem em experiências práticas.

---

## Caso D — Quero criar meu primeiro negócio

Idade 15; interesses Culinária e Vídeos; competências Parent Empreendedorismo e Iniciativa.

### Posição 1 — M22, bifurcação humana

- **Título:** Construa uma versão pequena e coloque no mundo
- **Papel:** CORE
- **Competência principal:** Execução
- **Secundárias:** Planejamento e criatividade
- **Conexão:** DIRETA
- **Por que foi escolhida:** é o bootstrap de `PROJECT`, constrói uma versão mínima e tem score 85. Nenhuma das competências Parent coincide com o contrato.
- **Em linguagem simples:** definir o resultado, cortar a ideia até uma versão pequena, construir, colocar diante de alguém, observar e escolher uma melhoria.
- **Resultado concreto possível:** versão 1, teste real, versão 2 e decisão de continuar, mudar ou parar.
- **Outputs somente após conclusão real:** `version_1_exists = true`; `test_possible = true`.
- **O que interrompe a simulação:** o completion contract exige `person` e `result`. O teste com uma pessoa e seu resultado não podem ser presumidos.

### Diversidade observada

| Dimensão | Contagem |
|---|---:|
| Pesquisar | 0 |
| Comparar | 1 (versão 1 × versão 2) |
| Conversar | 0, embora haja contato/teste com pessoa |
| Criar | 1 |
| Executar | 1 |
| Organizar | 1 |
| Decidir | 1 |
| Assumir responsabilidade | 0 explícita |
| Resolver problema | 1 |
| Ensinar/demonstrar | 1 |
| Lidar com dinheiro | 0 |
| Experimentar/testar | 1 |

Há 3 competências contratuais. Empreendedorismo e Iniciativa não aparecem nominalmente nem recebem match de score. A missão é empreendedora em sentido amplo, mas o sistema não registra cobertura dessas competências.

### Contrafactual Parent

Sem competências Parent, M22 continua na posição 1 com o mesmo score 85 e a simulação para no mesmo requisito humano. **Não há qualquer mudança.**

### Respostas de produto

1. **Desenvolvimento ou pesquisa?** É ação real, não pesquisa. A experiência é forte, porém grande e já exige teste externo na primeira missão.
2. **Competências Parent alteraram a jornada?** Não.
3. **Sem competências Parent mudaria?** Não.
4. **Interesses personalizam?** Culinária e Vídeos não mudam a missão. O conteúdo oferece exemplos genéricos, inclusive canal/vídeo, mas não materializa o negócio no interesse declarado.
5. **Alternância de ações?** A própria missão contém criar, executar, testar, observar e decidir, mas não há sequência para avaliar alternância entre missões.
6. **Sensação de progresso?** Potencialmente forte se a missão for concluída; uma versão real nasce.
7. **Valor percebido pelo Parent?** Conceitualmente pode existir, mas o Composer não demonstra cobertura das competências escolhidas.

---

## Diagnóstico transversal

### A. O Composer equilibra conquista × desenvolvimento?

**Ainda não demonstrado.** Dos 6 slots aceitos/atribuídos nos quatro casos, 5 são CORE e 1 é BRIDGE; não há DISCOVERY. A referência 25–35% CORE, 50–60% BRIDGE e 10–15% DISCOVERY não aparece nem como tendência. A amostra é truncada, mas o próprio truncamento também é um problema de composição: faltam rotas seguras e encadeadas para sustentar jornadas completas.

### B. Competências Parent têm peso suficiente?

**Na pontuação, às vezes; na ordem final, quase nunca.** Apenas Guitarra mudou de missão na posição 2. Em PS5, Itália e Primeiro negócio, remover as competências não alterou nenhuma seleção. No caso D, as competências solicitadas nem constam do contrato escolhido.

### C. Existe evidência de “pesquisador ambulante”?

**Evidência localizada, não universal.** PS5 tenta encadear duas comparações semanticamente equivalentes. Itália mistura uma ação concreta com uma comparação. Guitarra e Projeto começam com prática/criação real. Portanto, a biblioteca contém experiências reais, mas a recomposição pode cair em loop de decisão/pesquisa quando o histórico semântico não é considerado.

### D. Existe diversidade real de mecânicas?

**Dentro das missões, sim; como jornada, ainda insuficiente.** M22 e M43 são ricas em ação. M29 e M09 criam uma boa alternância. Porém nenhuma trajetória verificável chega a três missões válidas, e o Composer incremental não aplica novelty/overlap ao histórico acumulado.

### E. Onde estão os problemas?

- **Composição:** memória de overlap, novelty, energia e sequência não atravessa chamadas incrementais.
- **Scoring:** competências valem no máximo 15 pontos e só alteraram uma rota; `declaredInterest` não usa interesses declarados.
- **Estado:** outputs da missão anterior pouco influenciam a próxima seleção; a fase `ACTIVE` funciona como abertura genérica do catálogo.
- **Contratos:** alguns bootstrap já exigem interação humana extensa na própria primeira missão, o que reduz a capacidade de simulação e pode aumentar abandono real.
- **Biblioteca/conteúdo:** há experiências concretas fortes, mas a cobertura formal de Empreendedorismo/Iniciativa no projeto inicial é fraca e não há sinal de DISCOVERY nas rotas observadas.
- **Personalização/materialização:** interesses não foram observados na seleção ou no texto materializado.

### F. Menor conjunto de mudanças recomendado, sem implementação nesta etapa

1. Passar o histórico acumulado de contratos/fingerprints/novelty/energia para as validações de overlap e sequence em cada recomposição.
2. Fazer o score consultar `journey.roleCounts`, cobertura acumulada de competências e históricos de novelty/pattern, reduzindo CORE quando já domina e priorizando BRIDGE/DISCOVERY elegíveis.
3. Separar o atual `declaredInterest` em compatibilidade de goal type e match real de interesse; só o segundo deve medir personalização.
4. Tornar outputs pedagógicos relevantes para eligibility/score das próximas missões, em vez de usar `ACTIVE` como principal abertura.
5. Auditar a cobertura formal de Empreendedorismo/Iniciativa nos contratos PROJECT já existentes antes de criar conteúdo novo.

Essas são recomendações diagnósticas. Nenhuma foi aplicada.

## Anexo técnico

### Resultados de interrupção

- Caso A: M38 concluível; M12 proposta em seguida, mas conflito acumulado `OVERLAP_GOAL_DECISION`. Trajetória interrompida como `SEQUENCE_FAILURE`.
- Caso B: M43 e M12 concluíveis no ramo de sucesso; terceira chamada `NEEDS_PARENT_APPROVAL`.
- Caso C: M29 concluível; M09 requer `person` e `third_party_response`. Bifurcação humana.
- Caso D: M22 requer `person` e `result`. Bifurcação humana na primeira missão.

### Falha de memória incremental reproduzida

`composeJourney` cria `selected = []` a cada chamada. `overlapConflicts(contract, selected)`, `validateSequence([...selected, contract])` e `scoreMission(contract, context, selected)` não incorporam `missionHistory`, `journey.actionFingerprints`, `journey.noveltyGroupHistory`, `journey.energyHistory` ou os contratos já concluídos. `missionHistory` é usado apenas para `maxPerJourney` do mesmo missionId.

Consequências observadas:

- uma missão diferente, mas semanticamente equivalente, pode ser proposta na chamada seguinte;
- o bônus de novelty volta a 10 em toda recomposição de uma missão;
- `sequenceFit` não vê a energia da missão anterior;
- regras como conversas consecutivas e clusters só funcionam dentro de uma única chamada que seleciona várias missões de uma vez, não no fluxo incremental auditado.

### Limite da leitura de interesses

Em `scoreMission`, `declaredInterest` recebe 15 pontos quando `contract.naturalGoalTypes` contém `context.goal.primaryGoalType`. Nenhuma comparação é feita com `context.youth.interests`. Assim, os interesses Games, Vídeos, Viagens, Culinária e Música não foram capazes de alterar o score nesta auditoria.

### Confirmações de integridade do diagnóstico

- Nenhuma resposta humana foi inventada.
- Nenhuma aprovação, permissão, pessoa ou regra financeira foi criada.
- Nenhum output fora de `producedState` foi aplicado.
- Nenhuma alternativa foi escolhida manualmente para “completar” 10 missões.
- Nenhum arquivo de código, contrato, catálogo, fixture ou produto foi alterado.
