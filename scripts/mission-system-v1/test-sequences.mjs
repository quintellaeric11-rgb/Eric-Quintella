import{MISSION_CONTRACTS as C}from'../../data/mission-system-v1/mission-contracts.mjs';import{validateSequence}from'../../lib/mission-system-v1/sequence-validator.mjs';import{sameOperationalAction}from'../../lib/mission-system-v1/semantic-overlap.mjs';import{harness,assert}from'./test-helpers.mjs';const h=harness('sequences');
h.test('bloqueia duas HEAVY seguidas',()=>assert.ok(validateSequence([C.M06,C.M20]).errors.includes('CONSECUTIVE_HEAVY')));
h.test('bloqueia cluster responsabilidade',()=>assert.ok(validateSequence([C.M32,C.M33,C.M41]).errors.includes('RESPONSIBILITY_CLUSTER_OVERLOAD')));
h.test('bloqueia cadeia só planejamento',()=>assert.ok(validateSequence([C.M34,C.M37,C.M43,C.M44]).errors.includes('PLANNING_CHAIN_OVERLOAD')));
h.test('M40 e M43 detectam mesma ação operacional',()=>assert.equal(sameOperationalAction(C.M40,{operationalTarget:'organizar transporte'},C.M43,{approvedAction:'Organizar transporte'}),true));
h.test('M21 M29 M30 não viram cluster',()=>assert.ok(validateSequence([C.M21,C.M29,C.M30]).errors.includes('SKILL_PROOF_OVERLOAD')));
h.test('M23 M24 M25 M26 não viram sequência',()=>assert.ok(validateSequence([C.M23,C.M24,C.M25,C.M26]).errors.includes('THREE_CONVERSATIONS_IN_A_ROW')));h.finish();
