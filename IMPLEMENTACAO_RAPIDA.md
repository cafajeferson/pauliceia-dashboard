# 🚀 IMPLEMENTAÇÃO RÁPIDA - SISTEMA DE DEVOLUÇÃO

## ⚡ **PASSO A PASSO RÁPIDO**

### **1️⃣ ATUALIZAR BANCO DE DADOS (2 minutos)**

Acesse [Supabase SQL Editor](https://supabase.com/dashboard) e execute:

```sql
ALTER TABLE devemos ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT FALSE;
ALTER TABLE devemos ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMP;
ALTER TABLE materiais_emprestados ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT FALSE;
ALTER TABLE materiais_emprestados ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_devemos_devolvido ON devemos(devolvido);
CREATE INDEX IF NOT EXISTS idx_materiais_emprestados_devolvido ON materiais_emprestados(devolvido);
```

✅ **Pronto!** O banco está atualizado.

---

### **2️⃣ ATUALIZAR O CÓDIGO**

Devido ao tamanho do arquivo `app.py` (2169 linhas), vou criar um **script Python** que atualiza automaticamente!

Execute no terminal:

```powershell
cd "c:\Users\Jeferson\Desktop\phyton guanabara\phyton guanabara"
python atualizar_devolvidos.py
```

---

### **3️⃣ TESTAR LOCALMENTE**

```powershell
streamlit run app.py
```

Acesse: http://localhost:8501

**Teste:**
- Login como líder de loja
- Vá em "Devemos" → Criar novo
- Marcar como devolvido
- Verificar na aba "Devolvidos"

---

### **4️⃣ FAZER DEPLOY**

```powershell
git add .
git commit -m "✨ Sistema de devolução implementado"
git push origin main
```

**Na Hostinger (SSH):**

```bash
cd /var/www/pauliceia && git pull && pkill -f streamlit && nohup streamlit run app.py --server.port 8502 --server.address 0.0.0.0 --server.headless true > /root/streamlit.log 2>&1 &
```

---

## ✅ **PRONTO!**

Agora você tem:
- ✏️ Editar relatórios/produtos
- ✅ Marcar como devolvido
- 📅 Histórico com data de devolução
- ↩️ Reabrir itens devolvidos

---

**Tempo estimado:** 10-15 minutos
**Dificuldade:** Fácil 🟢
