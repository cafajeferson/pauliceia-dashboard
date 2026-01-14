import streamlit as st
import pandas as pd
import sqlite3
import re
import time
import textwrap

# --- Configuração da Página ---
st.set_page_config(page_title="Pauliceia - Impressão", layout="wide")

# --- ESTILO VISUAL (CSS CORRIGIDO PARA COBRIR TUDO NA IMPRESSÃO) ---
st.markdown("""
    <style>
    /* ============================================================
       CSS DE IMPRESSÃO - MÉTODO "COBRIR TUDO"
    ============================================================ */
    @media print {
        /* 1. Configura a folha A4 com margem zero para aproveitamento total */
        @page {
            margin: 0;
            size: A4;
        }

        /* 2. Esconde explicitamente os menus e cabeçalhos do Streamlit */
        header, footer, aside, .stAppHeader, .stSidebar, .stHeader, div[data-testid="stHeader"] {
            display: none !important;
        }

        /* 3. O SEGREDO: Em vez de esconder o body, forçamos o relatório a ser
             um bloco fixo que ocupa 100% da tela e tem fundo branco opaco.
             Isso "tampa" qualquer coisa que esteja atrás. */
        .folha-impressao {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;  /* Largura total da visão */
            height: 100vh !important; /* Altura total da visão */
            background-color: white !important;
            z-index: 999999 !important; /* Garante que fique acima de tudo */
            padding: 1cm !important; /* Margem interna segura */
            margin: 0 !important;
            display: block !important;
            visibility: visible !important;
        }

        /* 4. Garante que todo o conteúdo DENTRO do relatório seja visível e preto */
        .folha-impressao * {
            visibility: visible !important;
            color: black !important;
            display: block; /* Garante renderização de blocos */
        }
        
        /* Ajuste fino para tabelas */
        .folha-impressao table {
            display: table !important;
            width: 100% !important;
        }
        .folha-impressao tr { display: table-row !important; }
        .folha-impressao td, .folha-impressao th { display: table-cell !important; }
    }
    
    /* ============================================================
       ESTILO DA FOLHA NA TELA (Visualização normal)
    ============================================================ */
    .folha-impressao {
        background-color: white;
        padding: 20px;
        border: 1px solid #ccc;
        color: black !important;
        font-family: Arial, sans-serif;
        margin-bottom: 20px;
        max-width: 210mm;
        margin-left: auto;
        margin-right: auto;
    }
    
    .header-relatorio {
        border-bottom: 2px solid black;
        padding-bottom: 10px;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .tabela-pedido {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
    }
    
    .tabela-pedido th {
        background-color: #f0f0f0;
        border: 1px solid black !important;
        padding: 6px;
        text-align: left;
        font-weight: bold;
        color: black;
        -webkit-print-color-adjust: exact;
    }
    
    .tabela-pedido td {
        border: 1px solid black !important;
        padding: 6px;
        color: black;
        vertical-align: middle;
    }
    
    .alerta-sem-endereco {
        background-color: #ffcccc !important;
        -webkit-print-color-adjust: exact;
    }
    </style>
""", unsafe_allow_html=True)

# --- BANCO DE DADOS ---
def get_db_connection():
    return sqlite3.connect("pauliceia_web.db", check_same_thread=False)

def init_db():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            descricao TEXT NOT NULL,
            endereco TEXT
        )
    """)
    conn.close()

init_db()

# --- FUNÇÕES ---
def cadastrar_produto(descricao, endereco):
    conn = get_db_connection()
    conn.execute("INSERT INTO produtos (descricao, endereco) VALUES (?, ?)", 
                 (descricao.upper().strip(), endereco.upper().strip()))
    conn.commit()
    conn.close()

def excluir_produto(id_produto):
    conn = get_db_connection()
    conn.execute("DELETE FROM produtos WHERE id = ?", (id_produto,))
    conn.commit()
    conn.close()

def atualizar_produto(id_produto, descricao, endereco):
    conn = get_db_connection()
    conn.execute("UPDATE produtos SET descricao = ?, endereco = ? WHERE id = ?",
                 (descricao.upper().strip(), endereco.upper().strip(), id_produto))
    conn.commit()
    conn.close()

def listar_produtos(filtro=""):
    conn = get_db_connection()
    query = "SELECT id, descricao, endereco FROM produtos"
    if filtro:
        query += " WHERE descricao LIKE ?"
        df = pd.read_sql(query, conn, params=(f'%{filtro}%',))
    else:
        df = pd.read_sql(query, conn)
    conn.close()
    return df

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split('([0-9]+)', s['end'])]

# --- INTERFACE ---
st.title("🏭 Pauliceia - Sistema de Estoque")

aba1, aba2 = st.tabs(["🖨️ IMPRESSÃO DE PEDIDO", "🔍 GERENCIAR ESTOQUE"])

# ==============================================================================
# ABA 1: IMPRESSÃO
# ==============================================================================
with aba1:
    st.markdown("#### 1. Dados do Pedido")
    col1, col2 = st.columns([1, 2])
    cliente = col1.text_input("Nome do Cliente", placeholder="Ex: JOÃO PINTURAS")
    
    texto_padrao = """1,00 PRIMER 8200 CINZA
