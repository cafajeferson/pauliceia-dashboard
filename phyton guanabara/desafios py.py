import customtkinter as ctk
from tkinter import filedialog, messagebox, ttk
import pandas as pd
import sqlite3
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import os
import re

# Configuração Visual
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("dark-blue")

class SistemaGestaoV14(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Sistema V14.0 - Inteligência Nativa (Offline)")
        self.state("zoomed") 

        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self.db_name = "gestao_v14.db"
        self.conn = sqlite3.connect(self.db_name)
        self.criar_tabelas()
        
        self.cliente_atual_id = None
        self.cliente_atual_nome = None
        self.df_atual = None 
        self.cols_meses = []

        # === MENU LATERAL ===
        self.sidebar = ctk.CTkFrame(self, width=280, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        
        ctk.CTkLabel(self.sidebar, text="GESTOR NATIVO", font=("Montserrat", 24, "bold")).pack(pady=(30, 20))
        
        # Cliente
        self.frame_cliente = ctk.CTkFrame(self.sidebar, fg_color="#34495e")
        self.frame_cliente.pack(pady=10, padx=10, fill="x")
        
        ctk.CTkLabel(self.frame_cliente, text="👤 Cliente:", font=("Arial", 12, "bold")).pack(pady=(10,5))
        self.combo_clientes = ctk.CTkOptionMenu(self.frame_cliente, values=[], command=self.selecionar_cliente)
        self.combo_clientes.pack(pady=5, padx=10, fill="x")
        
        self.btn_novo_cliente = ctk.CTkButton(self.frame_cliente, text="➕ Novo Cliente", command=self.cadastrar_cliente, fg_color="#27ae60")
        self.btn_novo_cliente.pack(pady=10, padx=10, fill="x")

        # Ações
        ctk.CTkLabel(self.sidebar, text="Ações:", font=("Arial", 12)).pack(pady=(20,5))
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

        self.tab_matriz = self.tabview.add("📊 Matriz (Cores)")
        self.tab_insights = self.tabview.add("🧠 Relatório Automático")
        self.tab_chat = self.tabview.add("💬 Chat Inteligente")
        self.tab_graficos = self.tabview.add("📈 Gráficos")

        self.setup_matriz()
        self.setup_insights()
        self.setup_chat()
        self.setup_graficos()

        self.carregar_clientes_db()

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
        self.gerar_relatorio_nativo(self.df_atual)
        self.atualizar_graficos(df)
        
        # Limpa chat
        self.chat_history.delete("1.0", "end")
        self.chat_history.insert("1.0", "Sistema: Chat Ativado.\nExemplos: 'qual o total', 'melhores itens', 'piores itens', 'parafuso'...\n\n")

    def limpar_interface(self):
        for w in self.scroll_data.winfo_children(): w.destroy()
        self.txt_insights.delete("1.0", "end")
        for w in self.frame_chart.winfo_children(): w.destroy()
        self.df_atual = None

    # --- MATRIZ CÉLULA A CÉLULA ---
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
                # LÓGICA DE CORES: Azul se > anterior, Vermelho se < anterior
                if c_idx > 0:
                    anterior = vals[c_idx-1]
                    if val > anterior: cor = "#3498db" # Azul
                    elif val < anterior: cor = "#e74c3c" # Vermelho
                    else: cor = "#f1c40f" # Amarelo
                
                ctk.CTkLabel(self.scroll_data, text=str(val), width=80, text_color=cor).grid(row=r_idx, column=c_idx+1, padx=2)
            
            ctk.CTkLabel(self.scroll_data, text=str(int(row['TOTAL_GERAL'])), width=80, font=("Arial",12,"bold")).grid(row=r_idx, column=len(self.cols_meses)+1, padx=2)

    # --- RELATÓRIO NATIVO (SEM IA) ---
    def setup_insights(self):
        self.txt_insights = ctk.CTkTextbox(self.tab_insights, font=("Consolas", 14), fg_color="#2c3e50")
        self.txt_insights.pack(fill="both", expand=True, padx=10, pady=10)

    def gerar_relatorio_nativo(self, df):
        if df is None or len(self.cols_meses) < 2: return
        
        texto = f"=== RELATÓRIO DO CLIENTE: {self.cliente_atual_nome} ===\n"
        texto += f"Período: {self.cols_meses[0]} até {self.cols_meses[-1]}\n\n"

        # Variação Geral
        ini = df[self.cols_meses[0]].sum()
        fim = df[self.cols_meses[-1]].sum()
        diff = fim - ini
        status = "CRESCIMENTO 🔵" if diff >= 0 else "RETRAÇÃO 🔴"
        texto += f"1. TENDÊNCIA GERAL: {status}\n"
        texto += f"   Saída Inicial: {int(ini)}\n   Saída Final: {int(fim)}\n   Saldo: {int(diff)} peças\n\n"

        # Top 3
        texto += "2. PRODUTOS ESTRELAS (Maior Volume):\n"
        top3 = df.sort_values('TOTAL_GERAL', ascending=False).head(3)
        for p, r in top3.iterrows():
            texto += f"   ★ {p} (Total: {int(r['TOTAL_GERAL'])})\n"
        
        # Piores Quedas (Recente)
        texto += "\n3. QUEDAS RECENTES (Alerta):\n"
        df['temp_var'] = df[self.cols_meses[-1]] - df[self.cols_meses[-2]]
        quedas = df.sort_values('temp_var', ascending=True).head(3)
        for p, r in quedas.iterrows():
            if r['temp_var'] < 0:
                texto += f"   📉 {p} (Caiu {int(abs(r['temp_var']))} un.)\n"

        # Sugestão
        texto += "\n4. SUGESTÃO AUTOMÁTICA:\n"
        if diff < 0:
            texto += "   -> Focar em promoções para os itens em queda listados acima.\n"
        else:
            texto += "   -> Manter estoque alto dos produtos estrelas para não perder vendas.\n"

        self.txt_insights.delete("1.0", "end")
        self.txt_insights.insert("1.0", texto)

    # --- CHAT INTELIGENTE (NATIVO) ---
    def setup_chat(self):
        self.chat_history = ctk.CTkTextbox(self.tab_chat, font=("Arial", 14), fg_color="#2c3e50", wrap="word")
        self.chat_history.pack(fill="both", expand=True, padx=10, pady=(10, 5))
        f_inp = ctk.CTkFrame(self.tab_chat, height=50)
        f_inp.pack(fill="x", padx=10, pady=10)
        self.entry_chat = ctk.CTkEntry(f_inp, placeholder_text="Ex: 'total', 'melhor', 'pior', 'nome do produto'...", height=40)
        self.entry_chat.pack(side="left", fill="x", expand=True, padx=10)
        self.entry_chat.bind("<Return>", self.enviar_chat)
        ctk.CTkButton(f_inp, text="Enviar", width=100, command=self.enviar_chat).pack(side="right")

    def enviar_chat(self, event=None):
        pergunta = self.entry_chat.get().lower()
        if not pergunta: return
        self.entry_chat.delete(0, "end")
        
        self.chat_history.insert("end", f"Você: {pergunta}\n\n")
        
        if self.df_atual is None:
            self.chat_history.insert("end", "Sistema: Selecione um cliente primeiro.\n\n")
            return

        df = self.df_atual
        resposta = "Sistema: Não entendi. Tente 'total', 'melhor', 'pior' ou o nome do item."

        try:
            # LÓGICA DE PALAVRAS-CHAVE (NÃO USA IA)
            if any(x in pergunta for x in ['total', 'geral', 'tudo']):
                tot = int(df['TOTAL_GERAL'].sum())
                resposta = f"O volume total de vendas no período foi de {tot} peças."
            
            elif any(x in pergunta for x in ['melhor', 'mais', 'top', 'campe']):
                top = df.sort_values('TOTAL_GERAL', ascending=False).head(3)
                txt = "Top 3 Produtos:\n"
                for p, r in top.iterrows(): txt += f"- {p}: {int(r['TOTAL_GERAL'])}\n"
                resposta = txt

            elif any(x in pergunta for x in ['pior', 'menos', 'queda']):
                # Se falou queda, vê variação
                if 'queda' in pergunta:
                    df['v'] = df[self.cols_meses[-1]] - df[self.cols_meses[-2]]
                    pior = df.sort_values('v', ascending=True).head(3)
                    txt = "Maiores quedas recentes:\n"
                    for p, r in pior.iterrows(): 
                        if r['v'] < 0: txt += f"- {p}: {int(r['v'])}\n"
                    resposta = txt
                else:
                    # Menos vendidos (mas > 0)
                    pior = df[df['TOTAL_GERAL']>0].sort_values('TOTAL_GERAL', ascending=True).head(3)
                    txt = "Menos vendidos (ativos):\n"
                    for p, r in pior.iterrows(): txt += f"- {p}: {int(r['TOTAL_GERAL'])}\n"
                    resposta = txt
            
            else:
                # Busca por nome
                matches = df[df.index.str.lower().str.contains(pergunta)]
                if not matches.empty:
                    txt = f"Encontrei {len(matches)} itens:\n"
                    for p, r in matches.head(5).iterrows():
                        hist = " -> ".join([str(int(r[c])) for c in self.cols_meses])
                        txt += f"📦 {p}\n   Histórico: {hist}\n   Total: {int(r['TOTAL_GERAL'])}\n\n"
                    resposta = txt
                else:
                    resposta = "Não encontrei nenhum produto com esse nome."

        except Exception as e:
            resposta = f"Erro ao calcular: {e}"

        self.chat_history.insert("end", f"Bot: {resposta}\n{'-'*30}\n\n")
        self.chat_history.see("end")

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
        ax.set_title(f"Evolução: {self.cliente_atual_nome}", color='white')
        ax.tick_params(colors='white', rotation=45)
        ax.spines['top'].set_visible(False); ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color('white'); ax.spines['bottom'].set_color('white')
        plt.subplots_adjust(bottom=0.2)
        canvas = FigureCanvasTkAgg(fig, master=self.frame_chart)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True, padx=20, pady=20)

if __name__ == "__main__":
    app = SistemaGestaoV14()
    app.mainloop()