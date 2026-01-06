import streamlit as st
import pandas as pd
import sqlite3
import matplotlib.pyplot as plt
import os
import re

# === CONFIGURAÇÃO DA PÁGINA ===
st.set_page_config(
    page_title="Pauliceia - Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# === ESTILOS CSS ===
st.markdown("""
    <style>
        .main .block-container { padding-top: 2rem !important; padding-bottom: 5rem; max-width: 95% !important; }
        h1, h2, h3 { color: #0E4E8E; font-weight: 700 !important; }
        
        /* Cards KPI */
        [data-testid="stMetric"] {
            background-color: #1e2130;
            border: 1px solid #444;
            padding: 15px; 
            border-radius: 10px;
        }
        
        /* Ajuste de tabela */
        .stDataFrame { border-radius: 10px; overflow: hidden; }
    </style>
""", unsafe_allow_html=True)

# === BANCO DE DADOS ===
def get_connection():
    return sqlite3.connect("pauliceia_web.db", check_same_thread=False)

def init_db():
    conn = get_connection()
    conn.execute('CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT UNIQUE)')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS vendas (
            id INTEGER PRIMARY KEY,
            cliente_id INTEGER,
            arquivo_origem TEXT,
            mes_ref TEXT,
            produto TEXT,
            quantidade INTEGER,
            valor REAL,
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
    conn.close()

init_db()

# === LÓGICA PRINCIPAL ===
def get_dados_cliente(nome_cliente):
    conn = get_connection()
    # Pega ID
    res = conn.execute("SELECT id FROM clientes WHERE nome = ?", (nome_cliente,)).fetchone()
    if not res: 
        conn.close()
        return None, None, None, None
    
    cid = res[0]
    # Pega Vendas
    df = pd.read_sql_query("SELECT * FROM vendas WHERE cliente_id = ?", conn, params=(cid,))
    conn.close()
    
    if df.empty: return None, None, cid, None
    
    # 1. Monta Matriz (Linhas=Produtos, Colunas=Meses, Valores=Qtd)
    df_pivot = df.pivot_table(index='produto', columns='mes_ref', values='quantidade', aggfunc='sum', fill_value=0)
    
    # 2. Calcula Totais em Dinheiro para o Cabeçalho
    totais_valor = df.groupby('mes_ref')['valor'].sum()
    
    # 3. Renomeia Colunas (Mês -> Mês + Valor)
    mapa_colunas = {}
    cols_ordenadas = sorted(df_pivot.columns)
    
    for col in cols_ordenadas:
        val = totais_valor.get(col, 0)
        val_fmt = f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        mapa_colunas[col] = f"{col}\n({val_fmt})"
    
    df_pivot = df_pivot[cols_ordenadas]
    df_pivot.rename(columns=mapa_colunas, inplace=True)
    
    # 4. Cria coluna de Ordenação (QTD TOTAL)
    df_pivot['TOTAL_QTD'] = df_pivot.sum(axis=1)
    
    return df_pivot.sort_index(), list(mapa_colunas.values()), cid, df

# === BARRA LATERAL ===
with st.sidebar:
    if os.path.exists("logo.png"):
        st.image("logo.png", use_column_width=True)
    
    st.title("Menu")
    
    conn = get_connection()
    lista_clientes = [r[0] for r in conn.execute("SELECT nome FROM clientes ORDER BY nome").fetchall()]
    conn.close()
    
    # SELETOR SIMPLIFICADO
    cliente_selecionado = st.selectbox("Selecione o Cliente:", ["Selecione..."] + lista_clientes)

    # Novo Cliente
    with st.expander("Cadastrar Novo Cliente"):
        novo_nome = st.text_input("Nome:").upper()
        if st.button("Salvar") and novo_nome:
            try:
                conn = get_connection()
                conn.execute("INSERT INTO clientes (nome) VALUES (?)", (novo_nome,))
                conn.commit()
                conn.close()
                st.success("Cadastrado!")
                st.rerun()
            except: st.error("Erro ou já existe.")

    # Importação
    if cliente_selecionado != "Selecione...":
        st.divider()
        st.write("📂 **Importação de Dados**")
        upl_files = st.file_uploader("Arraste os CSVs aqui", accept_multiple_files=True)
        
        if st.button("Processar Arquivos", type="primary"):
            if upl_files:
                conn = get_connection()
                cid = conn.execute("SELECT id FROM clientes WHERE nome=?", (cliente_selecionado,)).fetchone()[0]
                
                progresso = st.progress(0)
                
                for i, arq in enumerate(upl_files):
                    try:
                        # Pega número do mês do nome do arquivo
                        num_mes = int(re.search(r'\d+', arq.name).group()) if re.search(r'\d+', arq.name) else 0
                        str_mes = f"Mês {num_mes:02d}" if num_mes > 0 else "Geral"
                        
                        df_temp = pd.read_csv(arq, sep=';', encoding='latin1')
                        cols = {c.lower(): c for c in df_temp.columns}
                        
                        # --- CORREÇÃO DA LEITURA DE COLUNAS ---
                        c_prod = next((v for k,v in cols.items() if "descri" in k), None)
                        c_qtd = next((v for k,v in cols.items() if "qtd" in k or "quant" in k), None)
                        
                        # Lógica INTELIGENTE para achar o Valor de Venda (e fugir do Custo)
                        c_val = None
                        # 1. Prioridade Máxima: "Total" + "Venda" (Ex: Total do preço de venda)
                        c_val = next((v for k,v in cols.items() if "total" in k and "venda" in k), None)
                        # 2. Prioridade Média: "Valor" + "Total"
                        if not c_val:
                            c_val = next((v for k,v in cols.items() if "valor" in k and "total" in k), None)
                        # 3. Fallback: "Total" (mas PROIBIDO ter "custo")
                        if not c_val:
                            c_val = next((v for k,v in cols.items() if "total" in k and "custo" not in k), None)
                        # 4. Último caso: Qualquer "Valor" (sem custo/unit)
                        if not c_val:
                            c_val = next((v for k,v in cols.items() if ("valor" in k or "vl" in k) and "custo" not in k and "unit" not in k), None)

                        if c_prod and c_qtd:
                            # Apaga dados velhos desse mês
                            conn.execute("DELETE FROM vendas WHERE cliente_id=? AND mes_ref=?", (cid, str_mes))
                            
                            for _, row in df_temp.iterrows():
                                p = str(row[c_prod]).strip()
                                if not p or p.lower() == 'nan': continue
                                
                                try: q = int(float(str(row[c_qtd]).replace(",", ".")))
                                except: q = 0
                                
                                v = 0.0
                                if c_val:
                                    try:
                                        t = str(row[c_val]).replace("R$", "").strip()
                                        if "," in t and "." in t: t = t.replace(".", "").replace(",", ".")
                                        elif "," in t: t = t.replace(",", ".")
                                        v = float(t)
                                    except: v = 0.0
                                
                                if q > 0:
                                    conn.execute("INSERT INTO vendas (cliente_id, arquivo_origem, mes_ref, produto, quantidade, valor) VALUES (?,?,?,?,?,?)", 
                                                 (cid, arq.name, str_mes, p, q, v))
                    except Exception as e: st.error(f"Erro {arq.name}: {e}")
                    
                    progresso.progress((i+1)/len(upl_files))
                
                conn.commit()
                conn.close()
                st.success("Importação concluída!")
                st.rerun()

        if st.button("Limpar Dados deste Cliente"):
            conn = get_connection()
            cid = conn.execute("SELECT id FROM clientes WHERE nome=?", (cliente_selecionado,)).fetchone()[0]
            conn.execute("DELETE FROM vendas WHERE cliente_id=?", (cid,))
            conn.execute("DELETE FROM essenciais WHERE cliente_id=?", (cid,))
            conn.commit()
            conn.close()
            st.rerun()

# === TELA PRINCIPAL ===
if cliente_selecionado != "Selecione...":
    # 1. Carrega dados frescos
    df_tabela, colunas_meses, id_cli, df_bruto = get_dados_cliente(cliente_selecionado)
    
    if df_bruto is not None:
        # 2. Cabeçalho Dinâmico
        st.title(f"📊 {cliente_selecionado}")
        
        total_pecas = int(df_bruto['quantidade'].sum())
        total_grana = df_bruto['valor'].sum()
        fmt_grana = f"R$ {total_grana:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
        
        k1, k2, k3 = st.columns(3)
        k1.metric("Faturamento Total", fmt_grana)
        k2.metric("Peças Vendidas", f"{total_pecas:,}".replace(",", "."))
        k3.metric("Produtos Diferentes", len(df_tabela))
        
        st.divider()
        
        # 3. Abas
        aba1, aba2, aba3, aba4 = st.tabs(["📋 Matriz Financeira", "⭐ Essenciais", "🧠 Dossiê", "💬 Chat"])
        
        # --- MATRIZ ---
        with aba1:
            filtro = st.text_input("Filtrar produto:", placeholder="Digite o nome...")
            df_exib = df_tabela.copy()
            if filtro:
                df_exib = df_exib[df_exib.index.str.lower().str.contains(filtro.lower())]

            # Lógica de Cores
            def colorir(row):
                estilos = [''] * len(row)
                colunas = df_exib.columns.tolist()
                cols_m = [c for c in colunas if "Mês" in c]
                
                for i, col in enumerate(cols_m):
                    try:
                        idx = colunas.index(col)
                        atual = row[col]
                        if i > 0:
                            anterior = row[cols_m[i-1]]
                            # Se subiu: Azul
                            if atual > anterior: 
                                estilos[idx] = 'color: #4da6ff; font-weight: bold;'
                            # Se caiu mas ainda vendeu: Laranja
                            elif atual < anterior and atual > 0: 
                                estilos[idx] = 'color: #ffcc00; font-weight: bold;'
                            # Se zerou (Perda): Vermelho (SEM FUNDO)
                            elif atual == 0 and anterior > 0: 
                                estilos[idx] = 'color: #ff4b4b; font-weight: 900;' 
                    except: pass
                return estilos

            st.dataframe(
                df_exib.style.apply(colorir, axis=1).format("{:.0f}"),
                height=600,
                use_container_width=True
            )

        # --- FAVORITOS ---
        with aba2:
            c1, c2 = st.columns([3,1])
            sel_fav = c1.selectbox("Selecione para Favoritar:", df_tabela.index)
            if c2.button("Adicionar/Remover"):
                conn = get_connection()
                tem = conn.execute("SELECT * FROM essenciais WHERE cliente_id=? AND produto=?", (id_cli, sel_fav)).fetchone()
                if tem:
                    conn.execute("DELETE FROM essenciais WHERE cliente_id=? AND produto=?", (id_cli, sel_fav))
                    st.toast("Removido!", icon="🗑️")
                else:
                    conn.execute("INSERT INTO essenciais (cliente_id, produto) VALUES (?,?)", (id_cli, sel_fav))
                    st.toast("Adicionado!", icon="⭐")
                conn.commit()
                conn.close()
                st.rerun()
            
            conn = get_connection()
            favoritos = [r[0] for r in conn.execute("SELECT produto FROM essenciais WHERE cliente_id=?", (id_cli,)).fetchall()]
            conn.close()
            
            if favoritos:
                df_favs = df_tabela[df_tabela.index.isin(favoritos)]
                st.dataframe(df_favs.style.apply(colorir, axis=1).format("{:.0f}"), use_container_width=True)
            else:
                st.info("Nenhum favorito selecionado.")

        # --- DOSSIE ---
        with aba3:
            resumo = df_bruto.groupby('mes_ref').agg({'quantidade':'sum', 'valor':'sum'}).sort_index()
            
            col_g, col_t = st.columns([2,1])
            with col_g:
                fig, ax = plt.subplots(figsize=(10,5))
                fig.patch.set_alpha(0)
                ax.patch.set_alpha(0)
                
                ax.bar(resumo.index, resumo['quantidade'], color='gray', alpha=0.6, label='Qtd')
                ax.tick_params(colors='white')
                
                ax2 = ax.twinx()
                ax2.plot(resumo.index, resumo['valor'], color='#ff4b4b', marker='o', linewidth=2, label='R$')
                ax2.tick_params(colors='#ff4b4b')
                
                st.pyplot(fig)
            
            with col_t:
                if not resumo.empty:
                    melhor = resumo['valor'].idxmax()
                    val_m = resumo.loc[melhor, 'valor']
                    st.success(f"🏆 Melhor Mês: **{melhor}**\n\nR$ {val_m:,.2f}")

        # --- CHAT ---
        with aba4:
            if "historico" not in st.session_state: st.session_state.historico = []
            
            for msg in st.session_state.historico:
                with st.chat_message(msg["role"]): st.markdown(msg["content"])
            
            if txt := st.chat_input("Pergunte algo (Ex: Faturamento)"):
                st.session_state.historico.append({"role":"user", "content":txt})
                with st.chat_message("user"): st.markdown(txt)
                
                t = txt.lower()
                resp = "Não entendi."
                if "fatur" in t or "valor" in t: resp = f"Faturamento: {fmt_grana}"
                elif "qtd" in t or "peça" in t: resp = f"Peças: {total_pecas}"
                elif "melhor" in t:
                    top = df_tabela.sort_values('TOTAL_QTD', ascending=False).index[0]
                    resp = f"Melhor produto: **{top}**"
                
                st.session_state.historico.append({"role":"assistant", "content":resp})
                with st.chat_message("assistant"): st.markdown(resp)

    else:
        st.warning("Este cliente não tem dados. Importe os CSVs.")
else:
    st.info("👈 Selecione um cliente no menu lateral.")