# Canonical Content Runtime — auditoria

## Cadeia de proveniência

`KONKI_MISSION_BIBLE_V1.md` → `extract-canonical-content.mjs` → `canonical-content.generated.mjs` → `validate-canonical-content.mjs` → `mission-materializer.mjs` → `MaterializedMission`.

O extrator exige exatamente M01–M44 e a heading `EXPERIÊNCIA DO JOVEM`. Ele preserva o Markdown integral de cada seção, registra linhas de origem, versão, SHA-256 do documento e SHA-256 do bloco da missão. Não resume, reescreve ou cria blocos.

## Resultado de paridade

- Conteúdos localizados: 44/44
- Conteúdos carregados: 44/44
- `PASS`: 44
- `MANUAL_REVIEW_REQUIRED`: 0
- `FAIL`: 0
- Hashes: 44/44
- Completion rules correspondentes: 44/44
- Slots correspondentes aos contratos: 44/44
- Snapshots: 44/44

## Estrutura runtime

Cada missão contém título, sections ordenadas, Markdown canônico, proof instructions, metadata de progressive disclosure, slots aprovados, forbidden slots, completion rule, age variants e proveniência. Slots resolvidos são entregues separadamente em `slotValues`; como a Bible não possui marcadores explícitos de interpolação, nenhum valor é inserido dentro da copy canônica.

## Variantes etárias

A Bible possui somente três variantes explícitas, todas na M01: 12, 14 e 17 anos. As outras 43 missões usam conteúdo comum canônico. Para M01, uma idade elegível sem variante literal retorna `CANONICAL_VARIANT_NOT_AVAILABLE`; não existe fallback criativo.

## Progressive disclosure

Sections possuem `displayOrder`, `defaultCollapsed`, `screenGroup`, `estimatedReadingLoad` e `mustReadBeforeAction`. Essa metadata não altera a copy e não integra UI.

## Materializer

Status: completo para o runtime isolado. Valida missionId, schema, source hash, slots, sources, valores gerados, catálogos, idade, contexto, completionRuleId e proveniência. Produz payload UI-agnostic com sections controladas.

`CANONICAL_CONTENT_NOT_LOADED`: 0 missões.

## Anti-drift e adversarial

Falham alterações de palavra, seção, ordem, proof, safety, completion rule, slot, fonte factual, catálogo, provenance, versão ou hash. O manifesto e snapshots impedem mudança com a mesma content version.

## Limitações conscientes

- Catálogos continuam `MINIMUM_VIABLE_CONTENT`.
- As 26 regras de revisão manual permanecem mapeadas por estágio.
- O conteúdo não foi integrado à UI ou ao produto.
- A extração depende da estrutura explícita de headings; qualquer quebra dessa estrutura falha, sem heurística silenciosa.

## Status

Os critérios técnicos da Fase 1D passaram. Recomendação limitada a:

`MISSION_COMPOSER_TECH_STATUS = READY_FOR_INTEGRATION_REVIEW`

Isso não autoriza nem realiza integração, commit, push ou deploy.
