# 📋 COLA-COLA - Comandos Rápidos para Atualizar

## 💻 NO SEU COMPUTADOR (Windows):

```bash
# 1. Fazer backup
python fazer_backup.py

# 2. Subir para o GitHub
git add .
git commit -m "v2.0: Otimização + 2.614 produtos"
git push origin main
```

---

## 🌐 NA HOSTINGER (via SSH):

```bash
# 1. Conectar
ssh seu-usuario@seu-dominio.com

# 2. Ir para a pasta
cd PICKING
# (ou cd /home/usuario/PICKING)
# (ou cd /home/usuario/public_html/PICKING)

# 3. Backup do banco
cp pauliceia_web.db pauliceia_web.db.backup-$(date +%Y%m%d)

# 4. Baixar do GitHub
git pull origin main

# 5. Atualizar dependências (se necessário)
pip install -r requirements.txt

# 6. Reiniciar
pm2 restart pauliceia
# (ou: sudo systemctl restart pauliceia)

# 7. Verificar
pm2 logs pauliceia
# (ou: sudo systemctl status pauliceia)
```

---

## 🆘 SE DER PROBLEMA:

### Restaurar banco:
```bash
cp pauliceia_web.db.backup-* pauliceia_web.db
pm2 restart pauliceia
```

### Ver erros:
```bash
pm2 logs pauliceia --lines 50
```

### Forçar atualização:
```bash
git reset --hard origin/main
pm2 restart pauliceia
```

---

## ✅ PRONTO!

Acesse: `http://seu-dominio.com`

Deve ver:
- Estatísticas no topo
- Busca obrigatória
- Filtros
- Site rápido!

---

**Dica:** Salve este arquivo! É seu guia rápido para futuras atualizações. 😊
