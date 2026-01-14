"""
Sistema de Importação em Massa de Produtos - Pauliceia
Importa produtos de arquivos Excel ou CSV para o banco de dados
"""

import pandas as pd
import sqlite3
import os
import sys
from datetime import datetime

# Fix encoding para Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Configurações
DB_NAME = "pauliceia_web.db"
ARQUIVO_IMPORTACAO = "produtos_para_importar.csv"  # ou .xlsx

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
    print("✅ Banco de dados verificado/criado com sucesso!")

def contar_produtos_existentes():
    """Conta quantos produtos já existem no banco"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM produtos")
    total = cursor.fetchone()[0]
    conn.close()
    return total

def limpar_banco():
    """Remove todos os produtos do banco (use com cuidado!)"""
    resposta = input("\n⚠️  ATENÇÃO: Isso vai APAGAR TODOS os produtos do banco!\nDigite 'CONFIRMAR' para continuar: ")
    if resposta == "CONFIRMAR":
        conn = get_db_connection()
        conn.execute("DELETE FROM produtos")
        conn.commit()
        conn.close()
        print("✅ Banco limpo com sucesso!")
        return True
    else:
        print("❌ Operação cancelada.")
        return False

def ler_arquivo(caminho_arquivo):
    """Lê arquivo Excel ou CSV e retorna DataFrame"""
    try:
        if caminho_arquivo.endswith('.csv'):
            df = pd.read_csv(caminho_arquivo)
            print(f"✅ Arquivo CSV lido com sucesso!")
        elif caminho_arquivo.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(caminho_arquivo)
            print(f"✅ Arquivo Excel lido com sucesso!")
        else:
            print("❌ Formato de arquivo não suportado! Use .csv, .xlsx ou .xls")
            return None

        return df
    except FileNotFoundError:
        print(f"❌ Arquivo '{caminho_arquivo}' não encontrado!")
        return None
    except Exception as e:
        print(f"❌ Erro ao ler arquivo: {e}")
        return None

def validar_dados(df):
    """Valida os dados do DataFrame antes de importar"""
    print("\n🔍 Validando dados...")

    # Verifica se as colunas existem
    colunas_necessarias = ['descricao', 'endereco']
    colunas_faltando = [col for col in colunas_necessarias if col not in df.columns]

    if colunas_faltando:
        # Tenta encontrar colunas similares (case insensitive)
        df.columns = df.columns.str.lower().str.strip()
        colunas_faltando = [col for col in colunas_necessarias if col not in df.columns]

        if colunas_faltando:
            print(f"❌ Colunas faltando no arquivo: {', '.join(colunas_faltando)}")
            print(f"   Colunas encontradas: {', '.join(df.columns)}")
            return None

    # Remove linhas vazias
    df = df.dropna(subset=['descricao'])

    # Preenche endereços vazios com "SEM ENDEREÇO"
    df['endereco'] = df['endereco'].fillna('SEM ENDEREÇO')

    # Converte tudo para maiúsculas e remove espaços extras
    df['descricao'] = df['descricao'].astype(str).str.upper().str.strip()
    df['endereco'] = df['endereco'].astype(str).str.upper().str.strip()

    # Remove duplicatas
    duplicatas_antes = len(df)
    df = df.drop_duplicates(subset=['descricao'], keep='first')
    duplicatas_removidas = duplicatas_antes - len(df)

    if duplicatas_removidas > 0:
        print(f"⚠️  {duplicatas_removidas} produto(s) duplicado(s) removido(s)")

    print(f"✅ {len(df)} produto(s) válido(s) para importação")

    return df

def verificar_duplicatas_banco(df):
    """Verifica se já existem produtos com as mesmas descrições no banco"""
    conn = get_db_connection()
    cursor = conn.cursor()

    duplicatas = []
    for _, row in df.iterrows():
        cursor.execute("SELECT id, descricao, endereco FROM produtos WHERE descricao = ?",
                      (row['descricao'],))
        resultado = cursor.fetchone()
        if resultado:
            duplicatas.append({
                'descricao': row['descricao'],
                'endereco_novo': row['endereco'],
                'endereco_existente': resultado[2]
            })

    conn.close()
    return duplicatas

def importar_produtos(df, modo='adicionar'):
    """
    Importa produtos para o banco de dados

    Modos:
    - 'adicionar': Adiciona apenas produtos novos, ignora duplicatas
    - 'atualizar': Atualiza produtos existentes e adiciona novos
    - 'substituir': Remove tudo e importa do zero
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    adicionados = 0
    atualizados = 0
    ignorados = 0

    print(f"\n📦 Iniciando importação em modo '{modo}'...")

    for idx, row in df.iterrows():
        descricao = row['descricao']
        endereco = row['endereco']

        # Verifica se já existe
        cursor.execute("SELECT id FROM produtos WHERE descricao = ?", (descricao,))
        existe = cursor.fetchone()

        if existe:
            if modo == 'atualizar':
                cursor.execute("UPDATE produtos SET endereco = ? WHERE descricao = ?",
                             (endereco, descricao))
                atualizados += 1
            else:
                ignorados += 1
        else:
            cursor.execute("INSERT INTO produtos (descricao, endereco) VALUES (?, ?)",
                         (descricao, endereco))
            adicionados += 1

        # Mostra progresso a cada 50 produtos
        if (idx + 1) % 50 == 0:
            print(f"   Processados: {idx + 1}/{len(df)}")

    conn.commit()
    conn.close()

    print("\n" + "="*60)
    print("✅ IMPORTAÇÃO CONCLUÍDA!")
    print("="*60)
    print(f"➕ Produtos adicionados: {adicionados}")
    if modo == 'atualizar':
        print(f"🔄 Produtos atualizados: {atualizados}")
    if ignorados > 0:
        print(f"⏭️  Produtos ignorados (já existem): {ignorados}")
    print("="*60)

