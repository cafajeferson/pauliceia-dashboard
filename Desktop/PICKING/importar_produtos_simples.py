"""
Importador Simples de Produtos - Apenas Descrições
Importa produtos SEM endereço, para você adicionar depois no site
"""

import sqlite3
import sys

# Fix encoding para Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

DB_NAME = "pauliceia_web.db"

def get_db_connection():
    """Conecta ao banco de dados"""
    return sqlite3.connect(DB_NAME, check_same_thread=False)

def verificar_banco():
    """Verifica se o banco de dados existe e cria a tabela se necessário"""
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL,
            endereco TEXT
        )
    """)
    conn.commit()
    conn.close()

def importar_produtos_txt(arquivo_txt):
    """
    Importa produtos de um arquivo .txt
    Cada linha = 1 produto
    Endereço será cadastrado como "SEM ENDEREÇO"
    """
    verificar_banco()

    try:
        with open(arquivo_txt, 'r', encoding='utf-8') as f:
            linhas = f.readlines()
    except FileNotFoundError:
        print(f"❌ Arquivo '{arquivo_txt}' não encontrado!")
        return
    except Exception as e:
        print(f"❌ Erro ao ler arquivo: {e}")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    adicionados = 0
    ignorados = 0
    duplicatas = []

    print(f"\n📦 Processando {len(linhas)} produtos...")
    print("="*60)

    for linha in linhas:
        descricao = linha.strip().upper()

        # Pula linhas vazias
        if not descricao:
            continue

        # Verifica se já existe
        cursor.execute("SELECT id, endereco FROM produtos WHERE descricao = ?", (descricao,))
        existe = cursor.fetchone()

        if existe:
            ignorados += 1
            duplicatas.append(f"  • {descricao} (já existe com endereço: {existe[1]})")
        else:
            cursor.execute("INSERT INTO produtos (descricao, endereco) VALUES (?, ?)",
                         (descricao, "SEM ENDEREÇO"))
            adicionados += 1

    conn.commit()
    conn.close()

    # Resultado
    print("\n" + "="*60)
    print("✅ IMPORTAÇÃO CONCLUÍDA!")
    print("="*60)
    print(f"➕ Produtos adicionados: {adicionados}")
    if ignorados > 0:
        print(f"⏭️  Produtos ignorados (já existem): {ignorados}")
        if duplicatas:
            print("\nPrimeiros 10 duplicados:")
            for dup in duplicatas[:10]:
                print(dup)
    print("="*60)
    print("\n💡 Próximo passo:")
    print("   1. Abra o sistema: streamlit run estoque.py")
    print("   2. Vá na aba 'GERENCIAR ESTOQUE'")
    print("   3. Cadastre os endereços dos produtos")
    print("="*60)

if __name__ == "__main__":
    print("="*60)
    print("📦 IMPORTADOR SIMPLES DE PRODUTOS - PAULICEIA")
    print("="*60)
    print("\nEste script importa produtos SEM endereço.")
    print("Você cadastra os endereços depois pelo site.\n")

    # Solicita o arquivo
    print("📁 Digite o nome do arquivo .txt com os produtos")
    print("   (1 produto por linha)")
    print("   (Pressione ENTER para usar 'lista_produtos.txt')")
    arquivo = input("\n   Arquivo: ").strip()

    if not arquivo:
        arquivo = "lista_produtos.txt"

    importar_produtos_txt(arquivo)
