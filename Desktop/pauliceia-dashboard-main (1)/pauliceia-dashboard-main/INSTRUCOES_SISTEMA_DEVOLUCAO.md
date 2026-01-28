# 📦 SISTEMA DE DEVOLUÇÃO - INSTRUÇÕES

## 🎯 **O QUE VAI SER ADICIONADO:**

✅ Editar relatórios, produtos emprestados e devemos  
✅ Marcar produtos como "devolvidos" com data automática  
✅ Nova aba "DEVOLVIDOS" com histórico  
✅ Opção de reabrir itens devolvidos  

---

## ⚡ **INSTALAÇÃO RÁPIDA (3 PASSOS)**

### **1️⃣ ATUALIZAR BANCO DE DADOS (Supabase)**

Acesse: https://supabase.com/dashboard → SQL Editor

Cole e execute:

```sql
ALTER TABLE devemos ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT FALSE;
ALTER TABLE devemos ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMP;
ALTER TABLE materiais_emprestados ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT FALSE;
ALTER TABLE materiais_emprestados ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMP;
```

---

### **2️⃣ ATUALIZAR O CÓDIGO**

Opção A - **Automático** (Recomendado):

```powershell
cd "c:\Users\Jeferson\Desktop\phyton guanabara\phyton guanabara"
python atualizar_devolvidos.py
```

Opção B - **Manual**:
- Consulte o arquivo `GUIA_IMPLEMENTACAO_DEVOLVIDOS.md`

---

### **3️⃣ TESTAR E FAZER DEPLOY**

```powershell
# Testar localmente
streamlit run app.py

# Se tudo ok, fazer commit
git add .
git commit -m "✨ Sistema de devolução implementado"
git push origin main
```

**Deploy na Hostinger:**

```bash
cd /var/www/pauliceia && git pull && pkill -f streamlit && nohup streamlit run app.py --server.port 8502 --server.address 0.0.0.0 --server.headless true > /root/streamlit.log 2>&1 &
```

---

## 📁 **ARQUIVOS CRIADOS:**

- ✅ `UPDATE_DEVOLVIDOS.sql` - SQL para atualizar banco
- ✅ `atualizar_devolvidos.py` - Script automático de atualização
- ✅ `GUIA_IMPLEMENTACAO_DEVOLVIDOS.md` - Guia completo
- ✅ `IMPLEMENTACAO_RAPIDA.md` - Guia resumido
- ✅ `INSTRUCOES_SISTEMA_DEVOLUCAO.md` - Este arquivo

---

## 🎨 **COMO VAI FICAR:**

```
DEVEMOS
├── 📋 Pendentes
│   ├── ➕ Novo Registro
│   ├── 🏪 Loja ABC
│   │   ├── ✏️ Editar
│   │   ├── ✅ Marcar como Devolvido
│   │   └── 🗑️ Excluir
│   
└── ✅ Devolvidos
    ├── 🏪 Loja XYZ - Devolvido em 23/01/2026
    │   ├── 📅 Data: 23/01/2026 14:30
    │   ├── ↩️ Marcar como Pendente
    │   └── 🗑️ Excluir
```

---

## ✅ **CHECKLIST:**

- [ ] SQL executado no Supabase
- [ ] Código atualizado (python atualizar_devolvidos.py)
- [ ] Testado localmente
- [ ] Funciona corretamente
- [ ] Commit feito no GitHub
- [ ] Deploy na Hostinger

---

## 🆘 **PROBLEMAS?**

1. **Backup automático** criado em: `app_backup_YYYYMMDD_HHMMSS.py`
2. **Restaurar:** `Copy-Item app_backup_*.py app.py` (escolher o mais recente)
3. **Logs Hostinger:** `tail -f /root/streamlit.log`

---

**Criado em:** 23/01/2026  
**Versão:** 1.0  
**Autor:** GitHub Copilot
