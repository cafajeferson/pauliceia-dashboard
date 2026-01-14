# 🔄 Como Atualizar o Site que Já Está Rodando

## 📋 O Que Mudou:

✅ **Melhorias no estoque.py:**
- Sistema otimizado (não trava mais)
- Busca obrigatória
- Filtros inteligentes
- Paginação (máx 100 produtos)
- Estatísticas no topo

✅ **Banco de dados:**
- 2.614 produtos importados
- Precisa copiar o banco atualizado

---

## 🎯 Cenário 1: Site na Streamlit Cloud (Mais Comum)

### Passo 1: Fazer Backup do Banco Atual

**IMPORTANTE:** Baixe o banco de dados atual antes de atualizar!

1. Acesse seu app na Streamlit Cloud
2. Clique nos 3 pontinhos ⋮ → **Settings** → **Secrets**
3. Faça backup de qualquer configuração que tenha lá

### Passo 2: Atualizar Código no GitHub

```bash
# No seu computador (pasta PICKING)
git add .
git commit -m "Otimização de performance e importação completa"
git push origin main
```

### Passo 3: Atualizar Banco de Dados

**Opção A - Começar do Zero (Recomendado):**
1. O arquivo `pauliceia_web.db` vai junto com o código
2. A Streamlit Cloud vai usar o banco novo automaticamente
3. Deploy automático em ~2 minutos

**Opção B - Manter Dados Atuais:**
1. Baixe o `pauliceia_web.db` atual do servidor
2. Substitua pelo seu local (com os 2.614 produtos)
3. Faça commit do banco atualizado:
```bash
git add pauliceia_web.db
git commit -m "Atualiza banco com 2.614 produtos"
git push origin main
```

### Passo 4: Verificar Deploy

1. A Streamlit Cloud detecta mudanças automaticamente
2. Aguarde ~2 minutos
3. Recarregue a página
4. ✅ Site atualizado!

---

## 🎯 Cenário 2: Site em VPS/Servidor Próprio

### Passo 1: Fazer Backup

```bash
# Conecte via SSH ao servidor
ssh seu-usuario@seu-servidor.com

# Navegue até a pasta do projeto
cd /caminho/para/PICKING

# Faça backup do banco de dados
cp pauliceia_web.db pauliceia_web.db.backup-$(date +%Y%m%d)
```

### Passo 2: Parar a Aplicação

```bash
# Se estiver usando PM2
pm2 stop pauliceia

# Ou se estiver rodando direto
# (encontre o processo e mate)
pkill -f "streamlit run estoque.py"
```

### Passo 3: Atualizar Arquivos

**Opção A - Via Git (Recomendado):**
```bash
git pull origin main
```

**Opção B - Upload Manual:**
```bash
# Use SCP ou FileZilla para enviar:
# - estoque.py (atualizado)
# - pauliceia_web.db (com 2.614 produtos)
# - importar_do_excel.py (atualizado)
```

### Passo 4: Atualizar Dependências

```bash
# Ative o ambiente virtual
source venv/bin/activate

# Atualize dependências (caso tenha mudado)
pip install -r requirements.txt
```

### Passo 5: Reiniciar Aplicação

```bash
# Se estiver usando PM2
pm2 restart pauliceia

# Ou rode manualmente
streamlit run estoque.py --server.port 8501 --server.address 0.0.0.0
```

### Passo 6: Verificar

```bash
# Teste se está rodando
curl http://localhost:8501

# Ou acesse pelo navegador
# http://seu-dominio.com
```

---

## 🎯 Cenário 3: Site Rodando Localmente (Para Testes)

### Simplesmente:

1. **Pare** o Streamlit (Ctrl + C no terminal)
2. **Rode novamente:**
```bash
streamlit run estoque.py
```

Pronto! O código já está atualizado na sua máquina.

---

## 📦 Checklist de Atualização

Marque conforme for fazendo:

- [ ] **Backup feito** do banco de dados atual
- [ ] **Código atualizado** (via Git ou upload)
- [ ] **Banco de dados atualizado** (2.614 produtos)
- [ ] **Dependências instaladas** (xlrd se necessário)
- [ ] **Aplicação reiniciada**
- [ ] **Teste realizado** (abrir site e testar busca)

---

## 🆘 Problemas Comuns

### Site não carrega após atualização
```bash
# Verifique os logs
pm2 logs pauliceia

# Ou rode manualmente para ver erros
streamlit run estoque.py
```

### Banco de dados não atualizado
```bash
# Verifique se o arquivo foi enviado
ls -lh pauliceia_web.db

# Verifique quantidade de produtos
sqlite3 pauliceia_web.db "SELECT COUNT(*) FROM produtos;"
# Deve mostrar: 2614
```

### Erro de dependências
```bash
# Reinstale tudo
pip install --upgrade -r requirements.txt
```

---

## 💾 Script de Backup Automático

Criei um script para você fazer backup antes de atualizar:

```bash
python fazer_backup.py
```

Isso vai criar uma cópia de segurança do banco de dados.

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs
2. Teste localmente primeiro
3. Restaure o backup se necessário:
```bash
cp pauliceia_web.db.backup-20260114 pauliceia_web.db
pm2 restart pauliceia
```

---

**Dica:** Se está na Streamlit Cloud, a atualização é automática! Só dar push no GitHub. 🚀
