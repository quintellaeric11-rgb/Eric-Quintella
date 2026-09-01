# Diagnóstico dos gaps de contexto — Shadow Review

## Resumo executivo

O V1 escolheu zero missões por dois problemas diferentes:

1. **Seis casos nem chegam à elegibilidade.** Guitarra, juntar dinheiro e carreira possuem informação suficiente no título, mas o adapter depende exclusivamente do classificador Legacy. Esse classificador retorna `other` para esses domínios, embora o classificador determinístico V1 já reconheça `SKILL`, `FINANCIAL_GOAL` e `CAREER_EDUCATION`.
2. **Nos outros 18 casos, nenhuma missão segura sobrevive ao estado inicial vazio.** As missões que exigem responsável viram `ELIGIBLE_IF` cedo; as missões LOW/GUARDED falham em pré-requisitos de runtime. Como existe pelo menos uma missão condicionada à aprovação e nenhuma selecionável, o Composer retorna `NEEDS_PARENT_APPROVAL`.

Portanto, `NEEDS_PARENT_APPROVAL` descreve a alternativa que ficou mais próxima de passar, mas não explica sozinho o zero de 24. O problema estrutural é a ausência de um caminho bootstrap seguro para uma jornada nova.

## O que o produto já sabe

- Título e motivo da conquista.
- Idade pela data de nascimento.
- Interesses do jovem.
- Competências desejadas pelo responsável.
- `parent_profiles.autonomy_level`, já preenchido no onboarding como `GUIDED`, `BALANCED` ou `INDEPENDENT` e já carregado pela API.
- Relações dos membros da família em `family_members.relationship`.
- Histórico Legacy em journeys, journey missions, assignments e evidence.

O adapter usa apenas parte desses dados. Ao mesmo tempo, algumas informações realmente não existem: autorização para venda/tentativa externa, pessoas externas aprovadas e regras familiares específicas de dinheiro.

## Campo a campo

### `goal.primaryGoalType`

O tipo é globalmente necessário porque define quais contratos podem concorrer. Nos seis casos fracos, não falta informação do usuário; falta integração entre classificadores. O título já permite uma decisão determinística controlada:

- aprender/tocar/guitarra → `SKILL`;
- juntar/economizar/renda → `FINANCIAL_GOAL`;
- carreira/profissão/engenharia/curso → `CAREER_EDUCATION`.

Isso é um gap de adapter/classification boundary. A UI atualmente grava `conquest_category='OTHER'`, portanto a coluna category não resolve o problema.

### `family.parentApprovalAvailable`

Somente M01, M02, M08, M15, M36, M40, M41 e M42 dependem de aprovação ou supervisão. Aprovação não deveria ser global.

O adapter envia `false`, corretamente evitando assumir que presença do responsável significa aprovação. Porém, safety é avaliado antes dos demais pré-requisitos. Assim, uma missão pode virar `ELIGIBLE_IF` mesmo que também não tenha permissão, orçamento ou estado necessário. Depois, o agregador escolhe `NEEDS_PARENT_APPROVAL` porque todas as alternativas seguras já falharam.

Para uma família nova, missões como definir o objetivo, comparar alternativas ou investigar com segurança deveriam continuar concorrendo sem aprovação prévia, desde que seus próprios pré-requisitos de bootstrap sejam satisfeitos.

### `family.approvedPeopleRelations`

O campo aparece ausente nos 24 casos, mas não causou diretamente nenhum dos resultados. Hoje os contratos usam valores de runtime como `approved_person`, `recipient`, `tester` e `learner`; M01 exige uma relação aprovada na materialização.

O produto conhece membros e relações familiares, mas não possui um registro de pessoas externas aprovadas. Isso não deve entrar obrigatoriamente no onboarding. A confirmação deve ser solicitada apenas quando uma missão envolver conversa, oferta, teste, ajuda ou ensino com outra pessoa.

### `family.moneyRules`

Também aparece ausente em 24/24, mas não bloqueou diretamente a composição atual. O produto possui valores da conquista e o responsável define valor/prazo mais tarde, porém não existe um objeto de política financeira familiar.

Regras de orçamento, contribuição ou negociação devem ser solicitadas quando M01, M02, M05, M08, M13, M36 ou M40 realmente estiverem em consideração. Missões sem dinheiro real não devem ser eliminadas.

O diagnóstico encontrou ainda uma inconsistência técnica futura: o normalizer transforma crédito/dívida/empréstimo em `false`, em vez de preservar um estado explicitamente desconhecido. Isso não causou o zero atual, mas precisa ser resolvido antes de o campo influenciar comportamento real.

### `family.permissions`

Somente M01 verifica diretamente `EXTERNAL_VALUE_ATTEMPT`. O campo não é causa global e atualmente fica escondido atrás do gate de aprovação ou do gap de variante M01.

Não existe equivalente seguro no produto. A permissão deve ser just in time. Enquanto estiver ausente, M01 sai da disputa e o Composer procura uma missão segura; não se deve bloquear toda a jornada nem interpretar membership Parent como autorização.

