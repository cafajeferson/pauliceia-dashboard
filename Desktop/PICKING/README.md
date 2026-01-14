# 🏭 Sistema de Estoque Pauliceia

Sistema profissional de gerenciamento de estoque e impressão de pedidos de separação.

## ✨ Funcionalidades

### 🖨️ Impressão de Pedidos
- Gera relatórios de separação formatados
- Busca automática de endereços
- Ordenação inteligente por localização
- Destaque visual para produtos sem endereço
- Pronto para impressão (Ctrl + P)

### 📦 Gerenciamento de Estoque
- **2.614 produtos** cadastrados (linha automotiva + imobiliária)
- Busca rápida e inteligente
- Filtros por status (com/sem endereço)
- Edição inline de produtos
- Sistema de paginação (máx 100 produtos)
- Estatísticas em tempo real

### 🚀 Performance
- Otimizado para grandes volumes de dados
- Carregamento instantâneo
- Busca obrigatória (não trava o sistema)
- Limite inteligente de exibição

## 📋 Requisitos

- Python 3.8+
- Streamlit
- Pandas
- SQLite3

## 🎯 Instalação

1. **Clone o repositório**:
```bash
git clone https://github.com/SEU_USUARIO/PICKING.git
cd PICKING
```

2. **Instale as dependências**:
```bash
pip install -r requirements.txt
```

3. **Execute o sistema**:
```bash
streamlit run estoque.py
```

O sistema abrirá automaticamente no navegador em: `http://localhost:8501`

## 📊 Estrutura do Projeto

```
PICKING/
├── estoque.py                      # Sistema principal
├── pauliceia_web.db               # Banco de dados SQLite
├── importar_do_excel.py           # Importador do Excel (2 abas)
├── importar_produtos_simples.py   # Importador de .txt
├── fazer_backup.py                # Script de backup
├── produtos/
│   └── estoque.xls               # Arquivo original (2 abas)
├── backups/                       # Backups automáticos
└── README.md                      # Este arquivo
```

## 🔄 Atualização do Site

### Se está na Streamlit Cloud:
```bash
git add .
git commit -m "Atualização"
git push origin main
```
O deploy é automático!

### Se está em VPS:
Consulte: [ATUALIZAR_SITE_RAPIDO.md](ATUALIZAR_SITE_RAPIDO.md)

## 📚 Documentação

- [COMO_ATUALIZAR_SITE.md](COMO_ATUALIZAR_SITE.md) - Guia completo de atualização
- [ATUALIZAR_SITE_RAPIDO.md](ATUALIZAR_SITE_RAPIDO.md) - Guia rápido
- [DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md) - Deploy em produção
- [MELHORIAS_PERFORMANCE.md](MELHORIAS_PERFORMANCE.md) - Otimizações implementadas
- [RESUMO_IMPORTACAO.md](RESUMO_IMPORTACAO.md) - Status da importação
- [PROXIMOS_PASSOS.md](PROXIMOS_PASSOS.md) - Guia pós-importação

## 🛠️ Ferramentas Disponíveis

### Importadores:
- `importar_do_excel.py` - Importa produtos do Excel (2 abas)
- `importar_produtos_simples.py` - Importa de arquivo .txt
- `importar_produtos.py` - Importa de CSV/Excel com validação

### Utilitários:
- `fazer_backup.py` - Backup do banco de dados
- `verificar_abas.py` - Verifica abas do Excel

## 💡 Como Usar

### 1. Importar Produtos (se necessário):
```bash
python importar_do_excel.py
```

### 2. Cadastrar Endereços:
- Acesse a aba "GERENCIAR ESTOQUE"
- Use a busca para filtrar produtos
- Edite e cadastre os endereços

### 3. Gerar Pedidos:
- Acesse a aba "IMPRESSÃO DE PEDIDO"
- Digite o nome do cliente
- Cole a lista de produtos
- Clique em "GERAR RELATÓRIO"
- Pressione Ctrl + P para imprimir

## 🔒 Backup

**SEMPRE** faça backup antes de atualizar:
```bash
python fazer_backup.py
```

Backups são salvos em: `backups/`

## 📈 Estatísticas

- **2.614 produtos** cadastrados
- **1.551 produtos** linha automotiva
- **1.063 produtos** linha imobiliária (descontando duplicatas)
- **Sistema otimizado** para performance

## 🚀 Deploy

### Recomendado: Streamlit Cloud (Grátis)
1. Acesse: https://streamlit.io/cloud
2. Conecte com GitHub
3. Selecione o repositório
4. Deploy automático!

### Outras opções:
- VPS (Hostinger, DigitalOcean, etc.)
- Railway
- Render
- Heroku

Consulte [DEPLOY_HOSTINGER.md](DEPLOY_HOSTINGER.md) para mais detalhes.

## 📞 Suporte

Dúvidas ou problemas? Verifique a documentação:
- Para atualizar: [ATUALIZAR_SITE_RAPIDO.md](ATUALIZAR_SITE_RAPIDO.md)
- Para performance: [MELHORIAS_PERFORMANCE.md](MELHORIAS_PERFORMANCE.md)
- Para importar: [RESUMO_IMPORTACAO.md](RESUMO_IMPORTACAO.md)

## 📄 Licença

Sistema desenvolvido para uso interno da Pauliceia.

---

**Versão:** 2.0 (Otimizada com 2.614 produtos)
