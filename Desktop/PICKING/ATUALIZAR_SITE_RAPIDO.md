# ⚡ Guia Rápido: Atualizar o Site

## 🎯 Onde Seu Site Está Rodando?

Escolha sua opção:

---

## 📱 **OPÇÃO 1: Streamlit Cloud** (Mais Comum)

### Passos:

1. **Fazer Backup** (opcional, mas recomendado):
```bash
python fazer_backup.py
```

2. **Subir para o GitHub**:
```bash
git add .
git commit -m "Otimização + 2.614 produtos importados"
git push origin main
```

3. **Aguardar Deploy Automático** (2-3 minutos)
   - A Streamlit Cloud detecta mudanças automaticamente
   - Recarregue a página do seu site

✅ **Pronto!** Site atualizado automaticamente!

---

## 💻 **OPÇÃO 2: VPS/Servidor Próprio**

### Passos:

1. **Conectar no Servidor**:
```bash
ssh usuario@seu-servidor.com
cd /caminho/para/PICKING
```

2. **Fazer Backup**:
```bash
cp pauliceia_web.db pauliceia_web.db.backup
```

3. **Atualizar Código**:
```bash
git pull origin main
```

4. **Reiniciar Aplicação**:
```bash
pm2 restart pauliceia
```

✅ **Pronto!** Site atualizado!

---

## 🏠 **OPÇÃO 3: Rodando Localmente**

### Passos:

1. **Parar o Streamlit** (Ctrl + C no terminal)

2. **Rodar novamente**:
```bash
streamlit run estoque.py
```

✅ **Pronto!** Já está atualizado!

---

## 📦 O Que Vai Mudar no Site:

Quando acessar o site atualizado, você verá:

✅ **Na aba "GERENCIAR ESTOQUE":**
- Estatísticas no topo (total, com/sem endereço)
- Sistema de busca obrigatória
- Filtro dropdown (Todos / Só SEM ENDEREÇO / Só COM ENDEREÇO)
- Máximo 100 produtos por vez (muito mais rápido!)
- Mensagem pedindo para buscar

✅ **Performance:**
- Site não trava mais
- Carrega instantaneamente
- Busca muito mais rápida

✅ **Banco de Dados:**
- 2.614 produtos (linha automotiva + imobiliária)

---

## ⚠️ Atenção:

Se você **NÃO quer** os 2.614 produtos no site ainda:

1. **Não faça commit** do arquivo `pauliceia_web.db`
2. Faça commit **só do estoque.py**:
```bash
git add estoque.py
git commit -m "Otimização de performance"
git push origin main
```

Assim o site fica otimizado mas mantém os produtos atuais!

---

## 🆘 Se Der Problema:

### Restaurar Backup:
```bash
# Se fez backup local
cp backups/pauliceia_web_*.db pauliceia_web.db

# No servidor
cp pauliceia_web.db.backup pauliceia_web.db
pm2 restart pauliceia
```

### Ver Logs de Erro:
```bash
# Se usa PM2
pm2 logs pauliceia

# Ou rode manualmente
streamlit run estoque.py
```

---

## 📞 Precisa de Ajuda?

1. Qual opção você usa? (Streamlit Cloud / VPS / Local)
2. Qual erro apareceu?
3. Está usando Git?

Me avisa que eu te ajudo! 😊

---

**Dica:** Se está na **Streamlit Cloud**, é só dar `git push` e pronto! 🚀
