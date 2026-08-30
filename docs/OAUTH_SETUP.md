# Configuração externa de autenticação KONKI

O código local aceita e-mail/senha, Google e Apple. E-mail está habilitado no projeto; Google e Apple precisam ser ativados no painel do Supabase antes do teste real.

## URLs da aplicação

Em **Authentication → URL Configuration**:

- Site URL local: `http://localhost:3000`
- Redirect local permitido: `http://localhost:3000/auth/callback`
- Reset local permitido: `http://localhost:3000/auth/reset`
- Ao publicar, adicionar as mesmas rotas no domínio público da KONKI.

## Callback dos provedores

No console do Google e no portal Apple, usar a callback informada pelo próprio Supabase, no formato:

`https://<project-ref>.supabase.co/auth/v1/callback`

Depois, em **Authentication → Providers**:

1. Habilitar Google e informar Client ID e Client Secret.
2. Habilitar Apple e informar Service ID, Team ID, Key ID e a chave privada exigida pelo provedor.
3. Manter todos os segredos somente no painel do Supabase ou em variáveis privadas; nunca usar prefixo `NEXT_PUBLIC_` para eles.
4. Testar uma conta nova e uma conta já existente em cada provedor.

O primeiro acesso OAuth abre a escolha de perfil. Responsável cria uma família; jovem informa convite e DOB. A callback da aplicação troca o código por sessão e não recebe Service Role Key no navegador.

## Google

1. No Google Cloud Console, crie ou selecione um projeto e configure a tela de consentimento OAuth.
2. Crie credenciais do tipo **Web application**.
3. Em **Authorized JavaScript origins**, adicione a origem local e, quando existir, a origem pública.
4. Em **Authorized redirect URIs**, adicione somente a callback do Supabase mostrada acima.
5. Copie Client ID e Client Secret para **Authentication → Providers → Google** no Supabase.

## Apple

1. No Apple Developer, habilite Sign in with Apple para o App ID e crie um Services ID para a web.
2. Associe o domínio e a callback do Supabase ao Services ID.
3. Crie a chave de Sign in with Apple e anote Team ID e Key ID.
4. Informe Services ID, Team ID, Key ID e chave privada em **Authentication → Providers → Apple** no Supabase.
5. A Apple exige domínio HTTPS verificado para o teste web público; localhost cobre apenas o fluxo interno da aplicação, não a autorização real da Apple.

## Critério de validação externa

- Conta nova retorna a `/auth/callback`, escolhe Parent ou Youth e conclui uma única família/vinculação.
- Repetir ou atualizar a tela de conclusão não cria duplicidades.
- Conta já concluída entra direto no produto.
- Youth com convite inválido pode corrigir o código e tentar novamente sem vínculo parcial.
- Recuperação de senha retorna mensagem neutra na solicitação e rejeita link expirado ou reutilizado.