### `youth.autonomyLevel`

O produto já possui o equivalente provável em `parent_profiles.autonomy_level`, e a API já carrega esse registro. O adapter não o mapeia.

Mesmo assim, nenhum contrato, hard filter ou score V1 usa autonomia hoje. Logo, ele não precisa existir para a primeira missão e não deve ser gate global. O normalizer aplica silenciosamente `MEDIUM`, mas esse valor não afetou os 24 resultados. Antes de uso real, a equivalência `GUIDED → GUIDED`, `BALANCED → MEDIUM`, `INDEPENDENT → HIGH` precisa de confirmação semântica.

### `runtimeState`

Este é o principal bloqueio estrutural dos 18 casos classificados.

O adapter cria um objeto vazio e simultaneamente o marca como ausente. Para uma primeira jornada, vazio é correto para histórico e outputs: nenhuma oferta foi aceita, ninguém respondeu, nenhuma entrega ocorreu e nenhuma missão V1 foi completada. Esses fatos nunca podem ser inventados.

Mas existem dois tipos diferentes de estado:

- **fatos iniciais derivados da conquista**, como existir um objetivo não vazio;
- **outputs de ações anteriores**, como `accepted_offer`, `response_received` ou `real_user_exists`.

Hoje eles chegam juntos no mesmo registry e nenhum contrato possui um caminho inicial garantido sem pré-requisitos. O correto é definir editorialmente um estado `INITIAL`: histórico vazio e todos os outputs de missão ausentes, acrescido apenas de fatos que podem ser derivados com segurança do registro da conquista.

Ausência de histórico significa “nenhuma missão V1 executada”, não “todas as informações do mundo são desconhecidas”. Já ausência de aceite ou resposta continua significando que a missão dependente não pode ser liberada.

## A, B, C, D, E e F

### A — O produto deveria coletar

- Permissão para tentativa externa somente quando uma missão como M01 for candidata.
- Pessoa aprovada somente quando houver interação real.
- Limite, orçamento ou combinado financeiro somente para missão que movimenta dinheiro.

Esses dados não precisam inflar o onboarding inicial.

### B — Já existe, mas não está mapeado

- `parent_profiles.autonomy_level`.
- Título suficiente para classificação determinística dos seis casos fracos.
- Relações familiares conhecidas, parcialmente úteis para missões com pessoas.
- Histórico de journeys/assignments, útil depois que existir tradução para state V1.

### C — Exigido cedo demais ou reportado como global

- Aprovação Parent é avaliada antes de outros pré-requisitos e domina o result code.
- Autonomia é reportada ausente mesmo sem ser consumida.
- Pessoas e money rules são reportadas como gaps globais apesar de serem específicas.

### D — Deve ser específico da missão

- Aprovação Parent.
- Pessoas aprovadas.
- Permissões externas.
- Valores, orçamento, contribuição e negociação.

### E — Naturalmente inexistente na primeira missão

- Histórico V1.
- Outputs produzidos por missões.
- Aceite de oferta, respostas de terceiros, entrega, tester, evidências e resultados reais.

### F — Limitações do harness

- Os 24 casos representam uma jornada nova, sem histórico V1.
- Não simulam perguntas contextuais futuras nem permissões específicas.
- Os arquétipos Legacy vêm da migration local, sem Supabase.
- Todos passam pelo adapter sparse usado hoje no entry point.
- A UI grava `category=OTHER`, então o harness não pode usar a categoria para corrigir os seis casos.

## Recomendação mínima, sem implementação

1. Corrigir apenas a fronteira determinística de classificação dos seis casos.
2. Definir e aprovar o contrato canônico de `INITIAL runtime state`.
3. Identificar quais missões são bootstrap seguras para cada goal type. Hoje os contratos não garantem nenhuma.
4. Fazer aprovação, pessoas, dinheiro e permissões eliminarem somente as missões dependentes.
5. Mapear autonomia existente somente após confirmar equivalência, sem transformá-la em gate.
6. Reexecutar os mesmos 24 casos sem alterar fixtures e só então iniciar verdicts humanos.

## Em linguagem simples

**Por que o sistema novo escolheu zero missões?**

Em seis casos, ele não recebeu o tipo da conquista embora o título já fosse suficiente. Nos outros 18, ele começou com um estado corretamente vazio, mas a biblioteca atual não oferece um primeiro passo seguro que funcione nesse estado. As missões com responsável ficaram “quase elegíveis”, e por isso apareceu `NEEDS_PARENT_APPROVAL`, enquanto as missões seguras ficaram bloqueadas esperando fatos que normalmente só surgiriam depois.

**O que precisamos mudar para comparar Antigo × Novo de verdade?**

Primeiro, conectar a classificação determinística que já existe. Depois, definir o que uma jornada nova sabe no momento zero e garantir um conjunto de missões iniciais seguras. Aprovação, pessoas e dinheiro devem ser pedidos somente quando a missão escolhida realmente precisar deles. Só então o V1 produzirá missões reais comparáveis sem inventar dados nem enfraquecer safety.
