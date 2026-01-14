# 📦 Como Importar Produtos em Massa

## 🚀 Passo a Passo

### 1. Instalar Dependências (se ainda não instalou)
```bash
pip install -r requirements.txt
```

### 2. Preparar seu Arquivo de Produtos

Você pode usar **Excel (.xlsx)** ou **CSV (.csv)**

#### Formato Necessário:
O arquivo deve ter **2 colunas obrigatórias**:
- `descricao` - Nome/descrição do produto
- `endereco` - Localização no estoque (ex: RUA 1, RUA 2.A.3, etc.)

#### Exemplo:
```
descricao              | endereco
-----------------------|----------
PRIMER 8200 CINZA      | RUA 1
CATALISADOR 8110       | RUA 1
LIXA P400              | RUA 2.A.1
```

### 3. Editar o Arquivo de Exemplo

Já criei um arquivo de exemplo para você: `produtos_para_importar.csv`

**Opção A:** Editar o CSV diretamente no Excel ou bloco de notas
**Opção B:** Criar sua própria planilha Excel seguindo o formato acima

### 4. Executar a Importação

```bash
python importar_produtos.py
```

O sistema vai:
1. ✅ Verificar o banco de dados
2. 📊 Mostrar quantos produtos já existem
3. 📁 Pedir o caminho do arquivo (aperte ENTER para usar o padrão)
4. 🔍 Validar os dados
5. 📋 Mostrar um preview dos produtos
6. ⚠️  Avisar se houver duplicatas
7. 🎯 Perguntar o que fazer:
   - **Opção 1:** Adicionar só produtos novos (recomendado)
   - **Opção 2:** Atualizar existentes + adicionar novos
   - **Opção 3:** Limpar tudo e importar do zero (cuidado!)

### 5. Conferir no Sistema Web

Depois de importar, abra o sistema web:
```bash
streamlit run estoque.py
```

Vá na aba **"GERENCIAR ESTOQUE"** e confira se todos os produtos foram importados!

## 📝 Dicas Importantes

- ✅ O sistema **remove duplicatas automaticamente** do arquivo
- ✅ Se deixar o endereço vazio, ele coloca "SEM ENDEREÇO"
- ✅ Tudo é convertido para **MAIÚSCULAS** automaticamente
- ✅ Espaços extras são removidos
- ⚠️  **Opção 3** apaga TUDO do banco - use com cuidado!

## 🎯 Depois da Primeira Importação

Depois de importar todos os produtos:
- Use o **sistema web** ([estoque.py](estoque.py)) para edições pontuais
- Não precisa mais usar o importador
- Cadastre produtos novos direto pela interface web

## ❓ Problemas Comuns

**Erro: "Colunas faltando"**
→ Verifique se seu arquivo tem as colunas `descricao` e `endereco`

**Erro: "Arquivo não encontrado"**
→ Coloque o arquivo na mesma pasta do script ou digite o caminho completo

**Erro: "ModuleNotFoundError"**
→ Rode: `pip install -r requirements.txt`

## 📞 Precisa de Ajuda?

Qualquer dúvida, é só perguntar! 😊
