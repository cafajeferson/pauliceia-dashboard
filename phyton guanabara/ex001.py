import streamlit as st
import pandas as pd
import sqlite3
import matplotlib.pyplot as plt
import os
import re
from PIL import Image
from io import BytesIO

# === CONFIGURAÇÃO DA PÁGINA ===
st.set_page_config(
    page_title="Pauliceia - Análise de Vendas",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# === ESTILOS CSS (PARA CORRIGIR CORES E LOGO) ===
st.markdown("""
    <style>
        .block-container {padding-top: 1rem;}
        h1 {color: #2c3e50;}
        .stMetric {background-color: #f0f2f6; padding: 10px; border-radius: 10px;}
    </style>
""", unsafe_allow_html=True)

# === BANCO DE DADOS ===
if 'conn' not in st.session_state:
    st.session_state.conn = sqlite3.connect("pauliceia_web.db", check_same_thread=False)

def init_db():
    conn = st.session_state.conn
    conn.execute('CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT UNIQUE)')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS vendas (
            id INTEGER PRIMARY KEY,
            cliente_id INTEGER,
            arquivo_origem TEXT,
            mes_ref TEXT,
            produto TEXT,
            quantidade INTEGER,
            FOREIGN KEY(cliente_id) REFERENCES clientes(id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS essenciais (
            id INTEGER PRIMARY KEY,
            cliente_id INTEGER,
            produto TEXT,
            FOREIGN KEY(cliente_id) REFERENCES clientes(id),
            UNIQUE(cliente_id, produto)
        )
    ''')
    conn.commit()

init_db()

# === FUNÇÕES DE LÓGICA ===
def get_clientes():
    res = st.session_state.conn.execute("SELECT nome FROM clientes ORDER BY nome").fetchall()
    return [r[0] for r in res]

def get_dados(cliente_nome):
    res = st.session_state.conn.execute("SELECT id FROM clientes WHERE nome = ?", (cliente_nome,)).fetchone()
    if not res: return None
    cliente_id = res[0]
    
    df = pd.read_sql_query("SELECT * FROM vendas WHERE cliente_id = ?", st.session_state.conn, params=(cliente_id,))
    if df.empty: return None
    
    # Pivotar
    df_pivot = df.pivot_table(index='produto', columns='mes_ref', values='quantidade', aggfunc='sum', fill_value=0)
    
    # Ordenar colunas de meses
    cols_meses = sorted(df_pivot.columns)
    df_pivot = df_pivot[cols_meses]
    df_pivot['TOTAL'] = df_pivot.sum(axis=1)
    
    return df_pivot.sort_index(), cols_meses, cliente_id

def colorir_tabela(val):
    return f'color: black' # Padrão, a lógica complexa vai no apply map abaixo

def estilo_linha(row, cols_meses):
    estilos = [''] * len(row)
    # Lógica de comparação mês a mês
    for i, col in enumerate(cols_meses):
        idx_col = row.index.get_loc(col)
        if i > 0:
            anterior = row[cols_meses[i-1]]
            atual = row[col]
            if atual > anterior:
                estilos[idx_col] = 'color: blue; font-weight: bold;'
            elif atual < anterior:
                estilos[idx_col] = 'color: red; font-weight: bold;'
            else:
                estilos[idx_col] = 'color: orange;'
    return estilos

# === SIDEBAR (MENU LATERAL) ===
with st.sidebar:
    # Logo
    if os.path.exists("logo.png"):
        st.image("logo.png", width=150)
    
    st.title("Pauliceia Vendas")
    
    # Seleção de Cliente
    clientes = get_clientes()
    if not clientes:
        st.warning("Cadastre um cliente primeiro.")
    
    cliente_selecionado = st.selectbox("👤 Selecione o Cliente:", ["Selecione..."] + clientes)
    
    # Novo Cliente
    with st.expander("➕ Cadastrar Novo Cliente"):
        novo_nome = st.text_input("Nome do Cliente")
        if st.button("Salvar Cliente"):
            try:
                st.session_state.conn.execute("INSERT INTO clientes (nome) VALUES (?)", (novo_nome.upper(),))
                st.session_state.conn.commit()
                st.rerun()
            except:
                st.error("Cliente já existe.")

    st.markdown("---")
    
    # Upload
    if cliente_selecionado != "Selecione...":
        st.subheader("📂 Importar Arquivos")
        uploaded_files = st.file_uploader("Arraste os CSVs aqui", accept_multiple_files=True, type="csv")
        
        if st.button("Processar Arquivos") and uploaded_files:
            res_id = st.session_state.conn.execute("SELECT id FROM clientes WHERE nome = ?", (cliente_selecionado,)).fetchone()
            c_id = res_id[0]
            
            count = 0
            bar = st.progress(0)
            for i, arquivo in enumerate(uploaded_files):
                nome_arq = arquivo.name
                # Tenta achar mês no nome
                num = int(re.search(r'\d+', nome_arq).group()) if re.search(r'\d+', nome_arq) else 0
                mes_ref = f"Mês {num:02d}" if num > 0 else nome_arq
                
                try:
                    df = pd.read_csv(arquivo, sep=';', encoding='latin1')
                    cols = {c.lower(): c for c in df.columns}
                    col_prod = next((v for k,v in cols.items() if "descri" in k), None)
                    col_qtd = next((v for k,v in cols.items() if "quantidade" in k or "qtd" in k), None)
                    
                    if col_prod and col_qtd:
                        st.session_state.conn.execute("DELETE FROM vendas WHERE cliente_id=? AND mes_ref=?", (c_id, mes_ref))
                        for _, row in df.iterrows():
                            p = str(row[col_prod]).strip()
                            if not p or p.lower()=='nan': continue
                            try: q = int(float(str(row[col_qtd]).replace(",", ".").replace(" ", "")))
                            except: q = 0
                            if q > 0: 
                                st.session_state.conn.execute("INSERT INTO vendas (cliente_id, arquivo_origem, mes_ref, produto, quantidade) VALUES (?,?,?,?,?)", (c_id, nome_arq, mes_ref, p, q))
                        count += 1
                except Exception as e:
                    st.error(f"Erro em {nome_arq}: {e}")
                bar.progress((i+1)/len(uploaded_files))
            
            st.session_state.conn.commit()
            st.success(f"{count} arquivos importados!")
            st.rerun()

    # Limpar Dados
    if cliente_selecionado != "Selecione...":
        if st.button("🗑️ Limpar Dados deste Cliente", type="primary"):
            res_id = st.session_state.conn.execute("SELECT id FROM clientes WHERE nome = ?", (cliente_selecionado,)).fetchone()
            st.session_state.conn.execute("DELETE FROM vendas WHERE cliente_id = ?", (res_id[0],))
            st.session_state.conn.execute("DELETE FROM essenciais WHERE cliente_id = ?", (res_id[0],))
            st.session_state.conn.commit()
            st.rerun()

# === ÁREA PRINCIPAL ===
if cliente_selecionado != "Selecione...":
    dados = get_dados(cliente_selecionado)
    
    if dados:
        df, cols_meses, c_id = dados
        
        # KPI Topo
        total_geral = int(df['TOTAL'].sum())
        col1, col2, col3 = st.columns(3)
        col1.metric("Volume Total de Peças", f"{total_geral:,}".replace(",", "."))
        col2.metric("Itens Cadastrados", len(df))
        col3.markdown("### 🔵 Azul: Cresceu | 🔴 Vermelho: Caiu")

        # Abas
        tab1, tab2, tab3, tab4 = st.tabs(["📊 Matriz Geral", "⭐ Essenciais", "🧠 Relatório Inteligente", "💬 Chat"])

        # --- ABA 1: MATRIZ ---
        with tab1:
            st.subheader("Análise Mês a Mês")
            texto_busca = st.text_input("🔍 Buscar produto na tabela:", "")
            
            df_show = df
            if texto_busca:
                df_show = df[df.index.str.lower().str.contains(texto_busca.lower())]

            # Aplicação de Estilo Condicional (Pandas Styler)
            def highlight_vals(row):
                styles = [''] * len(row)
                for i, col in enumerate(cols_meses):
                    idx = row.index.get_loc(col)
                    if i > 0:
                        prev = row[cols_meses[i-1]]
                        curr = row[col]
                        if curr > prev: styles[idx] = 'color: blue; font-weight: bold'
                        elif curr < prev: styles[idx] = 'color: red; font-weight: bold'
                        else: styles[idx] = 'color: #DAA520' # Dark Golden Rod
                return styles

            st.dataframe(df_show.style.apply(highlight_vals, axis=1), height=500, use_container_width=True)

        # --- ABA 2: ESSENCIAIS ---
        with tab2:
            st.subheader("Gerenciar Produtos Essenciais")
            
            # Adicionar/Remover
            col_sel, col_btn = st.columns([3, 1])
            prod_sel = col_sel.selectbox("Escolha um produto para favoritar:", df.index)
            
            if col_btn.button("⭐ Adicionar/Remover"):
                exists = st.session_state.conn.execute("SELECT * FROM essenciais WHERE cliente_id=? AND produto=?", (c_id, prod_sel)).fetchone()
                if exists:
                    st.session_state.conn.execute("DELETE FROM essenciais WHERE cliente_id=? AND produto=?", (c_id, prod_sel))
                    st.toast(f"{prod_sel} removido!", icon="❌")
                else:
                    st.session_state.conn.execute("INSERT INTO essenciais (cliente_id, produto) VALUES (?,?)", (c_id, prod_sel))
                    st.toast(f"{prod_sel} adicionado!", icon="✅")
                st.session_state.conn.commit()
                st.rerun()

            # Mostrar Tabela Essenciais
            res_ess = st.session_state.conn.execute("SELECT produto FROM essenciais WHERE cliente_id=?", (c_id,)).fetchall()
            lista_ess = [r[0] for r in res_ess]
            
            if lista_ess:
                df_ess = df[df.index.isin(lista_ess)]
                st.dataframe(df_ess.style.apply(highlight_vals, axis=1), use_container_width=True)
            else:
                st.info("Nenhum produto marcado como essencial ainda.")

        # --- ABA 3: RELATÓRIO INTELIGENTE ---
        with tab3:
            st.subheader("Dossiê do Cliente")
            
            if len(cols_meses) >= 2:
                col_graph, col_txt = st.columns([1, 1])
                
                with col_graph:
                    # Gráfico
                    fig, ax = plt.subplots(figsize=(6, 4))
                    tempo = df[cols_meses].sum()
                    ax.plot(tempo.index, tempo.values, marker='o', linestyle='-', color='#3498db')
                    ax.set_title("Tendência de Volume Total")
                    ax.grid(True, linestyle='--', alpha=0.5)
                    plt.xticks(rotation=45)
                    st.pyplot(fig)

                with col_txt:
                    # Texto Automático
                    ini = df[cols_meses[0]].sum()
                    fim = df[cols_meses[-1]].sum()
                    status = "CRESCIMENTO 🚀" if fim >= ini else "QUEDA 📉"
                    
                    st.markdown(f"### Situação: {status}")
                    st.write(f"Começou com **{int(ini)}** peças e terminou com **{int(fim)}**.")
                    
                    st.markdown("#### Top 3 Quedas Recentes:")
                    df['diff'] = df[cols_meses[-1]] - df[cols_meses[-2]]
                    quedas = df.sort_values('diff', ascending=True).head(3)
                    for p, r in quedas.iterrows():
                        if r['diff'] < 0:
                            st.write(f"🔴 **{p}**: Caiu {int(abs(r['diff']))} un.")
                    
                    st.markdown("#### Top 3 Crescimento:")
                    altas = df.sort_values('diff', ascending=False).head(3)
                    for p, r in altas.iterrows():
                        if r['diff'] > 0:
                            st.write(f"🔵 **{p}**: +{int(r['diff'])} un.")

            else:
                st.warning("Importe pelo menos 2 meses para gerar o relatório.")

        # --- ABA 4: CHAT NATIVO ---
        with tab4:
            st.subheader("Chat Pauliceia")
            
            # Inicializa histórico
            if "messages" not in st.session_state:
                st.session_state.messages = []

            # Mostra mensagens antigas
            for message in st.session_state.messages:
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])

            # Input do usuário
            if prompt := st.chat_input("Pergunte algo (Ex: 'qual o total', 'melhor produto', 'parafuso')"):
                st.session_state.messages.append({"role": "user", "content": prompt})
                with st.chat_message("user"):
                    st.markdown(prompt)

                # Lógica do Robô
                p = prompt.lower()
                resp = "Não entendi. Tente perguntar sobre 'total', 'melhor' ou o nome de um item."
                
                try:
                    if 'total' in p: resp = f"O volume total vendido foi de **{int(df['TOTAL'].sum())}** peças."
                    elif 'melhor' in p or 'top' in p:
                        top = df.sort_values('TOTAL', ascending=False).head(3)
                        resp = "🏆 **Top 3 Produtos:**\n\n" + "\n".join([f"- {i}: {int(row['TOTAL'])}" for i, row in top.iterrows()])
                    elif 'pior' in p or 'queda' in p:
                        df['temp'] = df[cols_meses[-1]] - df[cols_meses[-2]] if len(cols_meses) > 1 else 0
                        pior = df.sort_values('temp', ascending=True).head(3)
                        resp = "📉 **Maiores Quedas Recentes:**\n\n" + "\n".join([f"- {i}: {int(row['temp'])}" for i, row in pior.iterrows()])
                    else:
                        # Busca por nome
                        matches = df[df.index.str.lower().str.contains(p)]
                        if not matches.empty:
                            resp = f"Encontrei **{len(matches)}** itens:\n\n"
                            for i, row in matches.head(5).iterrows():
                                hist = " ➝ ".join([str(int(row[c])) for c in cols_meses])
                                resp += f"📦 **{i}**\n   Histórico: {hist} | Total: {int(row['TOTAL'])}\n\n"
                        else:
                            resp = "Não encontrei nenhum produto com esse nome."
                except Exception as e:
                    resp = f"Erro ao processar: {e}"

                st.session_state.messages.append({"role": "assistant", "content": resp})
                with st.chat_message("assistant"):
                    st.markdown(resp)

    else:
        st.info("👈 Selecione um cliente e importe as planilhas no menu lateral.")
else:
    st.info("👈 Comece selecionando ou cadastrando um cliente no menu lateral.")