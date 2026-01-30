# 🔧 GUIA DE IMPLEMENTAÇÃO - SISTEMA DE DEVOLUÇÃO

## 📋 **O QUE SERÁ IMPLEMENTADO:**

### 1️⃣ **Funcionalidades:**
- ✏️ Editar relatórios, produtos emprestados e devemos
- ✅ Marcar produtos como "devolvidos" (tanto em "Devemos" quanto em "Pegamos Emprestado")
- 📅 Nova aba "DEVOLVIDOS" com histórico e data de devolução
- 📊 Controle completo de empréstimos/devoluções
- ↩️ Opção de reabrir itens devolvidos (marcar como pendente novamente)

---

## 🗄️ **PASSO 1: ATUALIZAR O BANCO DE DADOS**

### **Execute este SQL no Supabase SQL Editor:**

```sql
-- Adicionar coluna 'devolvido' e 'data_devolucao' na tabela DEVEMOS
ALTER TABLE devemos ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT FALSE;
ALTER TABLE devemos ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMP;

-- Adicionar coluna 'devolvido' e 'data_devolucao' na tabela MATERIAIS_EMPRESTADOS
ALTER TABLE materiais_emprestados ADD COLUMN IF NOT EXISTS devolvido BOOLEAN DEFAULT FALSE;
ALTER TABLE materiais_emprestados ADD COLUMN IF NOT EXISTS data_devolucao TIMESTAMP;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_devemos_devolvido ON devemos(devolvido);
CREATE INDEX IF NOT EXISTS idx_materiais_emprestados_devolvido ON materiais_emprestados(devolvido);
```

### **Verificar se funcionou:**

```sql
SELECT 
    column_name, 
    data_type, 
    column_default
FROM information_schema.columns
WHERE table_name IN ('devemos', 'materiais_emprestados')
AND column_name IN ('devolvido', 'data_devolucao')
ORDER BY table_name, column_name;
```

---

## 📝 **PASSO 2: FAZER BACKUP DO ARQUIVO ATUAL**

```powershell
cd "c:\Users\Jeferson\Desktop\phyton guanabara\phyton guanabara"
Copy-Item app.py app_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').py
```

---

## 🚀 **PASSO 3: ATUALIZAR O CÓDIGO**

O arquivo `app.py` precisa ser atualizado em **4 locais**:

### **Locais a serem alterados:**

1. **Função `tela_lider_loja()` - ABA DEVEMOS** (linhas ~290-370)
2. **Função `tela_lider_loja()` - ABA MATERIAIS EMPRESTADOS** (linhas ~370-450)
3. **Verificar se não há outras funções que usam DEVEMOS** (buscar no código)
4. **Adicionar imports se necessário**

---

## ⚙️ **FUNCIONALIDADES IMPLEMENTADAS:**

### **ABA: DEVEMOS**
- **Sub-aba "Pendentes":**
  - ✏️ Botão "Editar" para cada registro
  - ✅ Botão "Marcar como Devolvido" (registra data automaticamente)
  - 🗑️ Botão "Excluir"
  
- **Sub-aba "Devolvidos":**
  - 📋 Lista de todos os produtos devolvidos
  - 📅 Mostra data de devolução
  - ↩️ Botão "Marcar como Pendente" (reabre o item)
  - 🗑️ Botão "Excluir"

### **ABA: MATERIAIS EMPRESTADOS**
- Mesma estrutura de DEVEMOS
- Sub-abas: "Pendentes" e "Devolvidos"
- Funcionalidades idênticas

---

## 📊 **ESTRUTURA DAS NOVAS SUB-ABAS:**

```
DEVEMOS
├── 📋 Pendentes
│   ├── ➕ Novo Registro
│   ├── Lista de pendentes
│   │   ├── ✏️ Editar
│   │   ├── ✅ Marcar como Devolvido
│   │   └── 🗑️ Excluir
│   
└── ✅ Devolvidos
    ├── Lista de devolvidos
    │   ├── 📅 Data de devolução
    │   ├── ↩️ Marcar como Pendente
    │   └── 🗑️ Excluir
```

---

## 🔄 **PASSO 4: TESTAR AS FUNCIONALIDADES**

### **Checklist de Testes:**

- [ ] Criar novo registro em DEVEMOS
- [ ] Editar um registro existente
- [ ] Marcar como devolvido
- [ ] Verificar se aparece na aba "Devolvidos" com data
- [ ] Reabrir um item devolvido (marcar como pendente)
- [ ] Excluir um registro devolvido
- [ ] Repetir testes em MATERIAIS EMPRESTADOS

---

## 📤 **PASSO 5: FAZER COMMIT E DEPLOY**

### **Commit no GitHub:**

```powershell
cd "c:\Users\Jeferson\Desktop\phyton guanabara\phyton guanabara"
git add .
git commit -m "✨ Implementado sistema de devolução com edição e histórico"
git push origin main
```

### **Deploy na Hostinger (SSH):**

```bash
cd /var/www/pauliceia
git pull origin main
pkill -f streamlit
nohup streamlit run app.py --server.port 8502 --server.address 0.0.0.0 --server.headless true > /root/streamlit.log 2>&1 &
```

---

## 🎯 **RESULTADO FINAL:**

Após a implementação, você terá:

1. ✅ Sistema completo de controle de empréstimos/devoluções
2. ✅ Histórico de devoluções com datas
3. ✅ Edição de registros existentes
4. ✅ Possibilidade de reabrir itens devolvidos
5. ✅ Interface organizada com sub-abas

---

## 🆘 **SUPORTE:**

Se tiver algum problema:
1. Verificar logs: `tail -f /root/streamlit.log`
2. Verificar banco de dados no Supabase
3. Restaurar backup se necessário

---

**Data:** 23/01/2026
**Versão:** 1.0