def mostrar_preview(df, linhas=10):
    """Mostra preview dos dados que serão importados"""
    print("\n" + "="*60)
    print(f"📋 PREVIEW DOS DADOS (primeiras {min(linhas, len(df))} linhas):")
    print("="*60)
    print(df.head(linhas).to_string(index=False))
    print("="*60)

def menu_principal():
    """Menu interativo principal"""
    print("\n" + "="*60)
    print("🏭 SISTEMA DE IMPORTAÇÃO DE PRODUTOS - PAULICEIA")
    print("="*60)

    verificar_banco()
    total_existentes = contar_produtos_existentes()
    print(f"📊 Produtos atualmente no banco: {total_existentes}")

    # Solicita o arquivo
    print("\n📁 Qual arquivo deseja importar?")
    print("   (Pressione ENTER para usar 'produtos_para_importar.xlsx')")
    arquivo = input("   Caminho do arquivo: ").strip()

    if not arquivo:
        arquivo = ARQUIVO_IMPORTACAO

    # Lê o arquivo
    df = ler_arquivo(arquivo)
    if df is None:
        return

    # Valida os dados
    df = validar_dados(df)
    if df is None:
        return

    # Mostra preview
    mostrar_preview(df)

    # Verifica duplicatas
    duplicatas = verificar_duplicatas_banco(df)
    if duplicatas:
        print(f"\n⚠️  ATENÇÃO: {len(duplicatas)} produto(s) já existe(m) no banco!")
        print("\nPrimeiros 5 exemplos:")
        for dup in duplicatas[:5]:
            print(f"   • {dup['descricao']}")
            print(f"     Endereço no banco: {dup['endereco_existente']}")
            print(f"     Endereço no arquivo: {dup['endereco_novo']}")

    # Menu de opções
    print("\n" + "="*60)
    print("O QUE DESEJA FAZER?")
    print("="*60)
    print("1 - Adicionar apenas produtos novos (ignora duplicatas)")
    print("2 - Atualizar produtos existentes e adicionar novos")
    print("3 - LIMPAR banco e importar tudo do zero")
    print("0 - Cancelar")
    print("="*60)

    opcao = input("\nEscolha uma opção: ").strip()

    if opcao == '1':
        importar_produtos(df, modo='adicionar')
    elif opcao == '2':
        importar_produtos(df, modo='atualizar')
    elif opcao == '3':
        if limpar_banco():
            importar_produtos(df, modo='adicionar')
    elif opcao == '0':
        print("❌ Operação cancelada.")
    else:
        print("❌ Opção inválida!")

    print("\n✅ Processo finalizado!")

if __name__ == "__main__":
    try:
        menu_principal()
    except KeyboardInterrupt:
        print("\n\n❌ Operação cancelada pelo usuário.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        sys.exit(1)
