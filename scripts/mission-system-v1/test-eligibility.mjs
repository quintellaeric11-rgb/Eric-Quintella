import{MISSION_CONTRACTS as C}from'../../data/mission-system-v1/mission-contracts.mjs';import{fixture}from'../../data/mission-system-v1/fixtures.mjs';import{normalizeComposerContext}from'../../lib/mission-system-v1/normalize-context.mjs';import{evaluateEligibility}from'../../lib/mission-system-v1/eligibility.mjs';import{harness,assert}from'./test-helpers.mjs';const h=harness('eligibility');const e=(id,input)=>evaluateEligibility(C[id],normalizeComposerContext(input));
h.test('M10 bloqueia 12 anos',()=>assert.equal(e('M10',fixture({age:12,type:'PROJECT'})).hardFilter,'age'));
h.test('M06 aceita pré-requisito REAL',()=>assert.equal(e('M06',fixture({age:17,type:'PROJECT'})).status,'ELIGIBLE'));
h.test('M03 permanece DISCOVERY',()=>assert.equal(e('M03',fixture({age:14,type:'TRAVEL'})).role,'DISCOVERY'));
h.test('M07 não entra em produto simples',()=>assert.equal(e('M07',fixture({age:17,type:'PHYSICAL_PRODUCT'})).hardFilter,'goalType'));
h.test('M02 exige propriedade/item comprovado',()=>{const x=fixture({age:14,type:'PHYSICAL_PRODUCT'});delete x.runtimeState.values.item;assert.equal(e('M02',x).hardFilter,'prerequisites')});
h.test('M08 não admite crédito ou dívida',()=>{const x=fixture({age:14,type:'PHYSICAL_PRODUCT'});x.requestedActions=['CREDIT'];assert.equal(e('M08',x).hardFilter,'safety')});
h.test('catálogo obrigatório ausente bloqueia',()=>{const x=fixture({age:14,type:'PROJECT'});delete x.catalogAvailability.APPROVED_CONSTRAINTS;assert.equal(e('M18',x).hardFilter,'catalog')});h.finish();