1,00 CATALISADOR 8110
10,00 LIXA P400
1,00 RUA 2
1,00 RUA 10"""
    pedido_raw = col2.text_area("Cole a lista aqui", height=100, placeholder=texto_padrao, label_visibility="collapsed")

    if st.button("📄 GERAR RELATÓRIO", type="primary"):
        if not cliente:
            st.warning("⚠️ Digite o nome do cliente!")
        else:
            # PROCESSAMENTO
            linhas = pedido_raw.split('\n')
            lista_final = []
            conn = get_db_connection()
            cursor = conn.cursor()

            for linha in linhas:
                linha = linha.strip()
                if not linha or ("qtde" in linha.lower() and "descrição" in linha.lower()):
                    continue
                
                match = re.search(r'^([\d,.]+)\s+(.+)$', linha)
                if match:
                    qtd, nome = match.group(1), match.group(2).strip()
                else:
                    qtd, nome = "1,00", linha
                
                cursor.execute("SELECT endereco FROM produtos WHERE descricao = ?", (nome,))
                res = cursor.fetchone()
                if not res:
                    cursor.execute("SELECT endereco FROM produtos WHERE descricao LIKE ?", (f'%{nome}%',))
                    res = cursor.fetchone()
                
                end = res[0] if res else "SEM ENDEREÇO"
                lista_final.append({'qtd': qtd, 'nome': nome, 'end': end})
            
            conn.close()

            # ORDENAÇÃO
            def sort_logic(item):
                end = item['end']
                if end == "SEM ENDEREÇO":
                    return (1, end)
                return (0, natural_sort_key(item))
            
            lista_final.sort(key=sort_logic)

            # --- MONTAGEM DO HTML ---
            linhas_html = ""
            for item in lista_final:
                classe_tr = 'class="alerta-sem-endereco"' if item['end'] == "SEM ENDEREÇO" else ""
                linhas_html += f'<tr {classe_tr}><td style="text-align: center;">{item["qtd"]}</td><td>{item["nome"]}</td><td style="font-weight: bold;">{item["end"]}</td><td style="text-align: center; font-weight: bold;">[ &nbsp; ]</td></tr>'

            data_hoje = time.strftime('%d/%m/%Y')
            
            # HTML COMPACTADO (USANDO DEDENT)
            html_relatorio = textwrap.dedent(f"""
            <div class="folha-impressao">
                <div class="header-relatorio">
                    <h2 style="margin: 0; font-size: 24px;">📋 PEDIDO DE SEPARAÇÃO</h2>
                    <div style="text-align: right; font-size: 14px;">Data: {data_hoje}</div>
                </div>
                <div style="margin-bottom: 15px; font-size: 16px;">
                    CLIENTE: <strong style="font-size: 18px;">{cliente.upper()}</strong>
                </div>
                <table class="tabela-pedido">
                    <thead>
                        <tr>
                            <th style="width: 10%; text-align: center;">QTD</th>
                            <th style="width: 55%;">DESCRIÇÃO DO PRODUTO</th>
                            <th style="width: 25%;">ENDEREÇO</th>
                            <th style="width: 10%; text-align: center;">CONF.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {linhas_html}
                    </tbody>
                </table>
                <div style="margin-top: 30px; text-align: center; font-size: 12px; color: gray;">
                    Conferido por: ____________________________________
                </div>
            </div>
            """)
            
            st.divider()
            st.markdown(html_relatorio, unsafe_allow_html=True)
            st.success("✅ Relatório pronto! Pressione Ctrl + P para imprimir.")

# ==============================================================================
# ABA 2: GERENCIAR ESTOQUE
# ==============================================================================
with aba2:
    st.subheader("Gerenciar Produtos")
    with st.expander("➕ Cadastrar Novo"):
        c1, c2, c3 = st.columns([3, 2, 1])
        n_nome = c1.text_input("Nome")
        n_end = c2.text_input("Endereço (Ex: RUA 1.A.2)")
        if c3.button("Salvar"):
            if n_nome and n_end:
                cadastrar_produto(n_nome, n_end)
                st.success("Cadastrado!")
                time.sleep(0.5); st.rerun()
    
    st.divider()
    busca = st.text_input("🔍 Pesquisar no Estoque")
    df = listar_produtos(busca)
    
    if not df.empty:
        c1, c2, c3 = st.columns([4, 2, 2])
        c1.markdown("**DESCRIÇÃO**"); c2.markdown("**ENDEREÇO**"); c3.markdown("**AÇÕES**")
        st.markdown("<hr style='margin: 5px 0'>", unsafe_allow_html=True)

        for idx, row in df.iterrows():
            with st.container():
                c1, c2, c3 = st.columns([4, 2, 2])

                # Verifica se está em modo de edição
                if f"edit_{row['id']}" in st.session_state and st.session_state[f"edit_{row['id']}"]:
                    # Modo de edição
                    nova_descricao = c1.text_input("", value=row['descricao'], key=f"desc_{row['id']}", label_visibility="collapsed")
                    novo_endereco = c2.text_input("", value=row['endereco'], key=f"end_{row['id']}", label_visibility="collapsed")

                    col_salvar, col_cancelar = c3.columns(2)
                    if col_salvar.button("✅", key=f"save_{row['id']}", help="Salvar"):
                        atualizar_produto(row['id'], nova_descricao, novo_endereco)
                        st.session_state[f"edit_{row['id']}"] = False
                        st.success("Produto atualizado!")
                        time.sleep(0.3)
                        st.rerun()
                    if col_cancelar.button("❌", key=f"cancel_{row['id']}", help="Cancelar"):
                        st.session_state[f"edit_{row['id']}"] = False
                        st.rerun()
                else:
                    # Modo de visualização
                    c1.text(row['descricao'])
                    c2.text(row['endereco'])

                    col_editar, col_excluir = c3.columns(2)
                    if col_editar.button("✏️", key=f"edit_btn_{row['id']}", help="Editar"):
                        st.session_state[f"edit_{row['id']}"] = True
                        st.rerun()
                    if col_excluir.button("🗑️", key=f"del_{row['id']}", help="Excluir"):
                        excluir_produto(row['id'])
                        st.rerun()

                st.markdown("<hr style='margin:0; opacity:0.1'>", unsafe_allow_html=True)