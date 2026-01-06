import customtkinter as ctk
from tkinter import filedialog, messagebox, ttk
import pandas as pd
import sqlite3
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import os
import re
from PIL import Image # Necessário para o Logo (pip install pillow)

# Configuração Visual
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("dark-blue")

class PauliceiaSistemas(ctk.CTk):
    def __init__(self):
        super().__init__()

        # --- PERSONALIZAÇÃO PAULICEIA ---
        self.title("Pauliceia Análise de Vendas")
        self.state("zoomed") 
        # Ícone da janela (opcional, se tiver um .ico)
        # self.iconbitmap("icone.ico") 

        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self.db_name = "pauliceia_dados.db"
        self.conn = sqlite3.connect(self.db_name)
        self.criar_tabelas()
        
        self.cliente_atual_id = None
        self.cliente_atual_nome = None
        self.df_atual = None 
        self.cols_meses = []
        self.produto_alvo_add = None 

        # === MENU LATERAL ===
        self.sidebar = ctk.CTkFrame(self, width=280, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        
        # --- LOGO E TÍTULO ---
        self.carregar_logo() # Função para tentar carregar 'logo.png'
        
        ctk.CTkLabel(self.sidebar, text="PAULICEIA\nANÁLISE DE VENDAS", font=("Montserrat", 20, "bold")).pack(pady=(10, 20))
        
        # Cliente
        self.frame_cliente = ctk.CTkFrame(self.sidebar, fg_color="#34495e")
        self.frame_cliente.pack(pady=10, padx=10, fill="x")
        
        ctk.CTkLabel(self.frame_cliente, text="👤 Cliente:", font=("Arial", 12, "bold")).pack(pady=(10,5))
        self.combo_clientes = ctk.CTkOptionMenu(self.frame_cliente, values=[], command=self.selecionar_cliente)
        self.combo_clientes.pack(pady=5, padx=10, fill="x")
        
        self.btn_novo_cliente = ctk.CTkButton(self.frame_cliente, text="➕ Novo Cliente", command=self.cadastrar_cliente, fg_color="#27ae60")
        self.btn_novo_cliente.pack(pady=10, padx=10, fill="x")

        # Ações
        ctk.CTkLabel(self.sidebar, text="Ferramentas:", font=("Arial", 12)).pack(pady=(20,5))
        self.btn_importar = ctk.CTkButton(self.sidebar, text="📂 Importar CSVs", command=self.importar_arquivos, state="disabled", fg_color="#2980b9")
        self.btn_importar.pack(pady=5, padx=20, fill="x")

        self.btn_limpar = ctk.CTkButton(self.sidebar, text="🗑️ Limpar Dados", command=self.limpar_cliente, state="disabled", fg_color="#c0392b")
        self.btn_limpar.pack(pady=5, padx=20, fill="x")

        # KPI
        ctk.CTkLabel(self.sidebar, text="Volume Total:", font=("Arial", 12), text_color="gray").pack(pady=(40,5))
        self.lbl_kpi = ctk.CTkLabel(self.sidebar, text="---", font=("Arial", 22, "bold"), text_color="#f1c40f")
        self.lbl_kpi.pack(pady=5)

        self.criar_legenda()

        # === ÁREA PRINCIPAL ===
        self.tabview = ctk.CTkTabview(self, corner_radius=10)
        self.tabview.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")

        # ABAS
        self.tab_matriz = self.tabview.add("📊 Matriz Geral")
        self.tab_essenciais = self.tabview.add("⭐ Produtos Essenciais")
        self.tab_insights = self.tabview.add("🧠 Relatório Detalhado")
        self.tab_chat = self.tabview.add("💬 Chat")
        self.tab_graficos = self.tabview.add("📈 Gráficos")

        self.setup_matriz()
        self.setup_essenciais()
        self.setup_insights()
        self.setup_chat()
        self.setup_graficos()

        self.carregar_clientes_db()

    def carregar_logo(self):
        # Tenta carregar imagem 'logo.png' da pasta local
        try:
            if os.path.exists(".venv/Scripts/__pycache__/MARQUES-E-GONCALES-COMERCIO-DE-TINTAS-LTDA--ME.webp"):
                imagem_pil = Image.open("logo.png")
                # Ajusta tamanho (ex: 150x150)
                self.logo_image = ctk.CTkImage(light_image=imagem_pil, dark_image=imagem_pil, size=(150, 150))
                self.lbl_logo = ctk.CTkLabel(self.sidebar, image=self.logo_image, text="")
                self.lbl_logo.pack(pady=(30, 0))
            else:
                # Se não tiver logo, mostra um texto placeholder ou nada
                ctk.CTkLabel(self.sidebar, text="(Sem logo.png)", text_color="gray").pack(pady=(30,0))
        except Exception as e:
            print(f"Erro ao carregar logo: {e}")

    def criar_legenda(self):
        frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        frame.pack(side="bottom", pady=20, padx=20, fill="x")
        ctk.CTkLabel(frame, text="Legenda (Mês vs Anterior):", font=("Arial", 12, "bold")).pack(anchor="w")
        ctk.CTkLabel(frame, text="🔵 Vendeu Mais", text_color="#3498db").pack(anchor="w")
        ctk.CTkLabel(frame, text="🔴 Vendeu Menos", text_color="#e74c3c").pack(anchor="w")
        ctk.CTkLabel(frame, text="🟡 Vendeu Igual", text_color="#f1c40f").pack(anchor="w")

    def criar_tabelas(self):
        self.conn.execute('CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT UNIQUE)')
        self.conn.execute('''
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
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS essenciais (
                id INTEGER PRIMARY KEY,
                cliente_id INTEGER,
                produto TEXT,
                FOREIGN KEY(cliente_id) REFERENCES clientes(id),
                UNIQUE(cliente_id, produto)
            )
        ''')
        self.conn.commit()

    # --- FUNÇÕES BÁSICAS ---
    def cadastrar_cliente(self):
        nome = ctk.CTkInputDialog(text="Nome:", title="Novo").get_input()
        if nome:
            try:
                self.conn.execute("INSERT INTO clientes (nome) VALUES (?)", (nome.upper(),))
                self.conn.commit()
                self.carregar_clientes_db()
                self.combo_clientes.set(nome.upper())
                self.selecionar_cliente(nome.upper())
            except: messagebox.showerror("Erro", "Já existe!")

    def carregar_clientes_db(self):
        res = self.conn.execute("SELECT nome FROM clientes ORDER BY nome").fetchall()
        lista = [r[0] for r in res]
        self.combo_clientes.configure(values=lista if lista else ["Vazio"])

    def selecionar_cliente(self, nome):
        if nome == "Vazio": return
        res = self.conn.execute("SELECT id FROM clientes WHERE nome = ?", (nome,)).fetchone()
        if res:
            self.cliente_atual_id = res[0]
            self.cliente_atual_nome = nome
            self.btn_importar.configure(state="normal", text=f"📂 Importar p/ {nome}")
            self.btn_limpar.configure(state="normal")
            self.processar_dados()

    def limpar_cliente(self):
        if not self.cliente_atual_id: return
        if messagebox.askyesno("Apagar?", "Isso deleta todo histórico deste cliente."):
            self.conn.execute("DELETE FROM vendas WHERE cliente_id = ?", (self.cliente_atual_id,))
            self.conn.execute("DELETE FROM essenciais WHERE cliente_id = ?", (self.cliente_atual_id,))
            self.conn.commit()
            self.processar_dados()

    def importar_arquivos(self):
        arquivos = filedialog.askopenfilenames(filetypes=[("CSV", "*.csv")])
        if not arquivos: return
        
        cursor = self.conn.cursor()
        for caminho in arquivos:
            nome = os.path.basename(caminho)
            num = int(re.search(r'\d+', nome).group()) if re.search(r'\d+', nome) else 0
            mes_ref = f"Mês {num:02d}" if num > 0 else nome
            try:
                df = pd.read_csv(caminho, sep=';', encoding='latin1')
                cols = {c.lower(): c for c in df.columns}
                col_prod = next((v for k,v in cols.items() if "descri" in k), None)
                col_qtd = next((v for k,v in cols.items() if "quantidade" in k or "qtd" in k), None)
                if not col_prod or not col_qtd: continue
                
                cursor.execute("DELETE FROM vendas WHERE cliente_id=? AND mes_ref=?", (self.cliente_atual_id, mes_ref))
                for _, row in df.iterrows():
                    p = str(row[col_prod]).strip()
                    if not p or p.lower()=='nan': continue
                    try: q = int(float(str(row[col_qtd]).replace(",", ".").replace(" ", "")))
                    except: q = 0
                    if q > 0: cursor.execute("INSERT INTO vendas (cliente_id, arquivo_origem, mes_ref, produto, quantidade) VALUES (?,?,?,?,?)",
                                             (self.cliente_atual_id, nome, mes_ref, p, q))
            except: pass
        self.conn.commit()
        messagebox.showinfo("OK", "Arquivos importados com sucesso!")
        self.processar_dados()

    def processar_dados(self):
        if not self.cliente_atual_id: return
        df = pd.read_sql_query("SELECT * FROM vendas WHERE cliente_id = ?", self.conn, params=(self.cliente_atual_id,))
        if df.empty:
            self.limpar_interface()
            return

        self.lbl_kpi.configure(text=f"{int(df['quantidade'].sum()):,}".replace(",", "."))

        df_pivot = df.pivot_table(index='produto', columns='mes_ref', values='quantidade', aggfunc='sum', fill_value=0)
        self.cols_meses = sorted(df_pivot.columns)
        df_pivot = df_pivot[self.cols_meses]
        df_pivot['TOTAL_GERAL'] = df_pivot.sum(axis=1)
        self.df_atual = df_pivot.sort_index()

        self.renderizar_matriz(self.df_atual)
        self.renderizar_essenciais()
        self.gerar_relatorio_avancado(self.df_atual)
        self.atualizar_graficos(df)
        
        self.chat_history.delete("1.0", "end")
        self.chat_history.insert("1.0", "Sistema: Chat Pauliceia Ativado.\n\n")

    def limpar_interface(self):
        for w in self.scroll_data.winfo_children(): w.destroy()
        for w in self.scroll_essencial.winfo_children(): w.destroy()
        self.txt_insights.delete("1.0", "end")
        for w in self.frame_chart.winfo_children(): w.destroy()
        self.df_atual = None

    # === ABA 1: MATRIZ GERAL ===
    def setup_matriz(self):
        f_busca = ctk.CTkFrame(self.tab_matriz)
        f_busca.pack(fill="x", padx=10, pady=5)
        ctk.CTkLabel(f_busca, text="🔍 Filtrar:", font=("Arial", 12, "bold")).pack(side="left", padx=10)
        self.entry_busca = ctk.CTkEntry(f_busca, width=300)
        self.entry_busca.pack(side="left", padx=5)
        self.entry_busca.bind("<KeyRelease>", lambda e: self.renderizar_matriz(self.df_atual[self.df_atual.index.str.lower().str.contains(self.entry_busca.get().lower())] if self.df_atual is not None else None))

        self.header_frame = ctk.CTkFrame(self.tab_matriz, height=30, fg_color="#2c3e50")
        self.header_frame.pack(fill="x", padx=10)
        self.scroll_data = ctk.CTkScrollableFrame(self.tab_matriz, fg_color="transparent")
        self.scroll_data.pack(fill="both", expand=True, padx=10, pady=5)

    def renderizar_matriz(self, df):
        for w in self.header_frame.winfo_children(): w.destroy()
        for w in self.scroll_data.winfo_children(): w.destroy()
        if df is None or df.empty: return

        cols = ["Produto"] + self.cols_meses + ["Total"]
        for i, c in enumerate(cols):
            ctk.CTkLabel(self.header_frame, text=c, width=300 if i==0 else 80, font=("Arial",12,"bold")).grid(row=0, column=i, padx=2)

        for r_idx, (prod, row) in enumerate(df.head(100).iterrows()):
            ctk.CTkLabel(self.scroll_data, text=prod[:45], width=300, anchor="w").grid(row=r_idx, column=0, padx=5, pady=2)
            vals = [int(row[c]) for c in self.cols_meses]
            for c_idx, val in enumerate(vals):
                cor = "white"
                if c_idx > 0:
                    if val > vals[c_idx-1]: cor = "#3498db"
                    elif val < vals[c_idx-1]: cor = "#e74c3c"
                    else: cor = "#f1c40f"
                ctk.CTkLabel(self.scroll_data, text=str(val), width=80, text_color=cor).grid(row=r_idx, column=c_idx+1, padx=2)
            ctk.CTkLabel(self.scroll_data, text=str(int(row['TOTAL_GERAL'])), width=80, font=("Arial",12,"bold")).grid(row=r_idx, column=len(self.cols_meses)+1, padx=2)

    # === ABA ESSENCIAIS ===
    def setup_essenciais(self):
        f_top = ctk.CTkFrame(self.tab_essenciais)
        f_top.pack(fill="x", padx=10, pady=10)
        btn_gerenciar = ctk.CTkButton(f_top, text="🔍 Procurar e Salvar nos Essenciais", command=self.abrir_gerenciador_essenciais, fg_color="#d35400", font=("Arial", 13, "bold"), width=300)
        btn_gerenciar.pack(side="left", padx=10)
        self.header_essencial = ctk.CTkFrame(self.tab_essenciais, height=30, fg_color="#2c3e50")
        self.header_essencial.pack(fill="x", padx=10)
        self.scroll_essencial = ctk.CTkScrollableFrame(self.tab_essenciais, fg_color="transparent")
        self.scroll_essencial.pack(fill="both", expand=True, padx=10, pady=5)

    def abrir_gerenciador_essenciais(self):
        if self.df_atual is None: 
            messagebox.showwarning("Aviso", "Importe dados primeiro.")
            return
        self.janela_add = ctk.CTkToplevel(self)
        self.janela_add.title("Adicionar aos Essenciais")
        self.janela_add.geometry("600x600")
        self.janela_add.attributes("-topmost", True)
        ctk.CTkLabel(self.janela_add, text="1. Digite o nome para buscar:", font=("Arial", 14, "bold")).pack(pady=(10, 5))
        self.entry_busca_add = ctk.CTkEntry(self.janela_add, placeholder_text="Ex: Parafuso...", width=400)
        self.entry_busca_add.pack(pady=5)
        self.entry_busca_add.bind("<KeyRelease>", self.filtrar_produtos_para_adicionar)
        ctk.CTkLabel(self.janela_add, text="2. Clique no produto abaixo:", font=("Arial", 12)).pack(pady=(10, 2))
        self.scroll_resultados_add = ctk.CTkScrollableFrame(self.janela_add, width=500, height=200, fg_color="#2c3e50")
        self.scroll_resultados_add.pack(pady=5)
        ctk.CTkLabel(self.janela_add, text="3. Produto Selecionado:", font=("Arial", 14, "bold")).pack(pady=(20, 5))
        self.lbl_selecionado = ctk.CTkLabel(self.janela_add, text="Nenhum", text_color="#f1c40f", font=("Arial", 13))
        self.lbl_selecionado.pack(pady=5)
        f_btns = ctk.CTkFrame(self.janela_add, fg_color="transparent")
        f_btns.pack(pady=20)
        ctk.CTkButton(f_btns, text="✅ Adicionar aos Essenciais", fg_color="green", width=200, command=self.confirmar_adicao).pack(side="left", padx=10)
        ctk.CTkButton(f_btns, text="❌ Remover da Lista", fg_color="red", width=200, command=self.confirmar_remocao).pack(side="left", padx=10)
        ctk.CTkLabel(self.janela_add, text="Sua lista atual:", font=("Arial", 12)).pack(pady=(20, 2))
        self.txt_lista_atual = ctk.CTkTextbox(self.janela_add, width=500, height=100)
        self.txt_lista_atual.pack(pady=5)
        self.atualizar_lista_visual()

    def filtrar_produtos_para_adicionar(self, event=None):
        termo = self.entry_busca_add.get().lower()
        for w in self.scroll_resultados_add.winfo_children(): w.destroy()
        if not termo: return
        matches = self.df_atual[self.df_atual.index.str.lower().str.contains(termo)].head(30)
        for prod in matches.index:
            btn = ctk.CTkButton(self.scroll_resultados_add, text=prod, fg_color="transparent", border_width=1, border_color="gray", anchor="w", command=lambda p=prod: self.selecionar_produto_alvo(p))
            btn.pack(fill="x", pady=2)

    def selecionar_produto_alvo(self, produto):
        self.produto_alvo_add = produto
        self.lbl_selecionado.configure(text=produto)

    def confirmar_adicao(self):
        if not self.produto_alvo_add: return
        try:
            self.conn.execute("INSERT INTO essenciais (cliente_id, produto) VALUES (?,?)", (self.cliente_atual_id, self.produto_alvo_add))
            self.conn.commit()
            self.atualizar_lista_visual()
            self.renderizar_essenciais()
            messagebox.showinfo("Sucesso", f"{self.produto_alvo_add} salvo!")
        except: messagebox.showwarning("Aviso", "Este produto já está na lista.")

    def confirmar_remocao(self):
        if not self.produto_alvo_add: return
        self.conn.execute("DELETE FROM essenciais WHERE cliente_id=? AND produto=?", (self.cliente_atual_id, self.produto_alvo_add))
        self.conn.commit()
        self.atualizar_lista_visual()
        self.renderizar_essenciais()
        messagebox.showinfo("Removido", f"{self.produto_alvo_add} removido.")

    def atualizar_lista_visual(self):
        res = self.conn.execute("SELECT produto FROM essenciais WHERE cliente_id=?", (self.cliente_atual_id,)).fetchall()
        texto = "ITENS SALVOS:\n" + "\n".join([f"- {r[0]}" for r in res])
        self.txt_lista_atual.delete("1.0", "end")
        self.txt_lista_atual.insert("1.0", texto)

    def renderizar_essenciais(self):
        for w in self.header_essencial.winfo_children(): w.destroy()
        for w in self.scroll_essencial.winfo_children(): w.destroy()
        if self.df_atual is None: return
        res = self.conn.execute("SELECT produto FROM essenciais WHERE cliente_id=?", (self.cliente_atual_id,)).fetchall()
        lista_essenciais = [r[0] for r in res]
        df_filtrado = self.df_atual[self.df_atual.index.isin(lista_essenciais)]
        if df_filtrado.empty:
            ctk.CTkLabel(self.scroll_essencial, text="Nenhum produto marcado. Clique em 'Procurar e Salvar'.").pack(pady=20)
            return
        cols = ["Produto"] + self.cols_meses + ["Total"]
        for i, c in enumerate(cols):
            ctk.CTkLabel(self.header_essencial, text=c, width=300 if i==0 else 80, font=("Arial",12,"bold")).grid(row=0, column=i, padx=2)
        for r_idx, (prod, row) in enumerate(df_filtrado.iterrows()):
            ctk.CTkLabel(self.scroll_essencial, text=prod[:45], width=300, anchor="w").grid(row=r_idx, column=0, padx=5, pady=2)
            vals = [int(row[c]) for c in self.cols_meses]
            for c_idx, val in enumerate(vals):
                cor = "white"
                if c_idx > 0:
                    if val > vals[c_idx-1]: cor = "#3498db"
                    elif val < vals[c_idx-1]: cor = "#e74c3c"
                    else: cor = "#f1c40f"
                ctk.CTkLabel(self.scroll_essencial, text=str(val), width=80, text_color=cor).grid(row=r_idx, column=c_idx+1, padx=2)
            ctk.CTkLabel(self.scroll_essencial, text=str(int(row['TOTAL_GERAL'])), width=80, font=("Arial",12,"bold")).grid(row=r_idx, column=len(self.cols_meses)+1, padx=2)

    # === RELATÓRIO AVANÇADO (PAULICEIA) ===
    def setup_insights(self):
        self.txt_insights = ctk.CTkTextbox(self.tab_insights, font=("Consolas", 14), fg_color="#2c3e50")
        self.txt_insights.pack(fill="both", expand=True, padx=10, pady=10)

    def gerar_relatorio_avancado(self, df):
        if df is None or len(self.cols_meses) < 2: return
        texto = f"=== RELATÓRIO PAULICEIA: {self.cliente_atual_nome} ===\n"
        texto += f"Período Analisado: {self.cols_meses[0]} até {self.cols_meses[-1]}\n"
        texto += "="*60 + "\n\n"
        total_meses = df[self.cols_meses].sum()
        melhor_mes = total_meses.idxmax()
        pior_mes = total_meses.idxmin()
        texto += f"1. TENDÊNCIA E SAZONALIDADE:\n   • Volume Total: {int(df['TOTAL_GERAL'].sum())} peças\n   • Melhor Mês: {melhor_mes} ({int(total_meses.max())} peças)\n   • Pior Mês:   {pior_mes} ({int(total_meses.min())} peças)\n\n"
        texto += "2. 📉 QUEDAS MAIS GRAVES (Histórico Recente):\n"
        df['diff_total'] = df[self.cols_meses[-1]] - df[self.cols_meses[0]]
        quedas = df.sort_values('diff_total', ascending=True).head(5)
        for prod, row in quedas.iterrows():
            if row['diff_total'] < 0:
                historico = " -> ".join([str(int(row[m])) for m in self.cols_meses])
                texto += f"   🔴 {prod}\n      Histórico: [{historico}] (Caiu {int(abs(row['diff_total']))} un.)\n"
        texto += "\n3. 🚀 PRODUTOS EM ASCENSÃO:\n"
        altas = df.sort_values('diff_total', ascending=False).head(5)
        for prod, row in altas.iterrows():
            if row['diff_total'] > 0:
                historico = " -> ".join([str(int(row[m])) for m in self.cols_meses])
                texto += f"   🔵 {prod}\n      Histórico: [{historico}] (+{int(row['diff_total'])} un.)\n"
        churn = df[(df[self.cols_meses[:-1]].sum(axis=1) > 0) & (df[self.cols_meses[-1]] == 0)]
        churn = churn.sort_values('TOTAL_GERAL', ascending=False).head(5)
        if not churn.empty:
            texto += "\n4. 💀 RISCO DE PERDA (Itens que zeraram no último mês):\n"
            for prod, row in churn.iterrows(): texto += f"   ⚠️ {prod} (Média anterior: {int(row[self.cols_meses[:-1]].mean())} -> Atual: 0)\n"
        df['freq'] = (df[self.cols_meses] > 0).sum(axis=1)
        frios = df[df['freq'] <= (len(self.cols_meses) // 2)].head(5)
        if not frios.empty:
            texto += "\n5. ❄️ PRODUTOS 'FRIOS' (Comprados poucas vezes):\n"
            for prod, row in frios.iterrows(): texto += f"   ⚪ {prod} (Vendeu em apenas {int(row['freq'])} dos {len(self.cols_meses)} meses)\n"
        self.txt_insights.delete("1.0", "end")
        self.txt_insights.insert("1.0", texto)

    # --- CHAT NATIVO ---
    def setup_chat(self):
        self.chat_history = ctk.CTkTextbox(self.tab_chat, font=("Arial", 14), fg_color="#2c3e50", wrap="word")
        self.chat_history.pack(fill="both", expand=True, padx=10, pady=(10, 5))
        f_inp = ctk.CTkFrame(self.tab_chat, height=50)
        f_inp.pack(fill="x", padx=10, pady=10)
        self.entry_chat = ctk.CTkEntry(f_inp, placeholder_text="Digite aqui...", height=40)
        self.entry_chat.pack(side="left", fill="x", expand=True, padx=10)
        self.entry_chat.bind("<Return>", self.enviar_chat)
        ctk.CTkButton(f_inp, text="Enviar", width=100, command=self.enviar_chat).pack(side="right")

    def enviar_chat(self, event=None):
        pergunta = self.entry_chat.get().lower()
        if not pergunta: return
        self.entry_chat.delete(0, "end")
        self.chat_history.insert("end", f"Você: {pergunta}\n\n")
        if self.df_atual is None: return
        df = self.df_atual
        res = "Não entendi."
        try:
            if 'total' in pergunta: res = f"Total vendido: {int(df['TOTAL_GERAL'].sum())}"
            elif 'melhor' in pergunta: 
                top = df.sort_values('TOTAL_GERAL', ascending=False).head(3)
                res = "Top 3:\n" + "\n".join([f"- {p}: {int(r['TOTAL_GERAL'])}" for p,r in top.iterrows()])
            else:
                matches = df[df.index.str.lower().str.contains(pergunta)]
                if not matches.empty:
                    res = "Encontrei:\n"
                    for p, r in matches.head(5).iterrows(): res += f"📦 {p} -> Total: {int(r['TOTAL_GERAL'])}\n"
                else: res = "Produto não encontrado."
        except: pass
        self.chat_history.insert("end", f"Bot: {res}\n\n")

    # --- GRÁFICOS ---
    def setup_graficos(self):
        self.frame_chart = ctk.CTkFrame(self.tab_graficos, fg_color="transparent")
        self.frame_chart.pack(fill="both", expand=True)

    def atualizar_graficos(self, df):
        for w in self.frame_chart.winfo_children(): w.destroy()
        tempo = df.groupby('mes_ref')['quantidade'].sum()
        fig, ax = plt.subplots(figsize=(10, 5), dpi=100)
        fig.patch.set_facecolor('#2b2b2b'); ax.set_facecolor('#2b2b2b')
        ax.plot(tempo.index, tempo.values, marker='o', color='#3498db', linewidth=3)
        ax.tick_params(colors='white', rotation=45)
        ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('white'); ax.spines['bottom'].set_color('white')
        plt.subplots_adjust(bottom=0.2)
        canvas = FigureCanvasTkAgg(fig, master=self.frame_chart)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True, padx=20, pady=20)

if __name__ == "__main__":
    app = PauliceiaSistemas()
    app.mainloop()