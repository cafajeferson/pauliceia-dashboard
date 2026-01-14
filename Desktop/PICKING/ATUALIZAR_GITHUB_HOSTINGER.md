# 🔄 Passo a Passo: Atualizar GitHub → Hostinger

## 📋 Seu Fluxo Atual:
1. Código no **GitHub**
2. Site rodando na **Hostinger**

---

## 🚀 PASSO A PASSO COMPLETO

### PARTE 1: Subir Atualizações para o GitHub

#### Passo 1: Fazer Backup Local
```bash
# Na pasta PICKING no seu computador
python fazer_backup.py
```
✅ Backup criado em: `backups/`

#### Passo 2: Verificar Mudanças
```bash
# Ver o que foi modificado
git status
```

Você verá algo como:
```
modified:   estoque.py
modified:   pauliceia_web.db
new file:   fazer_backup.py
new file:   importar_do_excel.py
...
```

#### Passo 3: Adicionar Arquivos ao Git
```bash
# Adicionar tudo
git add .

# OU adicionar apenas arquivos específicos (se não quiser o banco ainda)
git add estoque.py
git add fazer_backup.py
git add importar_do_excel.py
git add README.md
git add *.md
```

#### Passo 4: Fazer Commit
```bash
git commit -m "v2.0: Otimização de performance + 2.614 produtos importados"
```

#### Passo 5: Enviar para o GitHub
```bash
git push origin main
```

✅ **Pronto!** Código atualizado no GitHub!

---

### PARTE 2: Atualizar na Hostinger

#### Passo 1: Conectar na Hostinger via SSH

**Opção A - Pelo Terminal:**
```bash
ssh seu-usuario@seu-dominio.com
# OU
ssh seu-usuario@IP-do-servidor
```

**Opção B - Pelo cPanel da Hostinger:**
1. Acesse o cPanel
2. Procure por "Terminal" ou "SSH Access"
3. Clique para abrir

Digite sua senha quando solicitado.

#### Passo 2: Ir para a Pasta do Projeto
```bash
# Navegue até onde está o projeto
cd /home/seu-usuario/PICKING
# OU pode ser algo como:
# cd /home/seu-usuario/public_html/PICKING
# cd ~/PICKING

# Verifique se está no lugar certo
pwd
ls -la
```

Você deve ver os arquivos: `estoque.py`, `pauliceia_web.db`, etc.

#### Passo 3: Fazer Backup do Banco Atual na Hostinger
```bash
# Backup do banco de dados
cp pauliceia_web.db pauliceia_web.db.backup-$(date +%Y%m%d)

# Verificar se foi criado
ls -la *.backup*
```

✅ **Backup criado!** Agora é seguro atualizar.

#### Passo 4: Baixar Atualizações do GitHub
```bash
# Puxar as mudanças do GitHub
git pull origin main
```

Você verá algo como:
```
Updating abc1234..def5678
Fast-forward
 estoque.py                 | 45 +++++++++++++++++++++++++++--
 pauliceia_web.db          | Bin 150000 -> 185000 bytes
 fazer_backup.py           | 95 ++++++++++++++++++++++++++++++++++++++++++++
 ...
```

#### Passo 5: Verificar Dependências
```bash
# Ativar ambiente virtual (se tiver)
source venv/bin/activate

# Instalar novas dependências (se houver)
pip install -r requirements.txt
```

#### Passo 6: Reiniciar a Aplicação

**Opção A - Se usa PM2:**
```bash
# Reiniciar com PM2
pm2 restart pauliceia

# Verificar se está rodando
pm2 status
pm2 logs pauliceia
```

**Opção B - Se usa systemd:**
```bash
# Reiniciar serviço
sudo systemctl restart pauliceia

# Verificar status
sudo systemctl status pauliceia
```

**Opção C - Se roda manualmente:**
```bash
# Matar processo antigo
pkill -f "streamlit run estoque.py"

# Rodar novamente
nohup streamlit run estoque.py --server.port 8501 --server.address 0.0.0.0 &
```

#### Passo 7: Verificar se Está Rodando
```bash
# Testar localmente
curl http://localhost:8501

# OU verificar processos
ps aux | grep streamlit
```

