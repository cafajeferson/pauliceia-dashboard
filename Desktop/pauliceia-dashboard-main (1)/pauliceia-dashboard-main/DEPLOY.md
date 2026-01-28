# Guia de Deploy - Hostinger

Este projeto é uma aplicação React (Vite). Para fazer o deploy na Hostinger, siga os passos abaixo:

## 1. Build do Projeto

Execute o comando de build para gerar os arquivos estáticos de produção:

```bash
npm run build
```

Isso criará uma pasta `dist/` na raiz do projeto.

## 2. Upload para Hostinger

1. Acesse o Gerenciador de Arquivos da Hostinger.
2. Navegue até a pasta pública (geralmente `public_html`).
3. Faça upload de **todo o conteúdo** da pasta `dist/` (index.html, assets, vite.svg, etc) para dentro de `public_html`.

## 3. Configuração de Roteamento (SPA)

Como é uma Single Page Application (SPA), precisamos redirecionar todas as rotas para o `index.html`.

Crie um arquivo chamado `.htaccess` na pasta `public_html` com o seguinte conteúdo:

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

Isso garante que se o usuário acessar `/login` ou `/admin`, o servidor entregará o `index.html` e o React Router assumirá o controle.

## 4. Variáveis de Ambiente

Não se esqueça de configurar as variáveis de ambiente se estiver usando CI/CD, ou certifique-se de que o `.env` foi considerado durante o build (o Vite "bakes" as variáveis `VITE_` no código compilado).

Se você criar o build localmente com o `.env` correto, não precisa configurar variáveis no painel da Hostinger (para arquivos estáticos).
