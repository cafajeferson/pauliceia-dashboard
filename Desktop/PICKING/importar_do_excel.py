"""
Importa produtos do arquivo Excel em produtos/estoque.xls
"""

import pandas as pd
import sqlite3
import sys

# Fix encoding para Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

DB_NAME = "pauliceia_web.db"
ARQUIVO_EXCEL = "produtos/estoque.xls"

def importar_excel():
    """Importa produtos do Excel (todas as abas)"""

    print('='*60)
    print('📖 IMPORTANDO DO EXCEL - PAULICEIA')
    print('='*60)

    # Ler Excel e verificar abas
    print(f'\n📁 Lendo arquivo: {ARQUIVO_EXCEL}')
    try:
        xls = pd.ExcelFile(ARQUIVO_EXCEL)
        print(f'✅ Abas encontradas: {", ".join(xls.sheet_names)}')
    except Exception as e:
        print(f'❌ Erro ao ler arquivo: {e}')
        return

    # Processar cada aba
    todos_produtos = []
    for sheet_name in xls.sheet_names:
        print(f'\n📋 Processando aba: {sheet_name}')
        df = pd.read_excel(ARQUIVO_EXCEL, sheet_name=sheet_name)

        # Extrair produtos da coluna 'Unnamed: 2'
        produtos_aba = df['Unnamed: 2'].dropna().unique()
        todos_produtos.extend(produtos_aba)
        print(f'   ✅ {len(produtos_aba)} produtos encontrados')

    # Remove duplicatas entre as abas
    produtos = list(set(todos_produtos))
    print(f'\n✅ Total de produtos únicos (todas as abas): {len(produtos)}')

    # Conectar ao banco
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Verificar tabela
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL,
            endereco TEXT
        )
    ''')

    adicionados = 0
    ignorados = 0

    print('\n📦 Processando produtos...')
    print('='*60)

    for idx, produto in enumerate(produtos, 1):
        produto_limpo = str(produto).strip().upper()

        # Verifica se já existe
        cursor.execute('SELECT id FROM produtos WHERE descricao = ?', (produto_limpo,))
        existe = cursor.fetchone()

        if not existe:
            cursor.execute('INSERT INTO produtos (descricao, endereco) VALUES (?, ?)',
                          (produto_limpo, 'SEM ENDEREÇO'))
            adicionados += 1
        else:
            ignorados += 1

        # Mostra progresso a cada 100 produtos
        if idx % 100 == 0:
            print(f'   Processados: {idx}/{len(produtos)}')

    conn.commit()
    conn.close()

    print('\n' + '='*60)
    print('✅ IMPORTAÇÃO CONCLUÍDA!')
    print('='*60)
    print(f'➕ Produtos adicionados: {adicionados}')
    print(f'⏭️  Produtos ignorados (já existem): {ignorados}')
    print(f'📊 Total no banco agora: {adicionados + ignorados}')
    print('='*60)
    print('\n💡 Próximo passo:')
    print('   1. Abra: streamlit run estoque.py')
    print('   2. Vá na aba "GERENCIAR ESTOQUE"')
    print('   3. Cadastre os endereços dos produtos')
    print('='*60)

if __name__ == "__main__":
    try:
        importar_excel()
    except Exception as e:
        print(f'\n❌ Erro: {e}')
        import traceback
        traceback.print_exc()