#### Passo 8: Testar no Navegador
1. Acesse: `http://seu-dominio.com`
2. Vá na aba "GERENCIAR ESTOQUE"
3. Deve ver as novas estatísticas no topo
4. Teste a busca

✅ **Site atualizado com sucesso!**

---

## 📝 RESUMO DOS COMANDOS

### No seu computador:
```bash
python fazer_backup.py
git add .
git commit -m "v2.0: Otimização + 2.614 produtos"
git push origin main
```

### Na Hostinger (via SSH):
```bash
ssh usuario@servidor
cd /caminho/para/PICKING
cp pauliceia_web.db pauliceia_web.db.backup-$(date +%Y%m%d)
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
pm2 restart pauliceia
```

---

## 🆘 PROBLEMAS COMUNS

### 1. "Permission denied (publickey)" ao conectar SSH
**Solução:**
- Use senha em vez de chave SSH
- Ou configure sua chave SSH no painel da Hostinger

### 2. "git pull" pede usuário/senha
**Solução:**
```bash
# Configure credenciais do Git
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Use token de acesso pessoal do GitHub
# (não a senha normal)
```

### 3. Não sei onde está a pasta do projeto
**Solução:**
```bash
# Procurar pela pasta
find ~ -name "estoque.py" 2>/dev/null

# OU
locate estoque.py
```

### 4. PM2 não encontrado
**Solução:**
```bash
# Instalar PM2
npm install -g pm2

# OU verificar como a aplicação está rodando
ps aux | grep streamlit
```

### 5. Site não atualiza após git pull
**Solução:**
```bash
# Forçar atualização
git reset --hard origin/main

# Limpar cache do browser (Ctrl + Shift + R)
```

### 6. Erro de dependências
**Solução:**
```bash
# Reinstalar tudo
pip install --upgrade -r requirements.txt

# OU
pip install xlrd openpyxl
```

---

## 🔙 COMO REVERTER SE DER PROBLEMA

### 1. Restaurar Banco de Dados:
```bash
# Na Hostinger
cp pauliceia_web.db.backup-20260114 pauliceia_web.db
pm2 restart pauliceia
```

### 2. Voltar Versão do Código:
```bash
# Na Hostinger
git log --oneline
git reset --hard COMMIT_ANTERIOR
pm2 restart pauliceia
```

---

## ✅ CHECKLIST

Marque conforme for fazendo:

### No Computador:
- [ ] Backup feito (`python fazer_backup.py`)
- [ ] `git add .`
- [ ] `git commit -m "mensagem"`
- [ ] `git push origin main`
- [ ] Verificou no GitHub se subiu

### Na Hostinger:
- [ ] Conectou via SSH
- [ ] Foi para pasta do projeto (`cd PICKING`)
- [ ] Fez backup do banco (`cp pauliceia_web.db ...`)
- [ ] `git pull origin main`
- [ ] Instalou dependências (`pip install -r requirements.txt`)
- [ ] Reiniciou aplicação (`pm2 restart pauliceia`)
- [ ] Testou no navegador

✅ **Tudo OK!**

---

## 📞 DÚVIDAS FREQUENTES

### Preciso atualizar o banco de dados?
- **SIM** se quer os 2.614 produtos
- **NÃO** se só quer a otimização de performance

Se NÃO quiser atualizar o banco:
```bash
# No computador, antes do git push
git reset HEAD pauliceia_web.db
git add estoque.py *.py *.md
git commit -m "Só otimização"
git push origin main
```

### Como sei se a Hostinger usa PM2?
```bash
# Na Hostinger
pm2 list

# Se não funcionar, tente:
systemctl list-units | grep pauliceia

# Ou veja processos:
ps aux | grep streamlit
```

### Posso atualizar sem parar o site?
**Não recomendado.** É melhor:
1. Fazer em horário de pouco movimento
2. Avisar usuários
3. Reiniciar rapidamente (leva ~30 segundos)

---

**Pronto!** Siga este guia e seu site será atualizado com sucesso! 🚀

Qualquer dúvida, me avisa! 😊
