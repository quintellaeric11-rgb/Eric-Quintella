import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const read=p=>readFileSync(p,'utf8'),migration=read('supabase/migrations/202609010022_concierge_mvp.sql'),recommend=read('app/api/missions/recommend/route.ts'),admin=read('app/api/admin/overview/route.ts'),curation=read('app/api/admin/curation/route.ts'),auth=read('app/api/auth/register-youth/route.ts'),invites=read('app/api/auth/family-invites/route.ts'),ui=read('app/concierge-admin.tsx');
const checks={
 'Youth standalone cria a mesma estrutura de família':auth.includes("standalone_youth_family_created")&&auth.includes("role:'YOUTH'"),
 'convite bilateral fixa o papel esperado':migration.includes('intended_role')&&invites.includes('intendedRole'),
 'aprovação Parent é transacional e registra ambos os aceites':migration.includes('approve_conquest_for_curation')&&migration.includes("(contract_id,c.youth_id,'YOUTH'),(contract_id,parent_id,'PARENT')"),
 'aprovação deixa zero missões':migration.includes("recommended_mission_count=0")&&migration.includes("'Curadoria manual'"),
 'automação está OFF no endpoint de recomendação':recommend.includes('CONCIERGE_CURATION_REQUIRED')&&!recommend.includes("from '@/lib/mission-engine.mjs'"),
 'Admin é autorizado server-side':admin.includes("from('admin_users')")&&curation.includes("from('admin_users')"),
 'fila deriva primeira/próxima/evidência':admin.includes('AGUARDANDO PRIMEIRA MISSÃO')&&admin.includes('PRECISA DE PRÓXIMA MISSÃO')&&admin.includes('EVIDÊNCIA ENVIADA'),
 'ficha usa dados reais e CTA direto':ui.includes('FICHA ÚNICA DE CURADORIA')&&ui.includes('RESUMO PARA CURADORIA')&&migration.includes("/?view=admin&conquest="),
 'draft e publicação reutilizam journey_missions':migration.includes("curation_status in ('DRAFT','PUBLISHED')")&&curation.includes("from('journey_missions')"),
 'publicação em lote notifica uma vez por público':migration.includes('admin_publish_curated_missions')&&migration.includes('CURATED_MISSIONS_READY'),
 'evidência obrigatória é validada no banco':migration.includes("raise exception 'evidence_required'")&&migration.includes("'evidence_required',d.evidence_required"),
 'cancelamento preserva aprovado e remove ativos':migration.includes("status not in ('APPROVED','CANCELLED')")&&migration.includes("sum(x.amount)"),
 'service role continua apenas server-side':!read('app/concierge-admin.tsx').includes('SUPABASE_SERVICE_ROLE_KEY')&&!read('app/concierge-conquest.tsx').includes('SUPABASE_SERVICE_ROLE_KEY')
};
for(const[label,pass]of Object.entries(checks))assert.equal(pass,true,label);console.log(JSON.stringify({suite:'concierge-mvp-static-contract',status:'PASS',checks:Object.keys(checks).length}));
