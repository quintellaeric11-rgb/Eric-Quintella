import { createClient,type SupabaseClient } from '@supabase/supabase-js';
let sharedClient:SupabaseClient|undefined;
export function createBrowserSupabase(){if(sharedClient)return sharedClient;const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)throw new Error('Configuração do produto indisponível.');sharedClient=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});return sharedClient}
