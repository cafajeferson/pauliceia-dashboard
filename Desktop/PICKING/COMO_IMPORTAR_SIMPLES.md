# 📦 Como Importar Produtos SEM Endereço

## 🎯 Para que serve?

Este método é **IDEAL** para você que:
- Tem MUITOS produtos para cadastrar
- Quer ganhar tempo
- Prefere cadastrar os endereços depois no site

## 🚀 Como Usar:

### 1️⃣ Criar seu arquivo de produtos

Crie um arquivo de texto simples (`.txt`) com seus produtos:
- **1 produto por linha**
- Pode usar QUALQUER nome de arquivo

**Exemplo de arquivo:**
```
PRIMER CINZA 900ML
CATALISADOR 150ML
LIXA P400
THINNER 5L
MASSA PLASTICA
```

### 2️⃣ Rodar o importador

```bash
python importar_produtos_simples.py
```

O script vai perguntar o nome do arquivo.
- Digite o nome do seu arquivo
- Ou aperte **ENTER** para usar `lista_produtos.txt`

### 3️⃣ Resultado

✅ Todos os produtos serão importados com endereço: **"SEM ENDEREÇO"**

Você verá um resumo:
```
✅ IMPORTAÇÃO CONCLUÍDA!
➕ Produtos adicionados: 25
⏭️  Produtos ignorados (já existem): 2
```

### 4️⃣ Cadastrar Endereços no Site

```bash
streamlit run estoque.py
```

1. Vá na aba **"🔍 GERENCIAR ESTOQUE"**
2. Procure por produtos com **"SEM ENDEREÇO"** (eles ficam destacados em vermelho no relatório)
3. Clique em **✏️ Editar**
4. Digite o endereço
5. Clique em **✅ Salvar**

## 💡 Dicas

- ✅ Produtos duplicados são **ignorados automaticamente**
- ✅ Tudo é convertido para **MAIÚSCULAS**
- ✅ Linhas vazias são ignoradas
- ✅ Você pode rodar **quantas vezes quiser** - só adiciona produtos novos

## 📝 Exemplo Prático

**Arquivo: meus_produtos.txt**
```
PRIMER BRANCO
BASE PRETA
VERNIZ BRILHO
CATALISADOR
```

**Comando:**
```bash
python importar_produtos_simples.py
```

**Digite:** `meus_produtos.txt`

**Pronto!** 🎉 Os 4 produtos foram importados e você cadastra os endereços no site quando quiser!

---

## ⚠️ Importante

- Os produtos ficam com **"SEM ENDEREÇO"** até você editar
- No relatório de pedido, produtos sem endereço aparecem em **VERMELHO**
- Cadastre os endereços assim que possível para usar o sistema completo
