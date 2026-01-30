# Configuração do Supabase Storage

Para que o upload de imagens funcione, é necessário criar os Buckets no Supabase e configurar as políticas de acesso.

## 1. Criar Buckets

No painel do Supabase, vá em **Storage** e crie os seguintes buckets (todos devem ser Públicos? O código usa `getPublicUrl`, então sim, ou policies que permitam leitura pública):

1. **relatorios**
   - Public: ✅ (Habilitado)
   - Allow file size: 5MB (recomendado)
   - Allowed MIME types: image/*

2. **anotacoes**
   - Public: ✅ (Habilitado)
   - Allow file size: 5MB
   - Allowed MIME types: image/*

3. **tintas**
   - Public: ✅ (Habilitado)
   - Allow file size: 5MB
   - Allowed MIME types: image/*

## 2. Configurar Políticas (Policies)

Para cada bucket, adicione as seguintes políticas em **Configuration > Policies**. 
(Você pode usar o template "Give users access to their own folder" ou criar manualmente apenas para Authenticated).

### Bucket: `relatorios`

- **SELECT (Ler)**: Permitir que qualquer um leia (visto que são públicos) ou apenas autenticados.
  - Policy Name: `Public Access`
  - Allowed operations: SELECT
  - Target roles: `anon`, `authenticated` (ou só authenticated se preferir privacidade)

- **INSERT (Upload)**: Apenas usuários autenticados.
  - Policy Name: `Authenticated Upload`
  - Allowed operations: INSERT
  - Target roles: `authenticated`
  - CHECK expression: `auth.role() = 'authenticated'`

- **UPDATE/DELETE**: Apenas usuários autenticados.
  - Policy Name: `Authenticated Delete`
  - Allowed operations: UPDATE, DELETE
  - Target roles: `authenticated`
  - USING expression: `auth.role() = 'authenticated'`

*(Repita o mesmo para os buckets `anotacoes` e `tintas`)*

## 3. Configuração do React (Vite)

Certifique-se de que o arquivo `.env` contém as variáveis corretas:
```bash
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 4. Deploy no Hostinger

Para deploy no Hostinger (VPS ou Hospedagem Node):
1. Execute `npm run build` localmente ou no servidor.
2. O conteúdo da pasta `dist` é o que deve ser servido.
3. Se for hospedagem estática, apenas suba a pasta `dist`.
4. Se for Node, ou se precisar de rotas (SPA), configure o servidor web (Apache/Nginx/htaccess) para redirecionar todas as rotas para `index.html`.

### Exemplo `.htaccess` para Hostinger (pasta public_html):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
