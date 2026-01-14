# 🚀 Guia de Deploy na Hostinger

Este guia explica como fazer o deploy da aplicação Streamlit na Hostinger.

## ⚠️ IMPORTANTE: Limitações da Hostinger

A Hostinger oferece hospedagem compartilhada tradicional (cPanel), que **NÃO suporta nativamente aplicações Streamlit**.

Para hospedar esta aplicação, você tem algumas opções:

### Opção 1: VPS na Hostinger (Recomendado)
Se você tem um VPS (Virtual Private Server) na Hostinger:

1. **Acesse seu VPS via SSH**
2. **Instale Python 3.x**:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

3. **Clone o repositório**:
```bash
git clone https://github.com/SEU_USUARIO/PICKING.git
cd PICKING
```

4. **Configure o ambiente**:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

5. **Configure para rodar em background (usando PM2)**:
```bash
# Instale Node.js e PM2
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Inicie a aplicação
pm2 start "streamlit run estoque.py --server.port 8501 --server.address 0.0.0.0" --name pauliceia
pm2 save
pm2 startup
```

6. **Configure Nginx como proxy reverso**:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:8501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Opção 2: Streamlit Cloud (Grátis e Mais Fácil) ⭐
**Esta é a opção MAIS RECOMENDADA para Streamlit**:

1. Acesse: https://streamlit.io/cloud
2. Faça login com sua conta GitHub
3. Clique em "New app"
4. Selecione seu repositório `PICKING`
5. Branch: `main`
6. Main file: `estoque.py`
7. Clique em "Deploy"

**Pronto!** Sua aplicação estará online em minutos em um endereço como:
`https://seu-usuario-picking-xxx.streamlit.app`

### Opção 3: Railway, Render ou Heroku
Outras plataformas que suportam Python e Streamlit gratuitamente:

**Railway** (https://railway.app):
- Conecte seu GitHub
- Selecione o repositório
- Deploy automático

**Render** (https://render.com):
- Conecte seu GitHub
- Crie um novo Web Service
- Comando de start: `streamlit run estoque.py --server.port $PORT --server.address 0.0.0.0`

## 📝 Configurações Adicionais

### Para produção, adicione um arquivo `config.toml`:

Crie: `.streamlit/config.toml`
```toml
[server]
headless = true
port = 8501

[browser]
gatherUsageStats = false
```

### Variáveis de ambiente (se necessário):
Crie um arquivo `.env`:
```
DATABASE_PATH=pauliceia_web.db
```

## 🔒 Segurança

Para produção, considere:
1. Adicionar autenticação (streamlit-authenticator)
2. Usar HTTPS (Let's Encrypt)
3. Fazer backup regular do banco de dados
4. Limitar acesso por IP se necessário

## 💡 Recomendação Final

Para uma aplicação Streamlit como a sua, a **Streamlit Cloud** é a melhor opção:
- ✅ Totalmente gratuita
- ✅ Deploy em minutos
- ✅ Atualizações automáticas do GitHub
- ✅ SSL/HTTPS incluído
- ✅ Não precisa configurar servidor

A Hostinger compartilhada é melhor para sites WordPress, PHP, HTML estáticos.
