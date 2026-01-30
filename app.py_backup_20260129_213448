import streamlit as st
import pandas as pd
import os
import re
import base64
from datetime import datetime, date
from supabase import create_client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://ndjhwxnprptdceqkfgut.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kamh3eG5wcnB0ZGNlcWtmZ3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNjYwMTQsImV4cCI6MjA4NDY0MjAxNH0.qqM3vuemcHtyi7Tni_0jmkNnGT_hpD2suiCXF4lYHWs")

# Tentar importar OpenAI (opcional)
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# === CONFIGURAÇÃO DA PÁGINA ===
st.set_page_config(
    page_title="Pauliceia - Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# === BANCO DE DADOS (SUPABASE) COM CACHE ===

@st.cache_resource
def get_supabase_client():
    """Cliente Supabase com cache (não recria a cada reload)"""
    return create_client(SUPABASE_URL, SUPABASE_KEY)

supabase = get_supabase_client()


# === FUNÇÕES COM CACHE ===

@st.cache_data(ttl=300)  # Cache por 5 minutos
def get_lista_clientes():
    """Busca lista de clientes com cache"""
    result = supabase.table("clientes").select("id, nome").order("nome").execute()
    return result.data if result.data else []


@st.cache_data(ttl=300)
def get_lista_usuarios():
    """Busca lista de usuários com cache"""
    result = supabase.table("usuarios").select("id, nome, login, tipo, cargo, ativo").order("nome").execute()
    return result.data if result.data else []


def limpar_cache():
    """Limpa o cache quando dados são alterados"""
    get_lista_clientes.clear()
    get_lista_usuarios.clear()


def init_db():
    """Verifica se o admin padrão existe (executa apenas uma vez por sessão)"""
    if "db_initialized" in st.session_state:
        return

    try:
        result = supabase.table("usuarios").select("id").eq("login", "admin").execute()
        if not result.data:
            supabase.table("usuarios").insert({
                "nome": "Administrador",
                "login": "admin",
                "senha": "admin123",
                "tipo": "admin",
                "cargo": "colorista"
            }).execute()
        st.session_state.db_initialized = True
    except Exception:
        pass  # Silencioso para não travar a aplicação


init_db()

# === FUNÇÕES DE AUTENTICAÇÃO ===


def verificar_login(login, senha):
    try:
        result = supabase.table("usuarios").select("id, nome, tipo, cargo").ilike("login", login).eq("senha", senha).eq("ativo", 1).execute()
        if result.data:
            user = result.data[0]
            return (user["id"], user["nome"], user["tipo"], user.get("cargo", "colorista"))
        return None
    except Exception as e:
        st.error(f"Erro no login: {e}")
        return None


def fazer_logout():
    for key in ['usuario_id', 'usuario_nome', 'usuario_tipo', 'usuario_cargo', 'logado']:
        if key in st.session_state:
            del st.session_state[key]


def obter_id_lider():
    """Retorna o ID do líder dos coloristas (Nilton)"""
    try:
        result = supabase.table("usuarios").select("id").eq("cargo", "lider_colorista").eq("ativo", 1).execute()
        return result.data[0]["id"] if result.data else None
    except:
        return None

# === TELA DE LOGIN ===


def tela_login():
    col1, col2, col3 = st.columns([1, 1, 1])

    with col2:
        # Logo
        if os.path.exists("logo.png"):
            st.image("logo.png", width=150)

        st.markdown("## Bem-vindo!")
        st.markdown("Faça login para continuar")

        # Usar st.form para que Enter funcione e autocomplete também
        with st.form("login_form", clear_on_submit=False):
            login = st.text_input(
                "Usuário", placeholder="Digite seu login", label_visibility="collapsed")
            senha = st.text_input(
                "Senha", type="password", placeholder="Digite sua senha", label_visibility="collapsed")

            submitted = st.form_submit_button("ENTRAR", type="primary")

            if submitted:
                if login and senha:
                    user = verificar_login(login, senha)
                    if user:
                        st.session_state.logado = True
                        st.session_state.usuario_id = user[0]
                        st.session_state.usuario_nome = user[1]
                        st.session_state.usuario_tipo = user[2]
                        st.session_state.usuario_cargo = user[3] if len(user) > 3 else 'colorista'
                        st.rerun()
                    else:
                        st.error("Usuário ou senha incorretos!")
                else:
                    st.warning("Preencha todos os campos!")

        st.caption("Pauliceia Tintas - Sistema de Gestão")

# === TELA DO LÍDER DE LOJA ===


def tela_lider_loja():
    """Tela exclusiva para líderes de loja com acesso limitado"""
    # Controle de confirmação de saída
    if "confirmar_sair_lider" not in st.session_state:
        st.session_state.confirmar_sair_lider = False

    # Cabeçalho compacto com botão sair
    col1, col2 = st.columns([5, 1])
    with col1:
        st.markdown(f"**🏪 {st.session_state.usuario_nome}** - Líder de Loja")
    with col2:
        if st.button("🚪", key="sair_lider_loja"):
            st.session_state.confirmar_sair_lider = True
            st.rerun()

    # Modal de confirmação de saída
    if st.session_state.confirmar_sair_lider:
        st.warning("⚠️ Deseja realmente sair do sistema?")
        col_sim, col_nao = st.columns(2)
        with col_sim:
            if st.button("✅ Sim, sair", type="primary", key="sim_sair_lider"):
                st.session_state.confirmar_sair_lider = False
                fazer_logout()
                st.rerun()
        with col_nao:
            if st.button("❌ Não, voltar", key="nao_sair_lider"):
                st.session_state.confirmar_sair_lider = False
                st.rerun()

    # Abas do líder de loja
    tab1, tab2, tab3 = st.tabs([
        "✏️ Relatório para Admin",
        "💰 Devemos",
        "📦 Materiais Emprestados"
    ])

    # === ABA: RELATÓRIO PARA ADMIN ===
    with tab1:
        st.subheader("📤 Relatório para Administrador")

        # Controle para mostrar/ocultar formulário
        if "mostrar_form_relatorio_loja" not in st.session_state:
            st.session_state.mostrar_form_relatorio_loja = False
        if "relatorio_enviado_loja" not in st.session_state:
            st.session_state.relatorio_enviado_loja = False

        # Mostrar mensagem de sucesso se acabou de enviar
        if st.session_state.relatorio_enviado_loja:
            st.success("✅ Relatório enviado para o Admin com sucesso!")
            st.session_state.relatorio_enviado_loja = False

        # Botão para abrir formulário
        if not st.session_state.mostrar_form_relatorio_loja:
            st.info("Clique no botão abaixo para criar um novo relatório.")
            if st.button("➕ Novo Relatório", type="primary", key="btn_novo_rel_loja"):
                st.session_state.mostrar_form_relatorio_loja = True
                st.rerun()
        else:
            # Formulário de relatório
            st.markdown("### ✏️ Novo Relatório")

            data_rel = st.date_input("Data do Relatório", value=date.today(), key="data_rel_lider_loja")
            observacoes = st.text_input(
                "Observações", placeholder="Resumo do relatório...",
                key="input_obs_lider_loja")

            texto_livre = st.text_area(
                "Detalhes do Relatório",
                placeholder="Escreva aqui os detalhes completos do relatório...",
                height=250,
                key="input_texto_lider_loja"
            )

            col_enviar, col_cancelar = st.columns(2)
            with col_enviar:
                if st.button("📤 Enviar para Admin", type="primary", key="btn_enviar_lider_loja"):
                    if observacoes or texto_livre:
                        supabase.table("relatorios").insert({
                            "usuario_id": st.session_state.usuario_id,
                            "data_relatorio": str(data_rel),
                            "cliente_visitado": "",
                            "atividade_realizada": "",
                            "observacoes": observacoes,
                            "texto_livre": texto_livre,
                            "destinatario": "admin"
                        }).execute()
                        # Fechar formulário e mostrar sucesso
                        st.session_state.mostrar_form_relatorio_loja = False
                        st.session_state.relatorio_enviado_loja = True
                        st.rerun()
                    else:
                        st.warning("Preencha pelo menos um campo!")
            with col_cancelar:
                if st.button("❌ Cancelar", key="btn_cancelar_rel_loja"):
                    st.session_state.mostrar_form_relatorio_loja = False
                    st.rerun()

        # Histórico de relatórios enviados
        st.markdown("---")
        st.subheader("📋 Meus Relatórios Enviados")

        result = supabase.table("relatorios").select(
            "id, data_relatorio, observacoes, texto_livre, criado_em, lido"
        ).eq("usuario_id", st.session_state.usuario_id).order("data_relatorio", desc=True).limit(20).execute()

        relatorios = result.data if result.data else []

        if relatorios:
            for rel in relatorios:
                # Mostrar ícone de lido/não lido no título
                status_icon = "✅" if rel.get('lido') else "📅"
                with st.expander(f"{status_icon} {rel['data_relatorio']} - Relatório"):
                    st.markdown(f"**Observações:** {rel['observacoes'] or '-'}")
                    st.markdown("**Detalhes:**")
                    st.text(rel['texto_livre'] or '-')
                    st.caption(f"Enviado em: {rel['criado_em']}")

                    # Checkbox para marcar como lido
                    lido_atual = rel.get('lido', False) or False
                    novo_lido = st.checkbox(
                        "Marcar como lido",
                        value=lido_atual,
                        key=f"check_lido_{rel['id']}"
                    )
                    if novo_lido != lido_atual:
                        supabase.table("relatorios").update({"lido": novo_lido}).eq("id", rel['id']).execute()
                        st.rerun()

                    if st.button("🗑️ Excluir", key=f"del_rel_loja_{rel['id']}"):
                        supabase.table("relatorios").delete().eq("id", rel['id']).execute()
                        st.rerun()
        else:
            st.info("Você ainda não enviou nenhum relatório.")

    # === ABA: DEVEMOS ===
    with tab2:
        # Sub-abas: Pendentes e Devolvidos
        subtab1, subtab2 = st.tabs(["📋 Pendentes", "✅ Devolvidos"])
        
        with subtab1:
            st.subheader("💰 Devemos (Pendentes)")

        # Controle para mostrar/ocultar formulário
        if "mostrar_form_devemos" not in st.session_state:
            st.session_state.mostrar_form_devemos = False
        if "devemos_salvo" not in st.session_state:
            st.session_state.devemos_salvo = False

        # Mostrar mensagem de sucesso se acabou de salvar
        if st.session_state.devemos_salvo:
            st.success("✅ Registro salvo com sucesso!")
            st.session_state.devemos_salvo = False

        # Botão para abrir formulário
        if not st.session_state.mostrar_form_devemos:
            if st.button("➕ Novo Registro", type="primary", key="btn_novo_devemos"):
                st.session_state.mostrar_form_devemos = True
                st.rerun()
        else:
            # Formulário para adicionar novo registro
            st.markdown("### ➕ Novo Registro")

            nome_loja_devemos = st.text_input(
                "Nome da Loja/Fornecedor",
                placeholder="Digite o nome da loja...",
                key="nome_loja_devemos"
            )

            produtos_devemos = st.text_area(
                "Lista de Produtos",
                placeholder="Liste os produtos que devemos (um por linha ou separados por vírgula)...",
                height=150,
                key="produtos_devemos"
            )

            col_salvar, col_cancelar = st.columns(2)
            with col_salvar:
                if st.button("💾 Salvar Registro", type="primary", key="btn_salvar_devemos"):
                    if nome_loja_devemos.strip():
                        supabase.table("devemos").insert({
                            "usuario_id": st.session_state.usuario_id,
                            "nome_loja": nome_loja_devemos.strip(),
                            "produtos": produtos_devemos,
                            "devolvido": False
                        }).execute()
                        st.session_state.mostrar_form_devemos = False
                        st.session_state.devemos_salvo = True
                        st.rerun()
                    else:
                        st.warning("Informe o nome da loja!")
            with col_cancelar:
                if st.button("❌ Cancelar", key="btn_cancelar_devemos"):
                    st.session_state.mostrar_form_devemos = False
                    st.rerun()

        # Lista de registros existentes
        st.markdown("---")
        st.subheader("📋 Registros de Devemos")

        result_devemos = supabase.table("devemos").select(
            "id, nome_loja, produtos, criado_em, atualizado_em"
        ).eq("usuario_id", st.session_state.usuario_id).eq("devolvido", False).order("criado_em", desc=True).execute()

        registros_devemos = result_devemos.data if result_devemos.data else []

        if registros_devemos:
            for reg in registros_devemos:
                # Controle de edição
                    edit_key = f"edit_devemos_{reg['id']}"
                    if edit_key not in st.session_state:
                        st.session_state[edit_key] = False

                    with st.expander(f"🏪 {reg['nome_loja']}", expanded=st.session_state[edit_key]):
                        if st.session_state[edit_key]:
                            # Modo de edição
                            st.markdown("### ✏️ Editando Registro")
                            edit_nome = st.text_input("Nome da Loja/Fornecedor", value=reg['nome_loja'], key=f"edit_nome_devemos_{reg['id']}")
                            edit_produtos = st.text_area("Lista de Produtos", value=reg['produtos'] or "", height=150, key=f"edit_produtos_devemos_{reg['id']}")
                            
                            col_salvar, col_cancelar = st.columns(2)
                            with col_salvar:
                                if st.button("💾 Salvar", key=f"save_devemos_{reg['id']}", type="primary"):
                                    from datetime import datetime
                                    supabase.table("devemos").update({
                                        "nome_loja": edit_nome,
                                        "produtos": edit_produtos,
                                        "atualizado_em": datetime.now().isoformat()
                                    }).eq("id", reg['id']).execute()
                                    st.session_state[edit_key] = False
                                    st.success("✅ Registro atualizado!")
                                    st.rerun()
                            with col_cancelar:
                                if st.button("❌ Cancelar", key=f"cancel_edit_devemos_{reg['id']}"):
                                    st.session_state[edit_key] = False
                                    st.rerun()
                        else:
                            # Modo de visualização
                            st.markdown("**Produtos:**")
                            st.text(reg['produtos'] or '-')
                            st.caption(f"Criado em: {reg['criado_em']}")

                            col1, col2, col3 = st.columns(3)
                            with col1:
                                if st.button("✏️ Editar", key=f"btn_edit_devemos_{reg['id']}"):
                                    st.session_state[edit_key] = True
                                    st.rerun()
                            with col2:
                                if st.button("✅ Marcar como Devolvido", key=f"devolver_devemos_{reg['id']}", type="primary"):
                                    from datetime import datetime
                                    supabase.table("devemos").update({
                                        "devolvido": True,
                                        "data_devolucao": datetime.now().isoformat()
                                    }).eq("id", reg['id']).execute()
                                    st.success("✅ Marcado como devolvido!")
                                    st.rerun()
                            with col3:
                                if st.button("🗑️ Excluir", key=f"del_devemos_{reg['id']}"):
                                    supabase.table("devemos").delete().eq("id", reg['id']).execute()
                                    st.rerun()
        else:
            st.info("Nenhum registro pendente de 'Devemos'.")
        
        with subtab2:
            st.subheader("✅ Devolvidos")
            
            result_devolvidos = supabase.table("devemos").select(
                "id, nome_loja, produtos, criado_em, data_devolucao"
            ).eq("usuario_id", st.session_state.usuario_id).eq("devolvido", True).order("data_devolucao", desc=True).execute()

            registros_devolvidos = result_devolvidos.data if result_devolvidos.data else []

            if registros_devolvidos:
                for reg in registros_devolvidos:
                    with st.expander(f"🏪 {reg['nome_loja']} - Devolvido em {reg['data_devolucao'][:10] if reg['data_devolucao'] else 'Data não registrada'}", expanded=False):
                        st.markdown("**Produtos:**")
                        st.text(reg['produtos'] or '-')
                        st.caption(f"Registrado em: {reg['criado_em']}")
                        st.caption(f"✅ Devolvido em: {reg['data_devolucao']}")
                        
                        col1, col2 = st.columns(2)
                        with col1:
                            if st.button("↩️ Marcar como Pendente", key=f"reabrir_devemos_{reg['id']}"):
                                supabase.table("devemos").update({
                                    "devolvido": False,
                                    "data_devolucao": None
                                }).eq("id", reg['id']).execute()
                                st.rerun()
                        with col2:
                            if st.button("🗑️ Excluir", key=f"del_devolvido_devemos_{reg['id']}"):
                                supabase.table("devemos").delete().eq("id", reg['id']).execute()
                                st.rerun()
            else:
                st.info("Nenhum registro devolvido.")

    # === ABA: MATERIAIS EMPRESTADOS ===
    with tab3:
        st.subheader("📦 Materiais Emprestados")

        # Controle para mostrar/ocultar formulário
        if "mostrar_form_emprestados" not in st.session_state:
            st.session_state.mostrar_form_emprestados = False
        if "emprestados_salvo" not in st.session_state:
            st.session_state.emprestados_salvo = False

        # Mostrar mensagem de sucesso se acabou de salvar
        if st.session_state.emprestados_salvo:
            st.success("✅ Registro salvo com sucesso!")
            st.session_state.emprestados_salvo = False

        # Botão para abrir formulário
        if not st.session_state.mostrar_form_emprestados:
            if st.button("➕ Novo Registro", type="primary", key="btn_novo_emprestados"):
                st.session_state.mostrar_form_emprestados = True
                st.rerun()
        else:
            # Formulário para adicionar novo registro
            st.markdown("### ➕ Novo Registro")

            nome_loja_emprestados = st.text_input(
                "Nome da Loja",
                placeholder="Digite o nome da loja...",
                key="nome_loja_emprestados"
            )

            produtos_emprestados = st.text_area(
                "Lista de Materiais Emprestados",
                placeholder="Liste os materiais emprestados (um por linha ou separados por vírgula)...",
                height=150,
                key="produtos_emprestados"
            )

            col_salvar, col_cancelar = st.columns(2)
            with col_salvar:
                if st.button("💾 Salvar Registro", type="primary", key="btn_salvar_emprestados"):
                    if nome_loja_emprestados.strip():
                        supabase.table("materiais_emprestados").insert({
                            "usuario_id": st.session_state.usuario_id,
                            "nome_loja": nome_loja_emprestados.strip(),
                            "produtos": produtos_emprestados
                        }).execute()
                        st.session_state.mostrar_form_emprestados = False
                        st.session_state.emprestados_salvo = True
                        st.rerun()
                    else:
                        st.warning("Informe o nome da loja!")
            with col_cancelar:
                if st.button("❌ Cancelar", key="btn_cancelar_emprestados"):
                    st.session_state.mostrar_form_emprestados = False
                    st.rerun()

        # Lista de registros existentes
        st.markdown("---")
        st.subheader("📋 Registros de Materiais Emprestados")

        result_emprestados = supabase.table("materiais_emprestados").select(
            "id, nome_loja, produtos, criado_em, atualizado_em"
        ).eq("usuario_id", st.session_state.usuario_id).order("criado_em", desc=True).execute()

        registros_emprestados = result_emprestados.data if result_emprestados.data else []

        if registros_emprestados:
            for reg in registros_emprestados:
                with st.expander(f"🏪 {reg['nome_loja']}", expanded=False):
                    st.markdown("**Materiais:**")
                    st.text(reg['produtos'] or '-')
                    st.caption(f"Criado em: {reg['criado_em']}")

                    if st.button("🗑️ Excluir", key=f"del_emprestados_{reg['id']}"):
                        supabase.table("materiais_emprestados").delete().eq("id", reg['id']).execute()
                        st.rerun()
        else:
            st.info("Nenhum registro de materiais emprestados cadastrado.")


# === TELA DO FUNCIONÁRIO ===


def tela_funcionario():
    # Controle de confirmação de saída
    if "confirmar_sair" not in st.session_state:
        st.session_state.confirmar_sair = False

    # Cabeçalho compacto com botão sair
    col1, col2 = st.columns([5, 1])
    with col1:
        st.markdown(f"**📝 {st.session_state.usuario_nome}**")
    with col2:
        if st.button("🚪"):
            st.session_state.confirmar_sair = True
            st.rerun()

    # Modal de confirmação de saída
    if st.session_state.confirmar_sair:
        st.warning("⚠️ Deseja realmente sair do sistema?")
        col_sim, col_nao = st.columns(2)
        with col_sim:
            if st.button("✅ Sim, sair", type="primary"):
                st.session_state.confirmar_sair = False
                fazer_logout()
                st.rerun()
        with col_nao:
            if st.button("❌ Não, voltar"):
                st.session_state.confirmar_sair = False
                st.rerun()

    # Controle para fechar o formulário após envio
    if "aba_relatorio" not in st.session_state:
        st.session_state.aba_relatorio = 0

    # Verificar se é líder dos coloristas
    cargo_usuario = st.session_state.get('usuario_cargo', 'colorista')
    eh_lider = cargo_usuario == 'lider_colorista'

    # Abas diferentes para líder e coloristas normais
    if eh_lider:
        tab1, tab2, tab3, tab4, tab5 = st.tabs([
            "📨 Relatórios da Equipe",
            "✏️ Relatório para Admin",
            "📋 Meu Histórico",
            "📁 Minhas Anotações",
            "🧪 Fórmulas Personalizadas"
        ])
    else:
        tab1, tab2, tab3, tab4 = st.tabs([
            "✏️ Relatório para Nilton",
            "📋 Meu Histórico",
            "📁 Minhas Anotações",
            "🧪 Fórmulas Personalizadas"
        ])

    # === ABA: NOVO RELATÓRIO (COLORISTAS) ou RELATÓRIOS DA EQUIPE (LÍDER) ===
    with tab1:
        if eh_lider:
            # LÍDER: Ver relatórios dos coloristas
            st.subheader("📨 Relatórios dos Coloristas")

            # Buscar relatórios destinados ao líder (limite de 50)
            relatorios_result = supabase.table("relatorios").select("id, data_relatorio, observacoes, texto_livre, criado_em, lido, usuarios(nome)").eq("destinatario", "lider").order("data_relatorio", desc=True).limit(50).execute()
            relatorios_equipe = relatorios_result.data if relatorios_result.data else []

            st.metric("Total de Relatórios", len(relatorios_equipe))
            st.markdown("---")

            if relatorios_equipe:
                for rel in relatorios_equipe:
                    status_icon = "✅" if rel.get('lido') else "📅"
                    nome_colorista = rel["usuarios"]["nome"] if rel.get("usuarios") else "N/A"

                    with st.expander(f"{status_icon} {rel['data_relatorio']} - {nome_colorista}"):
                        st.markdown(f"**Colorista:** {nome_colorista}")
                        st.markdown(f"**Observações:** {rel['observacoes'] or '-'}")
                        st.markdown("**Detalhes:**")
                        st.text(rel['texto_livre'] or '-')
                        st.caption(f"Enviado em: {rel['criado_em']}")

                        # Checkbox para marcar como lido
                        lido_atual = rel.get('lido', False) or False
                        novo_lido = st.checkbox(
                            "Marcar como lido",
                            value=lido_atual,
                            key=f"lider_check_lido_{rel['id']}"
                        )
                        if novo_lido != lido_atual:
                            supabase.table("relatorios").update({"lido": novo_lido}).eq("id", rel['id']).execute()
                            st.rerun()
            else:
                st.info("Nenhum relatório recebido.")
        else:
            # COLORISTAS: Enviar relatório para o líder
            st.subheader("📨 Relatório para Nilton")

            # Controle para mostrar/ocultar formulário
            if "mostrar_form_colorista" not in st.session_state:
                st.session_state.mostrar_form_colorista = False
            if "relatorio_enviado_colorista" not in st.session_state:
                st.session_state.relatorio_enviado_colorista = False

            # Mostrar mensagem de sucesso
            if st.session_state.relatorio_enviado_colorista:
                st.success("✅ Relatório enviado para Nilton com sucesso!")
                st.session_state.relatorio_enviado_colorista = False

            if not st.session_state.mostrar_form_colorista:
                st.info("Clique no botão abaixo para criar um novo relatório.")
                if st.button("➕ Novo Relatório", type="primary", key="btn_novo_rel_colorista"):
                    st.session_state.mostrar_form_colorista = True
                    st.rerun()
            else:
                st.markdown("### ✏️ Novo Relatório")

                data_rel = st.date_input("Data do Relatório", value=date.today())
                observacoes = st.text_input("Observações", placeholder="Pontos importantes...", key="input_obs")
                texto_livre = st.text_area(
                    "Detalhes do Relatório",
                    placeholder="Escreva aqui os detalhes completos do relatório...",
                    height=250,
                    key="input_texto"
                )

                col_enviar, col_cancelar = st.columns(2)
                with col_enviar:
                    if st.button("📤 Enviar para Nilton", type="primary"):
                        if observacoes or texto_livre:
                            supabase.table("relatorios").insert({
                                "usuario_id": st.session_state.usuario_id,
                                "data_relatorio": str(data_rel),
                                "cliente_visitado": "",
                                "atividade_realizada": "",
                                "observacoes": observacoes,
                                "texto_livre": texto_livre,
                                "destinatario": "lider"
                            }).execute()
                            st.session_state.mostrar_form_colorista = False
                            st.session_state.relatorio_enviado_colorista = True
                            st.rerun()
                        else:
                            st.warning("Preencha pelo menos um campo!")
                with col_cancelar:
                    if st.button("❌ Cancelar", key="btn_cancelar_colorista"):
                        st.session_state.mostrar_form_colorista = False
                        st.rerun()

    # === ABA: RELATÓRIO PARA ADMIN (APENAS LÍDER) ===
    if eh_lider:
        with tab2:
            st.subheader("📤 Relatório Consolidado para Admin")

            # Controle para mostrar/ocultar formulário
            if "mostrar_form_nilton_admin" not in st.session_state:
                st.session_state.mostrar_form_nilton_admin = False
            if "relatorio_enviado_nilton" not in st.session_state:
                st.session_state.relatorio_enviado_nilton = False

            # Mostrar mensagem de sucesso
            if st.session_state.relatorio_enviado_nilton:
                st.success("✅ Relatório consolidado enviado para o Admin!")
                st.session_state.relatorio_enviado_nilton = False

            if not st.session_state.mostrar_form_nilton_admin:
                st.info("Clique no botão abaixo para criar um novo relatório consolidado.")
                if st.button("➕ Novo Relatório", type="primary", key="btn_novo_rel_nilton"):
                    st.session_state.mostrar_form_nilton_admin = True
                    st.rerun()
            else:
                st.markdown("### ✏️ Novo Relatório Consolidado")

                data_rel_admin = st.date_input("Data do Relatório", value=date.today(), key="data_admin")
                observacoes_admin = st.text_input("Observações", placeholder="Resumo geral...", key="input_obs_admin")
                texto_livre_admin = st.text_area(
                    "Relatório Consolidado",
                    placeholder="Escreva aqui o relatório consolidado da equipe para o administrador...",
                    height=300,
                    key="input_texto_admin"
                )

                col_enviar, col_cancelar = st.columns(2)
                with col_enviar:
                    if st.button("📤 Enviar para Admin", type="primary", key="btn_enviar_admin"):
                        if observacoes_admin or texto_livre_admin:
                            supabase.table("relatorios").insert({
                                "usuario_id": st.session_state.usuario_id,
                                "data_relatorio": str(data_rel_admin),
                                "cliente_visitado": "",
                                "atividade_realizada": "",
                                "observacoes": observacoes_admin,
                                "texto_livre": texto_livre_admin,
                                "destinatario": "admin"
                            }).execute()
                            st.session_state.mostrar_form_nilton_admin = False
                            st.session_state.relatorio_enviado_nilton = True
                            st.rerun()
                        else:
                            st.warning("Preencha pelo menos um campo!")
                with col_cancelar:
                    if st.button("❌ Cancelar", key="btn_cancelar_nilton"):
                        st.session_state.mostrar_form_nilton_admin = False
                        st.rerun()

    # === ABA: HISTÓRICO ===
    # Para líder é tab3, para colorista é tab2
    aba_historico = tab3 if eh_lider else tab2
    with aba_historico:
        st.subheader("Meus Relatórios Enviados")

        result = supabase.table("relatorios").select("id, data_relatorio, cliente_visitado, atividade_realizada, observacoes, texto_livre, criado_em").eq("usuario_id", st.session_state.usuario_id).order("data_relatorio", desc=True).limit(30).execute()
        relatorios = [(r["id"], r["data_relatorio"], r["cliente_visitado"], r["atividade_realizada"], r["observacoes"], r["texto_livre"], r["criado_em"]) for r in result.data] if result.data else []

        if relatorios:
            for rel in relatorios:
                rel_id = rel[0]
                edit_key = f"edit_mode_{rel_id}"
                expand_key = f"expand_{rel_id}"
                if edit_key not in st.session_state:
                    st.session_state[edit_key] = False
                if expand_key not in st.session_state:
                    st.session_state[expand_key] = False

                # Expande automaticamente ao clicar em editar ou excluir
                confirm_key = f"confirmar_excluir_{rel_id}"
                if confirm_key not in st.session_state:
                    st.session_state[confirm_key] = False

                if st.session_state[edit_key] or st.session_state[confirm_key]:
                    st.session_state[expand_key] = True

                with st.expander(f"📅 {rel[1]} - Relatório", expanded=st.session_state[expand_key]):
                    if st.session_state[edit_key]:
                        st.markdown("### ✏️ Editando Relatório")
                        edit_obs = st.text_input(
                            "Observações", value=rel[4] or "", key=f"obs_{rel_id}")
                        edit_texto = st.text_area(
                            "Detalhes do Relatório", value=rel[5] or "", height=200, key=f"texto_{rel_id}")
                        col_salvar, col_cancelar = st.columns(2)
                        with col_salvar:
                            if st.button("💾 Salvar", key=f"salvar_{rel_id}", type="primary"):
                                supabase.table("relatorios").update({
                                    "observacoes": edit_obs,
                                    "texto_livre": edit_texto
                                }).eq("id", rel_id).eq("usuario_id", st.session_state.usuario_id).execute()
                                st.session_state[edit_key] = False
                                st.session_state[expand_key] = False
                                st.success("Relatório atualizado!")
                                st.experimental_rerun()
                        with col_cancelar:
                            if st.button("❌ Cancelar", key=f"cancelar_{rel_id}"):
                                st.session_state[edit_key] = False
                                st.session_state[expand_key] = False
                                st.experimental_rerun()
                    else:
                        st.markdown(f"**Observações:** {rel[4] or '-'}")
                        st.markdown("**Detalhes:**")
                        st.text(rel[5] or '-')
                        st.caption(f"Enviado em: {rel[6]}")
                        col_editar, col_excluir = st.columns([1, 1])
                        with col_editar:
                            if st.button("✏️ Editar", key=f"editar_{rel_id}"):
                                st.session_state[edit_key] = True
                                st.session_state[expand_key] = True
                                st.rerun()
                        with col_excluir:
                            if not st.session_state[confirm_key]:
                                if st.button("🗑️ Excluir", key=f"excluir_{rel_id}"):
                                    st.session_state[confirm_key] = True
                                    st.rerun()
                            else:
                                st.warning("Tem certeza que deseja excluir este relatório?")
                                col_sim, col_nao = st.columns(2)
                                with col_sim:
                                    if st.button("✅ Sim, excluir", key=f"sim_excluir_{rel_id}"):
                                        supabase.table("relatorios").delete().eq("id", rel_id).eq("usuario_id", st.session_state.usuario_id).execute()
                                        st.session_state[confirm_key] = False
                                        st.success("Relatório excluído com sucesso!")
                                        st.rerun()
                                with col_nao:
                                    if st.button("❌ Cancelar", key=f"nao_excluir_{rel_id}"):
                                        st.session_state[confirm_key] = False
                                        st.rerun()
        else:
            st.info("Você ainda não enviou nenhum relatório.")

    # === ABA: MINHAS ANOTAÇÕES ===
    # Para líder é tab4, para colorista é tab3
    aba_anotacoes = tab4 if eh_lider else tab3
    with aba_anotacoes:
        st.subheader("📁 Minhas Anotações")

        # Busca inteligente
        busca = st.text_input("🔍 Buscar anotações pelo título", placeholder="Digite para buscar...")

        # Controle para mostrar/ocultar formulário de criação
        if "mostrar_form_anotacao" not in st.session_state:
            st.session_state.mostrar_form_anotacao = False

        # Botão para abrir formulário
        if not st.session_state.mostrar_form_anotacao:
            if st.button("➕ Criar Nova Anotação"):
                st.session_state.mostrar_form_anotacao = True
                st.rerun()
        else:
            # Formulário de criação
            st.markdown("### ➕ Nova Anotação")
            novo_titulo = st.text_input("Título da Anotação", key="novo_titulo_anotacao")
            novo_conteudo = st.text_area("Conteúdo", height=150, key="novo_conteudo_anotacao")
            novas_imagens = st.file_uploader("📷 Adicionar Imagens (opcional)", type=["png", "jpg", "jpeg", "gif"], key="novas_imagens_anotacao", accept_multiple_files=True)

            col_salvar, col_cancelar = st.columns(2)
            with col_salvar:
                if st.button("💾 Salvar Anotação", type="primary"):
                    if novo_titulo.strip():
                        result = supabase.table("anotacoes").insert({
                            "usuario_id": st.session_state.usuario_id,
                            "titulo": novo_titulo.strip(),
                            "conteudo": novo_conteudo
                        }).execute()
                        anotacao_id = result.data[0]["id"] if result.data else None

                        # Salvar imagens se houver
                        if anotacao_id:
                            for img in novas_imagens:
                                img_bytes = img.read()
                                img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                                supabase.table("anotacoes_imagens").insert({
                                    "anotacao_id": anotacao_id,
                                    "imagem": img_base64
                                }).execute()
                        # Fechar formulário e limpar campos
                        st.session_state.mostrar_form_anotacao = False
                        if "novo_titulo_anotacao" in st.session_state:
                            del st.session_state.novo_titulo_anotacao
                        if "novo_conteudo_anotacao" in st.session_state:
                            del st.session_state.novo_conteudo_anotacao
                        if "novas_imagens_anotacao" in st.session_state:
                            del st.session_state.novas_imagens_anotacao
                        st.success("Anotação criada com sucesso!")
                        st.rerun()
                    else:
                        st.error("O título é obrigatório!")
            with col_cancelar:
                if st.button("❌ Cancelar"):
                    st.session_state.mostrar_form_anotacao = False
                    if "novo_titulo_anotacao" in st.session_state:
                        del st.session_state.novo_titulo_anotacao
                    if "novo_conteudo_anotacao" in st.session_state:
                        del st.session_state.novo_conteudo_anotacao
                    if "novas_imagens_anotacao" in st.session_state:
                        del st.session_state.novas_imagens_anotacao
                    st.rerun()

        st.markdown("---")

        # Listar anotações
        if busca.strip():
            # Busca inteligente - procura palavras parciais no título
            query = supabase.table("anotacoes").select("id, titulo, conteudo, criado_em, atualizado_em").eq("usuario_id", st.session_state.usuario_id)
            for termo in busca.strip().split():
                query = query.ilike("titulo", f"%{termo}%")
            result = query.order("atualizado_em", desc=True).execute()
        else:
            result = supabase.table("anotacoes").select("id, titulo, conteudo, criado_em, atualizado_em").eq("usuario_id", st.session_state.usuario_id).order("atualizado_em", desc=True).execute()
        anotacoes = [(r["id"], r["titulo"], r["conteudo"], r["criado_em"], r["atualizado_em"]) for r in result.data] if result.data else []

        if anotacoes:
            st.caption(f"📂 {len(anotacoes)} anotação(ões) encontrada(s)")

            for anot in anotacoes:
                anot_id = anot[0]
                edit_anot_key = f"edit_anot_{anot_id}"
                confirm_del_anot_key = f"confirm_del_anot_{anot_id}"

                if edit_anot_key not in st.session_state:
                    st.session_state[edit_anot_key] = False
                if confirm_del_anot_key not in st.session_state:
                    st.session_state[confirm_del_anot_key] = False

                with st.expander(f"📄 {anot[1]}", expanded=st.session_state[edit_anot_key] or st.session_state[confirm_del_anot_key]):
                    # Buscar imagens da anotação
                    result_imgs = supabase.table("anotacoes_imagens").select("id, imagem").eq("anotacao_id", anot_id).execute()
                    imagens_anot = [(r["id"], base64.b64decode(r["imagem"]) if r["imagem"] else None) for r in result_imgs.data] if result_imgs.data else []

                    if st.session_state[edit_anot_key]:
                        # Modo edição
                        edit_titulo = st.text_input("Título", value=anot[1], key=f"edit_titulo_{anot_id}")
                        edit_conteudo = st.text_area("Conteúdo", value=anot[2] or "", height=150, key=f"edit_conteudo_{anot_id}")

                        # Mostrar imagens atuais
                        if imagens_anot:
                            st.markdown("**Imagens atuais:**")
                            for img_data in imagens_anot:
                                img_id, img_blob = img_data
                                col_img, col_del = st.columns([4, 1])
                                with col_img:
                                    st.image(img_blob, width=150)
                                with col_del:
                                    if st.button("🗑️", key=f"del_img_anot_{img_id}"):
                                        supabase.table("anotacoes_imagens").delete().eq("id", img_id).execute()
                                        st.rerun()

                        # Adicionar novas imagens
                        novas_imgs_edit = st.file_uploader("📷 Adicionar mais imagens", type=["png", "jpg", "jpeg", "gif"], key=f"add_imgs_{anot_id}", accept_multiple_files=True)

                        col_salvar, col_cancelar = st.columns(2)
                        with col_salvar:
                            if st.button("💾 Salvar", key=f"salvar_anot_{anot_id}", type="primary"):
                                if edit_titulo.strip():
                                    supabase.table("anotacoes").update({
                                        "titulo": edit_titulo.strip(),
                                        "conteudo": edit_conteudo,
                                        "atualizado_em": datetime.now().isoformat()
                                    }).eq("id", anot_id).eq("usuario_id", st.session_state.usuario_id).execute()

                                    # Adicionar novas imagens
                                    for img in novas_imgs_edit:
                                        img_bytes = img.read()
                                        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                                        supabase.table("anotacoes_imagens").insert({
                                            "anotacao_id": anot_id,
                                            "imagem": img_base64
                                        }).execute()
                                    st.session_state[edit_anot_key] = False
                                    st.success("Anotação atualizada!")
                                    st.rerun()
                                else:
                                    st.error("O título é obrigatório!")
                        with col_cancelar:
                            if st.button("❌ Cancelar", key=f"cancelar_anot_{anot_id}"):
                                st.session_state[edit_anot_key] = False
                                st.rerun()
                    else:
                        # Modo visualização
                        if anot[2]:
                            st.text(anot[2])
                        else:
                            st.caption("(Sem conteúdo)")

                        # Exibir imagens (miniaturas clicáveis)
                        if imagens_anot:
                            st.markdown(f"**📷 {len(imagens_anot)} imagem(ns):**")
                            for img_data in imagens_anot:
                                img_id_view = img_data[0]
                                # Miniatura clicável
                                if st.button("🖼️ Ver imagem", key=f"view_img_anot_{img_id_view}"):
                                    st.session_state[f"show_img_{img_id_view}"] = True

                                # Mostrar imagem expandida
                                if st.session_state.get(f"show_img_{img_id_view}", False):
                                    st.image(img_data[1], use_column_width=True)
                                    if st.button("❌ Fechar", key=f"close_img_anot_{img_id_view}"):
                                        st.session_state[f"show_img_{img_id_view}"] = False
                                        st.rerun()
                                else:
                                    st.image(img_data[1], width=100)

                        st.caption(f"Criado em: {anot[3]} | Atualizado em: {anot[4]}")

                        col_editar, col_excluir = st.columns([1, 1])
                        with col_editar:
                            if st.button("✏️ Editar", key=f"editar_anot_{anot_id}"):
                                st.session_state[edit_anot_key] = True
                                st.rerun()
                        with col_excluir:
                            if not st.session_state[confirm_del_anot_key]:
                                if st.button("🗑️ Excluir", key=f"excluir_anot_{anot_id}"):
                                    st.session_state[confirm_del_anot_key] = True
                                    st.rerun()
                            else:
                                st.warning("Tem certeza que deseja excluir esta anotação?")
                                col_sim, col_nao = st.columns(2)
                                with col_sim:
                                    if st.button("✅ Sim", key=f"sim_del_anot_{anot_id}"):
                                        # Excluir imagens primeiro
                                        supabase.table("anotacoes_imagens").delete().eq("anotacao_id", anot_id).execute()
                                        # Excluir anotação
                                        supabase.table("anotacoes").delete().eq("id", anot_id).eq("usuario_id", st.session_state.usuario_id).execute()
                                        st.session_state[confirm_del_anot_key] = False
                                        st.success("Anotação excluída!")
                                        st.rerun()
                                with col_nao:
                                    if st.button("❌ Não", key=f"nao_del_anot_{anot_id}"):
                                        st.session_state[confirm_del_anot_key] = False
                                        st.rerun()
        else:
            if busca.strip():
                st.info(f"Nenhuma anotação encontrada para '{busca}'")
            else:
                st.info("Você ainda não tem anotações. Crie sua primeira anotação acima!")

    # === ABA: FÓRMULAS PERSONALIZADAS (COMPARTILHADA) ===
    # Para líder é tab5, para colorista é tab4
    aba_formulas = tab5 if eh_lider else tab4
    with aba_formulas:
        st.subheader("🧪 Fórmulas Personalizadas")
        st.caption("Fórmulas compartilhadas entre todos os usuários")

        # Busca inteligente
        busca_formula = st.text_input("🔍 Buscar fórmulas pelo título", placeholder="Digite para buscar...", key="busca_formula")

        # Controle para mostrar/ocultar formulário de criação
        if "mostrar_form_formula" not in st.session_state:
            st.session_state.mostrar_form_formula = False

        # Botão para abrir formulário
        if not st.session_state.mostrar_form_formula:
            if st.button("➕ Criar Nova Fórmula", key="btn_criar_formula"):
                st.session_state.mostrar_form_formula = True
                st.rerun()
        else:
            # Formulário de criação
            st.markdown("### ➕ Nova Fórmula")
            novo_titulo_formula = st.text_input("Título da Fórmula", key="novo_titulo_formula")
            novo_conteudo_formula = st.text_area("Conteúdo", height=150, key="novo_conteudo_formula")
            novas_imagens_formula = st.file_uploader("📷 Adicionar Imagens (opcional)", type=["png", "jpg", "jpeg", "gif"], key="novas_imagens_formula", accept_multiple_files=True)

            col_salvar, col_cancelar = st.columns(2)
            with col_salvar:
                if st.button("💾 Salvar Fórmula", type="primary", key="btn_salvar_formula"):
                    if novo_titulo_formula.strip():
                        result = supabase.table("formulas").insert({
                            "titulo": novo_titulo_formula.strip(),
                            "conteudo": novo_conteudo_formula,
                            "criado_por": st.session_state.usuario_id
                        }).execute()
                        formula_id = result.data[0]["id"] if result.data else None

                        # Salvar imagens se houver
                        if formula_id:
                            for img in novas_imagens_formula:
                                img_bytes = img.read()
                                img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                                supabase.table("formulas_imagens").insert({
                                    "formula_id": formula_id,
                                    "imagem": img_base64
                                }).execute()
                        # Fechar formulário e limpar campos
                        st.session_state.mostrar_form_formula = False
                        if "novo_titulo_formula" in st.session_state:
                            del st.session_state.novo_titulo_formula
                        if "novo_conteudo_formula" in st.session_state:
                            del st.session_state.novo_conteudo_formula
                        if "novas_imagens_formula" in st.session_state:
                            del st.session_state.novas_imagens_formula
                        st.success("Fórmula criada com sucesso!")
                        st.rerun()
                    else:
                        st.error("O título é obrigatório!")
            with col_cancelar:
                if st.button("❌ Cancelar", key="btn_cancelar_formula"):
                    st.session_state.mostrar_form_formula = False
                    if "novo_titulo_formula" in st.session_state:
                        del st.session_state.novo_titulo_formula
                    if "novo_conteudo_formula" in st.session_state:
                        del st.session_state.novo_conteudo_formula
                    if "novas_imagens_formula" in st.session_state:
                        del st.session_state.novas_imagens_formula
                    st.rerun()

        st.markdown("---")

        # Listar fórmulas
        if busca_formula.strip():
            # Busca inteligente - procura palavras parciais no título
            query = supabase.table("formulas").select("id, titulo, conteudo, criado_em, atualizado_em, criado_por, atualizado_por")
            for termo in busca_formula.strip().split():
                query = query.ilike("titulo", f"%{termo}%")
            result = query.order("atualizado_em", desc=True).execute()
        else:
            result = supabase.table("formulas").select("id, titulo, conteudo, criado_em, atualizado_em, criado_por, atualizado_por").order("atualizado_em", desc=True).execute()
        formulas = [(r["id"], r["titulo"], r["conteudo"], r["criado_em"], r["atualizado_em"], r.get("criado_por"), r.get("atualizado_por")) for r in result.data] if result.data else []

        if formulas:
            st.caption(f"🧪 {len(formulas)} fórmula(s) encontrada(s)")

            for formula in formulas:
                formula_id = formula[0]
                edit_formula_key = f"edit_formula_{formula_id}"
                confirm_del_formula_key = f"confirm_del_formula_{formula_id}"

                if edit_formula_key not in st.session_state:
                    st.session_state[edit_formula_key] = False
                if confirm_del_formula_key not in st.session_state:
                    st.session_state[confirm_del_formula_key] = False

                with st.expander(f"🧪 {formula[1]}", expanded=st.session_state[edit_formula_key] or st.session_state[confirm_del_formula_key]):
                    # Buscar imagens da fórmula
                    result_imgs = supabase.table("formulas_imagens").select("id, imagem").eq("formula_id", formula_id).execute()
                    imagens_formula = [(r["id"], base64.b64decode(r["imagem"]) if r["imagem"] else None) for r in result_imgs.data] if result_imgs.data else []

                    if st.session_state[edit_formula_key]:
                        # Modo edição
                        edit_titulo_formula = st.text_input("Título", value=formula[1], key=f"edit_titulo_formula_{formula_id}")
                        edit_conteudo_formula = st.text_area("Conteúdo", value=formula[2] or "", height=150, key=f"edit_conteudo_formula_{formula_id}")

                        # Mostrar imagens atuais
                        if imagens_formula:
                            st.markdown("**Imagens atuais:**")
                            for img_data in imagens_formula:
                                img_id, img_blob = img_data
                                col_img, col_del = st.columns([4, 1])
                                with col_img:
                                    st.image(img_blob, width=150)
                                with col_del:
                                    if st.button("🗑️", key=f"del_img_formula_{img_id}"):
                                        supabase.table("formulas_imagens").delete().eq("id", img_id).execute()
                                        st.rerun()

                        # Adicionar novas imagens
                        novas_imgs_formula_edit = st.file_uploader("📷 Adicionar mais imagens", type=["png", "jpg", "jpeg", "gif"], key=f"add_imgs_formula_{formula_id}", accept_multiple_files=True)

                        col_salvar, col_cancelar = st.columns(2)
                        with col_salvar:
                            if st.button("💾 Salvar", key=f"salvar_formula_{formula_id}", type="primary"):
                                if edit_titulo_formula.strip():
                                    supabase.table("formulas").update({
                                        "titulo": edit_titulo_formula.strip(),
                                        "conteudo": edit_conteudo_formula,
                                        "atualizado_por": st.session_state.usuario_id,
                                        "atualizado_em": datetime.now().isoformat()
                                    }).eq("id", formula_id).execute()

                                    # Adicionar novas imagens
                                    for img in novas_imgs_formula_edit:
                                        img_bytes = img.read()
                                        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
                                        supabase.table("formulas_imagens").insert({
                                            "formula_id": formula_id,
                                            "imagem": img_base64
                                        }).execute()
                                    st.session_state[edit_formula_key] = False
                                    st.success("Fórmula atualizada!")
                                    st.rerun()
                                else:
                                    st.error("O título é obrigatório!")
                        with col_cancelar:
                            if st.button("❌ Cancelar", key=f"cancelar_formula_{formula_id}"):
                                st.session_state[edit_formula_key] = False
                                st.rerun()
                    else:
                        # Modo visualização
                        if formula[2]:
                            st.text(formula[2])
                        else:
                            st.caption("(Sem conteúdo)")

                        # Exibir imagens (miniaturas clicáveis)
                        if imagens_formula:
                            st.markdown(f"**📷 {len(imagens_formula)} imagem(ns):**")
                            for img_data in imagens_formula:
                                img_id_view = img_data[0]
                                # Miniatura clicável
                                if st.button("🖼️ Ver imagem", key=f"view_img_formula_{img_id_view}"):
                                    st.session_state[f"show_img_f_{img_id_view}"] = True

                                # Mostrar imagem expandida
                                if st.session_state.get(f"show_img_f_{img_id_view}", False):
                                    st.image(img_data[1], use_column_width=True)
                                    if st.button("❌ Fechar", key=f"close_img_formula_{img_id_view}"):
                                        st.session_state[f"show_img_f_{img_id_view}"] = False
                                        st.rerun()
                                else:
                                    st.image(img_data[1], width=100)

                        criado_por = formula[5] or "Desconhecido"
                        atualizado_por = formula[6] or "-"
                        st.caption(f"Criado por: {criado_por} em {formula[3]}")
                        if atualizado_por != "-":
                            st.caption(f"Última edição: {atualizado_por} em {formula[4]}")

                        col_editar, col_excluir = st.columns([1, 1])
                        with col_editar:
                            if st.button("✏️ Editar", key=f"editar_formula_{formula_id}"):
                                st.session_state[edit_formula_key] = True
                                st.rerun()
                        with col_excluir:
                            if not st.session_state[confirm_del_formula_key]:
                                if st.button("🗑️ Excluir", key=f"excluir_formula_{formula_id}"):
                                    st.session_state[confirm_del_formula_key] = True
                                    st.rerun()
                            else:
                                st.warning("Tem certeza que deseja excluir esta fórmula?")
                                col_sim, col_nao = st.columns(2)
                                with col_sim:
                                    if st.button("✅ Sim", key=f"sim_del_formula_{formula_id}"):
                                        # Excluir imagens primeiro
                                        supabase.table("formulas_imagens").delete().eq("formula_id", formula_id).execute()
                                        # Excluir fórmula
                                        supabase.table("formulas").delete().eq("id", formula_id).execute()
                                        st.session_state[confirm_del_formula_key] = False
                                        st.success("Fórmula excluída!")
                                        st.rerun()
                                with col_nao:
                                    if st.button("❌ Não", key=f"nao_del_formula_{formula_id}"):
                                        st.session_state[confirm_del_formula_key] = False
                                        st.rerun()
        else:
            if busca_formula.strip():
                st.info(f"Nenhuma fórmula encontrada para '{busca_formula}'")
            else:
                st.info("Ainda não há fórmulas cadastradas. Crie a primeira fórmula!")

# === GESTÃO DE USUÁRIOS (ADMIN) ===


def tela_gestao_usuarios():
    st.subheader("👥 Gestão de Usuários")

    tab_criar, tab_listar = st.tabs(["➕ Criar Usuário", "📋 Lista de Usuários"])

    with tab_criar:
        col1, col2 = st.columns(2)

        with col1:
            novo_nome = st.text_input(
                "Nome Completo", placeholder="Nome do funcionário")
            novo_login = st.text_input(
                "Login", placeholder="Login de acesso").lower()

        with col2:
            nova_senha = st.text_input(
                "Senha", type="password", placeholder="Senha inicial")
            novo_tipo = st.selectbox(
                "Tipo de Usuário", ["funcionario", "admin"])

        # Mostrar seleção de cargo apenas para funcionários
        novo_cargo = "colorista"  # Padrão
        if novo_tipo == "funcionario":
            novo_cargo = st.selectbox(
                "Cargo",
                ["colorista", "lider_colorista", "lider_loja"],
                format_func=lambda x: {
                    "colorista": "Colorista",
                    "lider_colorista": "Líder dos Coloristas (Nilton)",
                    "lider_loja": "Líder de Loja"
                }.get(x, x)
            )

        if st.button("✅ Criar Usuário", type="primary"):
            if novo_nome and novo_login and nova_senha:
                try:
                    supabase.table("usuarios").insert({
                        "nome": novo_nome,
                        "login": novo_login,
                        "senha": nova_senha,
                        "tipo": novo_tipo,
                        "cargo": novo_cargo
                    }).execute()
                    st.success(f"Usuário '{novo_login}' criado com sucesso!")
                    st.rerun()
                except Exception as e:
                    if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                        st.error("Este login já existe!")
                    else:
                        st.error(f"Erro ao criar usuário: {e}")
            else:
                st.warning("Preencha todos os campos!")

    with tab_listar:
        result = supabase.table("usuarios").select("id, nome, login, tipo, ativo, criado_em, cargo").order("tipo").order("cargo", desc=True).order("nome").execute()
        usuarios = [(u["id"], u["nome"], u["login"], u["tipo"], u["ativo"], u["criado_em"], u.get("cargo", "colorista")) for u in result.data] if result.data else []

        for user in usuarios:
            status = "✅ Ativo" if user[4] else "❌ Inativo"
            tipo_badge = "🔑 Admin" if user[3] == 'admin' else "👤 Funcionário"
            cargo_usuario = user[6] if len(user) > 6 and user[6] else "colorista"

            # Mostrar cargo para funcionários
            cargo_badge = ""
            if user[3] == 'funcionario':
                if cargo_usuario == 'lider_colorista':
                    cargo_badge = " - ⭐ Líder Coloristas"
                elif cargo_usuario == 'lider_loja':
                    cargo_badge = " - 🏪 Líder Loja"
                else:
                    cargo_badge = " - 🎨 Colorista"

            col1, col2, col3, col4 = st.columns([3, 1, 1, 1])

            with col1:
                st.markdown(
                    f"**{user[1]}** ({user[2]}) - {tipo_badge}{cargo_badge} - {status}")

            with col2:
                # Botão para definir como líder (apenas para funcionários que não são líderes)
                if user[3] == 'funcionario' and cargo_usuario != 'lider_colorista':
                    if st.button("⭐ Líder", key=f"lider_{user[0]}"):
                        # Remover líder anterior (só pode ter 1 líder)
                        supabase.table("usuarios").update({"cargo": "colorista"}).eq("cargo", "lider_colorista").execute()
                        # Definir novo líder
                        supabase.table("usuarios").update({"cargo": "lider_colorista"}).eq("id", user[0]).execute()
                        st.rerun()
                elif user[3] == 'funcionario' and cargo_usuario == 'lider_colorista':
                    if st.button("🎨 Colorista", key=f"colorista_{user[0]}"):
                        supabase.table("usuarios").update({"cargo": "colorista"}).eq("id", user[0]).execute()
                        st.rerun()

            with col3:
                if user[2] != 'admin':  # Não permite desativar o admin principal
                    novo_status = 0 if user[4] else 1
                    btn_label = "Desativar" if user[4] else "Ativar"
                    if st.button(btn_label, key=f"toggle_{user[0]}"):
                        supabase.table("usuarios").update({"ativo": novo_status}).eq("id", user[0]).execute()
                        st.rerun()

            with col4:
                if user[2] != 'admin':  # Não permite excluir o admin principal
                    if st.button("🗑️", key=f"del_{user[0]}"):
                        supabase.table("usuarios").delete().eq("id", user[0]).execute()
                        st.rerun()

            st.markdown("---")

# === VISUALIZAÇÃO DE RELATÓRIOS (ADMIN) ===


def tela_relatorios_admin():
    st.subheader("📊 Relatórios da Equipe")

    # Filtro por funcionário
    result_func = supabase.table("usuarios").select("id, nome").eq("tipo", "funcionario").eq("ativo", 1).order("nome").execute()
    funcionarios = [(f["id"], f["nome"]) for f in result_func.data] if result_func.data else []

    opcoes_func = [("todos", "Todos os Funcionários")] + \
        [(str(f[0]), f[1]) for f in funcionarios]
    func_selecionado = st.selectbox(
        "Filtrar por Funcionário:",
        options=[o[0] for o in opcoes_func],
        format_func=lambda x: dict(opcoes_func)[x]
    )

    st.markdown("---")

    # Buscar relatórios (limite de 50)
    if func_selecionado == "todos":
        result_rel = supabase.table("relatorios").select("id, data_relatorio, observacoes, texto_livre, criado_em, lido, usuarios(nome)").order("data_relatorio", desc=True).limit(50).execute()
    else:
        result_rel = supabase.table("relatorios").select("id, data_relatorio, observacoes, texto_livre, criado_em, lido, usuarios(nome)").eq("usuario_id", int(func_selecionado)).order("data_relatorio", desc=True).limit(50).execute()

    relatorios = result_rel.data if result_rel.data else []

    # Estatísticas
    st.metric("Total de Relatórios", len(relatorios))

    st.markdown("---")

    # Exibir relatórios
    if relatorios:
        for rel in relatorios:
            # Mostrar ícone de lido/não lido no título
            status_icon = "✅" if rel.get('lido') else "📅"
            nome_func = rel["usuarios"]["nome"] if rel.get("usuarios") else "N/A"

            with st.expander(f"{status_icon} {rel['data_relatorio']} | 👤 {nome_func}", expanded=False):
                st.markdown(f"**Funcionário:** {nome_func}")
                st.markdown(f"**Data:** {rel['data_relatorio']}")
                st.markdown(f"**Observações:** {rel['observacoes'] or '-'}")

                st.markdown("---")
                st.markdown("**Detalhes Completos:**")
                st.text(rel['texto_livre'] or 'Sem detalhes adicionais')
                st.caption(f"Enviado em: {rel['criado_em']}")

                # Checkbox para marcar como lido
                lido_atual = rel.get('lido', False) or False
                novo_lido = st.checkbox(
                    "Marcar como lido",
                    value=lido_atual,
                    key=f"admin_check_lido_{rel['id']}"
                )
                if novo_lido != lido_atual:
                    supabase.table("relatorios").update({"lido": novo_lido}).eq("id", rel['id']).execute()
                    st.rerun()
    else:
        st.info("Nenhum relatório encontrado.")

# === LÓGICA PRINCIPAL (DADOS DE VENDAS) ===


def get_dados_cliente(nome_cliente, ano_referencia=None):
    result_cliente = supabase.table("clientes").select("id").eq("nome", nome_cliente).execute()
    if not result_cliente.data:
        return None, None, None, None

    cid = result_cliente.data[0]["id"]

    # Filtrar por ano se especificado
    if ano_referencia:
        result_vendas = supabase.table("vendas").select("*").eq("cliente_id", cid).eq("ano_referencia", ano_referencia).execute()
    else:
        result_vendas = supabase.table("vendas").select("*").eq("cliente_id", cid).execute()

    df = pd.DataFrame(result_vendas.data) if result_vendas.data else pd.DataFrame()

    if df.empty:
        return None, None, cid, None

    # Monta Matriz
    df_pivot = df.pivot_table(index='produto', columns='mes_ref',
                              values='quantidade', aggfunc='sum', fill_value=0)
    totais_valor = df.groupby('mes_ref')['valor'].sum()

    mapa_colunas = {}
    cols_ordenadas = sorted(df_pivot.columns)

    for col in cols_ordenadas:
        val = totais_valor.get(col, 0)
        val_fmt = f"R$ {val:,.2f}".replace(
            ",", "X").replace(".", ",").replace("X", ".")
        mapa_colunas[col] = f"{col}\n({val_fmt})"

    df_pivot = df_pivot[cols_ordenadas]
    df_pivot.rename(columns=mapa_colunas, inplace=True)

    vendas_por_prod = df.groupby('produto').agg(
        {'quantidade': 'sum', 'valor': 'sum'})
    df_pivot['TOTAL_QTD'] = vendas_por_prod['quantidade']
    df_pivot['TOTAL_VALOR'] = vendas_por_prod['valor']

    return df_pivot.sort_index(), list(mapa_colunas.values()), cid, df


def get_anos_cliente(cliente_id):
    """Retorna lista de anos com dados para o cliente"""
    result = supabase.table("vendas").select("ano_referencia").eq("cliente_id", cliente_id).not_.is_("ano_referencia", "null").execute()
    if result.data:
        anos = list(set([r["ano_referencia"] for r in result.data]))
        anos.sort(reverse=True)
        return anos
    return [datetime.now().year]

# === TELA ADMIN (DASHBOARD COMPLETO) ===


def tela_admin():
    # Controle de confirmação de saída
    if "confirmar_sair_admin" not in st.session_state:
        st.session_state.confirmar_sair_admin = False

    # === BARRA LATERAL COMPACTA ===
    with st.sidebar:
        if os.path.exists("logo.png"):
            with open("logo.png", "rb") as f:
                logo_b64 = base64.b64encode(f.read()).decode()
            st.markdown(
                f'''<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <img src="data:image/png;base64,{logo_b64}" style="width: 50px;">
                    <div>
                        <b>🔑 {st.session_state.usuario_nome}</b><br>
                        <small style="color: #888;">Admin</small>
                    </div>
                </div>''', unsafe_allow_html=True)
        else:
            st.markdown(f"**🔑 {st.session_state.usuario_nome}**")
            st.caption("Administrador")

        if st.button("🚪 Sair"):
            st.session_state.confirmar_sair_admin = True
            st.rerun()

        # Confirmação de saída na sidebar
        if st.session_state.confirmar_sair_admin:
            st.warning("⚠️ Deseja sair?")
            col_s, col_n = st.columns(2)
            with col_s:
                if st.button("✅ Sim"):
                    st.session_state.confirmar_sair_admin = False
                    fazer_logout()
                    st.rerun()
            with col_n:
                if st.button("❌ Não"):
                    st.session_state.confirmar_sair_admin = False
                    st.rerun()

        st.markdown("---")
        st.markdown("**Menu**")

        # CONFIGURAÇÃO DE IA
        with st.expander("🤖 Configuração IA (OpenAI)"):
            api_key_input = st.text_input(
                "API Key:",
                type="password",
                help="Cole sua chave da OpenAI aqui"
            )
            if api_key_input:
                st.session_state.openai_key = api_key_input

        # === SELEÇÃO DE ANO (ANTES DO CLIENTE) ===
        st.markdown("---")
        st.markdown("📂 **PASTA DO ANO**")

        ano_atual = datetime.now().year

        # Buscar anos existentes
        result_anos = supabase.table("vendas_anos").select("ano").order("ano", desc=True).execute()
        if result_anos.data:
            anos_lista = list(set([a["ano"] for a in result_anos.data]))
            anos_lista.sort(reverse=True)
        else:
            anos_lista = [ano_atual]

        # Verificar se acabou de criar um novo ano
        if "novo_ano_criado" in st.session_state:
            indice_novo = anos_lista.index(st.session_state.novo_ano_criado) if st.session_state.novo_ano_criado in anos_lista else 0
            del st.session_state.novo_ano_criado
        else:
            indice_novo = 0

        # Seletor de ano com botão de criar
        col_ano, col_novo = st.columns([3, 1])
        with col_ano:
            ano_selecionado_global = st.selectbox(
                "Selecione o Ano:",
                options=anos_lista,
                index=indice_novo,
                format_func=lambda x: f"📁 {x}",
                key="ano_global"
            )
        with col_novo:
            st.write("")
            if st.button("➕", key="btn_novo_ano", help="Criar novo ano"):
                st.session_state.mostrar_criar_ano = True
                st.rerun()

        # Formulário para criar novo ano
        if st.session_state.get("mostrar_criar_ano", False):
            st.markdown("**➕ Criar Nova Pasta:**")
            anos_possiveis = [a for a in range(ano_atual - 5, ano_atual + 2) if a not in anos_lista]
            if anos_possiveis:
                novo_ano = st.selectbox("Ano:", anos_possiveis, key="novo_ano_select")
                col_criar, col_cancelar = st.columns(2)
                with col_criar:
                    if st.button("✅ Criar", key="btn_criar_ano"):
                        try:
                            supabase.table("vendas_anos").insert({
                                "cliente_id": 0,
                                "ano": novo_ano,
                                "descricao": f"Vendas {novo_ano}"
                            }).execute()
                        except:
                            pass  # Ignora se já existir
                        st.session_state.mostrar_criar_ano = False
                        st.session_state.novo_ano_criado = novo_ano
                        st.success(f"📁 {novo_ano} criada!")
                        st.rerun()
                with col_cancelar:
                    if st.button("❌ Cancelar", key="btn_cancelar_ano"):
                        st.session_state.mostrar_criar_ano = False
                        st.rerun()
            else:
                st.info("Todos os anos já existem")
                if st.button("Fechar", key="btn_fechar_criar"):
                    st.session_state.mostrar_criar_ano = False
                    st.rerun()

        # === SELEÇÃO DE CLIENTE ===
        st.markdown("---")
        st.markdown("**SELECIONE O CLIENTE:**")

        # Usar função com cache
        clientes_data = get_lista_clientes()
        lista_clientes = [c["nome"] for c in clientes_data]

        cliente_selecionado = st.selectbox(
            "Cliente:", ["Selecione..."] + lista_clientes, label_visibility="collapsed")

        with st.expander("Cadastrar Novo Cliente"):
            novo_nome = st.text_input("Nome:").upper()
            if st.button("Salvar") and novo_nome:
                try:
                    supabase.table("clientes").insert({"nome": novo_nome}).execute()
                    limpar_cache()  # Limpar cache após inserir
                    st.success("Cadastrado!")
                    st.rerun()
                except:
                    st.error("Erro ou já existe.")

        with st.expander("🗑️ Excluir Cliente"):
            if lista_clientes:
                cliente_excluir = st.selectbox(
                    "Selecione o cliente para excluir:",
                    lista_clientes,
                    key="cliente_excluir"
                )
                st.warning(f"⚠️ Isso excluirá o cliente **{cliente_excluir}** e TODOS os seus dados (vendas, etc)!")

                if st.button("🗑️ Excluir Cliente", type="primary", key="btn_excluir_cliente"):
                    try:
                        # Buscar ID do cliente
                        result_cli = supabase.table("clientes").select("id").eq("nome", cliente_excluir).execute()
                        if result_cli.data:
                            cli_id = result_cli.data[0]["id"]
                            # Excluir vendas do cliente
                            supabase.table("vendas").delete().eq("cliente_id", cli_id).execute()
                            # Excluir anos do cliente
                            supabase.table("vendas_anos").delete().eq("cliente_id", cli_id).execute()
                            # Excluir essenciais do cliente
                            supabase.table("essenciais").delete().eq("cliente_id", cli_id).execute()
                            # Excluir o cliente
                            supabase.table("clientes").delete().eq("id", cli_id).execute()
                            limpar_cache()
                            st.success(f"Cliente {cliente_excluir} excluído!")
                            st.rerun()
                    except Exception as e:
                        st.error(f"Erro ao excluir: {e}")
            else:
                st.info("Nenhum cliente cadastrado.")

        if cliente_selecionado != "Selecione...":
            st.divider()
            st.write("📂 **Importação de Dados**")
            st.info(f"📁 Importando para: **{ano_selecionado_global}**")

            upl_files = st.file_uploader(
                "Arraste os CSVs aqui", accept_multiple_files=True)

            if st.button("Processar Arquivos", type="primary"):
                if upl_files:
                    result_cid = supabase.table("clientes").select("id").eq("nome", cliente_selecionado).execute()
                    cid = result_cid.data[0]["id"]

                    # Criar registro do ano se não existir
                    try:
                        supabase.table("vendas_anos").insert({
                            "cliente_id": cid,
                            "ano": ano_selecionado_global,
                            "descricao": f"Vendas {ano_selecionado_global}"
                        }).execute()
                    except:
                        pass

                    progresso = st.progress(0)

                    for i, arq in enumerate(upl_files):
                        try:
                            num_mes = int(
                                re.search(r'\d+', arq.name).group()) if re.search(r'\d+', arq.name) else 0
                            str_mes = f"Mês {num_mes:02d}" if num_mes > 0 else "Geral"

                            df_temp = pd.read_csv(
                                arq, sep=';', encoding='latin1')
                            cols = {c.lower(): c for c in df_temp.columns}

                            c_prod = next(
                                (v for k, v in cols.items() if "descri" in k), None)
                            c_qtd = next(
                                (v for k, v in cols.items() if "qtd" in k or "quant" in k), None)

                            c_val = None
                            c_val = next(
                                (v for k, v in cols.items() if "total" in k and "venda" in k), None)
                            if not c_val:
                                c_val = next(
                                    (v for k, v in cols.items() if "valor" in k and "total" in k), None)
                            if not c_val:
                                c_val = next(
                                    (v for k, v in cols.items() if "total" in k and "custo" not in k), None)
                            if not c_val:
                                c_val = next((v for k, v in cols.items() if (
                                    "valor" in k or "vl" in k) and "custo" not in k and "unit" not in k), None)

                            if c_prod and c_qtd:
                                # Deletar apenas do ano selecionado
                                supabase.table("vendas").delete().eq("cliente_id", cid).eq("mes_ref", str_mes).eq("ano_referencia", ano_selecionado_global).execute()

                                registros_batch = []
                                for _, row in df_temp.iterrows():
                                    p = str(row[c_prod]).strip()
                                    if not p or p.lower() == 'nan':
                                        continue
                                    try:
                                        q = int(
                                            float(str(row[c_qtd]).replace(",", ".")))
                                    except:
                                        q = 0
                                    v = 0.0
                                    if c_val:
                                        try:
                                            t = str(row[c_val]).replace(
                                                "R$", "").strip()
                                            if "," in t and "." in t:
                                                t = t.replace(
                                                    ".", "").replace(",", ".")
                                            elif "," in t:
                                                t = t.replace(",", ".")
                                            v = float(t)
                                        except:
                                            v = 0.0
                                    if q > 0:
                                        registros_batch.append({
                                            "cliente_id": cid,
                                            "arquivo_origem": arq.name,
                                            "mes_ref": str_mes,
                                            "produto": p,
                                            "quantidade": q,
                                            "valor": v,
                                            "ano_referencia": ano_selecionado_global
                                        })

                                # Inserir em batch
                                if registros_batch:
                                    supabase.table("vendas").insert(registros_batch).execute()
                        except Exception as e:
                            st.error(f"Erro {arq.name}: {e}")
                        progresso.progress((i+1)/len(upl_files))

                    st.success(f"Importação para {ano_selecionado_global} concluída!")
                    st.rerun()

            # Gerenciar pastas de anos
            with st.expander("📁 Gerenciar Pastas de Anos"):
                result_cid = supabase.table("clientes").select("id").eq("nome", cliente_selecionado).execute()
                cid = result_cid.data[0]["id"]
                result_anos = supabase.table("vendas").select("ano_referencia").eq("cliente_id", cid).execute()
                anos_cliente = list(set([r["ano_referencia"] for r in result_anos.data if r["ano_referencia"]])) if result_anos.data else []
                anos_cliente.sort(reverse=True)

                if anos_cliente:
                    st.markdown("**Anos com dados:**")
                    for ano in anos_cliente:
                        if not ano:
                            ano = 2024
                        result_count = supabase.table("vendas").select("id", count="exact").eq("cliente_id", cid).eq("ano_referencia", ano).execute()
                        qtd_registros = result_count.count if result_count.count else 0

                        col_ano, col_qtd, col_del = st.columns([2, 2, 1])
                        with col_ano:
                            st.markdown(f"📁 **{ano}**")
                        with col_qtd:
                            st.caption(f"{qtd_registros} registros")
                        with col_del:
                            if st.button("🗑️", key=f"del_ano_{ano}"):
                                supabase.table("vendas").delete().eq("cliente_id", cid).eq("ano_referencia", ano).execute()
                                supabase.table("vendas_anos").delete().eq("cliente_id", cid).eq("ano", ano).execute()
                                st.rerun()
                else:
                    st.info("Nenhum ano com dados ainda.")

            if st.button("🗑️ Limpar TODOS os Dados"):
                result_cid = supabase.table("clientes").select("id").eq("nome", cliente_selecionado).execute()
                cid = result_cid.data[0]["id"]
                supabase.table("vendas").delete().eq("cliente_id", cid).execute()
                supabase.table("vendas_anos").delete().eq("cliente_id", cid).execute()
                supabase.table("essenciais").delete().eq("cliente_id", cid).execute()
                st.rerun()

    # === TELA PRINCIPAL ===

    # Menu principal do Admin
    menu_admin = st.radio(
        "Área:",
        ["📊 Dashboard de Vendas", "📝 Relatórios da Equipe", "👥 Gestão de Usuários"],
        horizontal=True
    )

    st.markdown("---")

    # === ÁREA: GESTÃO DE USUÁRIOS ===
    if menu_admin == "👥 Gestão de Usuários":
        tela_gestao_usuarios()

    # === ÁREA: RELATÓRIOS DA EQUIPE ===
    elif menu_admin == "📝 Relatórios da Equipe":
        tela_relatorios_admin()

    # === ÁREA: DASHBOARD DE VENDAS ===
    else:
        if cliente_selecionado != "Selecione...":
            # Obter ID do cliente primeiro
            result_cli = supabase.table("clientes").select("id").eq("nome", cliente_selecionado).execute()
            id_cli_temp = result_cli.data[0]["id"] if result_cli.data else None

            # Usar o ano selecionado na sidebar
            ano_selecionado = ano_selecionado_global

            # Obter anos disponíveis para comparação
            anos_disponiveis = get_anos_cliente(id_cli_temp)

            # Mostrar ano atual e opção de comparar
            st.markdown(f"### 📁 Vendas {ano_selecionado} - {cliente_selecionado}")

            # Opção de comparar com outro ano
            if len(anos_disponiveis) > 1:
                col_info, col_comp = st.columns([3, 2])
                with col_info:
                    st.markdown(f"**📊 Visualizando: {ano_selecionado}**")
                with col_comp:
                    comparar_anos = st.checkbox("📊 Comparar com outro ano", key="comparar_anos")
                    if comparar_anos:
                        anos_para_comparar = [a for a in anos_disponiveis if a != ano_selecionado]
                        ano_comparacao = st.selectbox(
                            "Comparar com:",
                            options=anos_para_comparar,
                            format_func=lambda x: f"📁 {x}",
                            key="ano_comparacao"
                        )
                    else:
                        ano_comparacao = None
            else:
                st.markdown(f"**📊 Visualizando: {ano_selecionado}**")
                comparar_anos = False
                ano_comparacao = None

            st.markdown("---")

            df_tabela, colunas_meses, id_cli, df_bruto = get_dados_cliente(
                cliente_selecionado, ano_selecionado)

            if df_bruto is not None:

                # --- ESTADO DE "TELA CHEIA" (MODO FOCO) ---
                if "modo_foco" not in st.session_state:
                    st.session_state.modo_foco = None

                # FUNÇÃO DE COR
                def aplicar_cores(df_vis):
                    def colorir(row):
                        estilos = [''] * len(row)
                        colunas = df_vis.columns.tolist()
                        cols_m = [c for c in colunas if "Mês" in c]
                        for i, col in enumerate(cols_m):
                            try:
                                idx = colunas.index(col)
                                atual = row[col]
                                if i > 0:
                                    anterior = row[cols_m[i-1]]
                                    if atual > anterior:
                                        estilos[idx] = 'color: #4da6ff; font-weight: bold;'
                                    elif atual < anterior and atual > 0:
                                        estilos[idx] = 'color: #ffcc00; font-weight: bold;'
                                    elif atual == 0 and anterior > 0:
                                        estilos[idx] = 'color: #ff4b4b; font-weight: 900;'
                            except:
                                pass
                        return estilos
                    return df_vis.style.apply(colorir, axis=1).format("{:.0f}")

                # === VISÃO 1: MODO FOCO ===
                if st.session_state.modo_foco == "matriz":
                    c_volt, c_tit = st.columns([1, 10])
                    if c_volt.button("🔙 Voltar"):
                        st.session_state.modo_foco = None
                        st.rerun()
                    c_tit.title(f"🔎 Matriz Financeira {ano_selecionado} (Modo Foco)")

                    filtro_foco = st.text_input(
                        "Filtrar produto no modo foco:", placeholder="Digite o nome...")
                    cols_visualizacao = [c for c in df_tabela.columns if c not in [
                        'TOTAL_QTD', 'TOTAL_VALOR', 'DELTA', 'DELTA_TEMP']]
                    df_exib = df_tabela[cols_visualizacao].copy()
                    if filtro_foco:
                        df_exib = df_exib[df_exib.index.str.lower(
                        ).str.contains(filtro_foco.lower())]

                    st.dataframe(aplicar_cores(df_exib), height=1200, )

                elif st.session_state.modo_foco == "essenciais":
                    c_volt, c_tit = st.columns([1, 10])
                    if c_volt.button("🔙 Voltar"):
                        st.session_state.modo_foco = None
                        st.rerun()
                    c_tit.title(f"⭐ Produtos Essenciais {ano_selecionado} (Modo Foco)")

                    result_fav = supabase.table("essenciais").select("produto").eq("cliente_id", id_cli).execute()
                    favoritos = [r["produto"] for r in result_fav.data] if result_fav.data else []

                    if favoritos:
                        cols_visualizacao = [c for c in df_tabela.columns if c not in [
                            'TOTAL_QTD', 'TOTAL_VALOR', 'DELTA', 'DELTA_TEMP']]
                        df_favs = df_tabela[df_tabela.index.isin(
                            favoritos)][cols_visualizacao]
                        st.dataframe(aplicar_cores(df_favs), height=1200, )
                    else:
                        st.info("Nenhum favorito para exibir.")

                # === VISÃO 2: MODO NORMAL ===
                else:
                    total_pecas = int(df_bruto['quantidade'].sum())
                    total_grana = df_bruto['valor'].sum()
                    fmt_grana = f"R$ {total_grana:,.2f}".replace(
                        ",", "X").replace(".", ",").replace("X", ".")

                    # Se está comparando, mostrar dados dos dois anos
                    if comparar_anos and ano_comparacao:
                        _, _, _, df_bruto_comp = get_dados_cliente(
                            cliente_selecionado, ano_comparacao)

                        if df_bruto_comp is not None:
                            total_pecas_comp = int(df_bruto_comp['quantidade'].sum())
                            total_grana_comp = df_bruto_comp['valor'].sum()
                            fmt_grana_comp = f"R$ {total_grana_comp:,.2f}".replace(
                                ",", "X").replace(".", ",").replace("X", ".")

                            # Calcular diferenças
                            diff_pecas = total_pecas - total_pecas_comp
                            diff_grana = total_grana - total_grana_comp

                            st.markdown(f"### 📊 Comparação: {ano_selecionado} vs {ano_comparacao}")

                            k1, k2, k3, k4 = st.columns(4)
                            k1.metric(
                                f"Faturamento {ano_selecionado}",
                                fmt_grana,
                                f"{'+' if diff_grana >= 0 else ''}{diff_grana:,.0f}".replace(",", ".")
                            )
                            k2.metric(
                                f"Faturamento {ano_comparacao}",
                                fmt_grana_comp
                            )
                            k3.metric(
                                f"Peças {ano_selecionado}",
                                f"{total_pecas:,}".replace(",", "."),
                                f"{'+' if diff_pecas >= 0 else ''}{diff_pecas:,}".replace(",", ".")
                            )
                            k4.metric(
                                f"Peças {ano_comparacao}",
                                f"{total_pecas_comp:,}".replace(",", ".")
                            )
                        else:
                            st.warning(f"Sem dados para {ano_comparacao}")
                            k1, k2, k3 = st.columns(3)
                            k1.metric(f"Faturamento {ano_selecionado}", fmt_grana)
                            k2.metric("Peças Vendidas", f"{total_pecas:,}".replace(",", "."))
                            k3.metric("Produtos Diferentes", len(df_tabela))
                    else:
                        st.markdown(f"### 📁 Vendas {ano_selecionado}")
                        k1, k2, k3 = st.columns(3)
                        k1.metric("Faturamento Total", fmt_grana)
                        k2.metric("Peças Vendidas", f"{total_pecas:,}".replace(",", "."))
                        k3.metric("Produtos Diferentes", len(df_tabela))

                    st.divider()

                    # Abas com comparação se ativada
                    if comparar_anos and ano_comparacao:
                        aba1, aba2, aba3, aba4, aba5 = st.tabs([
                            f"📋 Matriz {ano_selecionado}",
                            f"📋 Matriz {ano_comparacao}",
                            "⭐ Essenciais",
                            "🧠 Dossiê Interativo",
                            "💬 Chat"
                        ])
                    else:
                        aba1, aba2, aba3, aba4 = st.tabs(
                            ["📋 Matriz Financeira", "⭐ Essenciais", "🧠 Dossiê Interativo", "💬 Chat"])

                    # --- MATRIZ ANO SELECIONADO ---
                    with aba1:
                        col_f, col_b = st.columns([6, 1])
                        with col_f:
                            filtro = st.text_input(
                                "Filtrar produto:", placeholder="Digite o nome...", key="filtro_matriz_1")
                        with col_b:
                            st.write("")
                            st.write("")
                            if st.button("⛶ Ampliar", key="btn_ampliar_matriz"):
                                st.session_state.modo_foco = "matriz"
                                st.rerun()

                        cols_visualizacao = [c for c in df_tabela.columns if c not in [
                            'TOTAL_QTD', 'TOTAL_VALOR', 'DELTA', 'DELTA_TEMP']]
                        df_exib = df_tabela[cols_visualizacao].copy()
                        if filtro:
                            df_exib = df_exib[df_exib.index.str.lower(
                            ).str.contains(filtro.lower())]

                        st.dataframe(aplicar_cores(df_exib), height=600, )

                    # --- MATRIZ ANO COMPARAÇÃO (se ativado) ---
                    if comparar_anos and ano_comparacao:
                        with aba2:
                            # Obter dados do ano de comparação
                            df_tabela_comp, _, _, df_bruto_comp = get_dados_cliente(
                                cliente_selecionado, ano_comparacao)

                            if df_tabela_comp is not None:
                                filtro_comp = st.text_input(
                                    "Filtrar produto:", placeholder="Digite o nome...", key="filtro_matriz_2")

                                cols_visualizacao_comp = [c for c in df_tabela_comp.columns if c not in [
                                    'TOTAL_QTD', 'TOTAL_VALOR', 'DELTA', 'DELTA_TEMP']]
                                df_exib_comp = df_tabela_comp[cols_visualizacao_comp].copy()
                                if filtro_comp:
                                    df_exib_comp = df_exib_comp[df_exib_comp.index.str.lower(
                                    ).str.contains(filtro_comp.lower())]

                                st.dataframe(aplicar_cores(df_exib_comp), height=600, )
                            else:
                                st.warning(f"Sem dados para o ano {ano_comparacao}")

                        # Ajustar abas para modo comparação
                        aba_favoritos = aba3
                        aba_dossie = aba4
                        aba_chat = aba5
                    else:
                        aba_favoritos = aba2
                        aba_dossie = aba3
                        aba_chat = aba4

                    # --- FAVORITOS ---
                    with aba_favoritos:
                        c_sel, c_btn = st.columns([3, 1])
                        sel_fav = c_sel.selectbox(
                            "Selecione para Favoritar:", df_tabela.index)
                        if c_btn.button("Adicionar/Remover"):
                            result_tem = supabase.table("essenciais").select("*").eq("cliente_id", id_cli).eq("produto", sel_fav).execute()
                            if result_tem.data:
                                supabase.table("essenciais").delete().eq("cliente_id", id_cli).eq("produto", sel_fav).execute()
                                st.toast("Removido!", icon="🗑️")
                            else:
                                supabase.table("essenciais").insert({"cliente_id": id_cli, "produto": sel_fav}).execute()
                                st.toast("Adicionado!", icon="⭐")
                            st.rerun()

                        result_fav = supabase.table("essenciais").select("produto").eq("cliente_id", id_cli).execute()
                        favoritos = [r["produto"] for r in result_fav.data] if result_fav.data else []

                        st.divider()

                        if favoritos:
                            col_info, col_b_fav = st.columns([6, 1])
                            col_info.write(
                                f"**{len(favoritos)}** produtos marcados como essenciais.")
                            if col_b_fav.button("⛶ Ampliar", key="btn_ampliar_fav"):
                                st.session_state.modo_foco = "essenciais"
                                st.rerun()

                            cols_visualizacao = [c for c in df_tabela.columns if c not in [
                                'TOTAL_QTD', 'TOTAL_VALOR', 'DELTA', 'DELTA_TEMP']]
                            df_favs = df_tabela[df_tabela.index.isin(
                                favoritos)][cols_visualizacao]
                            st.dataframe(aplicar_cores(df_favs), height=600, )
                        else:
                            st.info("Nenhum favorito selecionado.")

                    # --- DOSSIE ---
                    with aba_dossie:
                        st.subheader("🔎 Análise Mensal Detalhada")
                        cols_m = [c for c in df_tabela.columns if "Mês" in c]
                        if cols_m:
                            col_sel, col_vazio = st.columns([1, 3])
                            with col_sel:
                                mes_selecionado = st.selectbox(
                                    "📅 Escolha o Mês para Analisar:", cols_m, index=len(cols_m)-1)
                            st.divider()

                            top_mes = df_tabela[df_tabela[mes_selecionado] > 0].sort_values(
                                mes_selecionado, ascending=False).head(5)
                            menos_mes = df_tabela[df_tabela[mes_selecionado] > 0].sort_values(
                                mes_selecionado, ascending=True).head(5)
                            c_top, c_down = st.columns(2)
                            c_alta, c_queda = st.columns(2)
                            nome_mes_limpo = mes_selecionado.split('\n')[0]

                            with c_top:
                                st.markdown(
                                    f'<div class="analise-box"><span class="analise-titulo">🏆 Campeões em {nome_mes_limpo}</span>', unsafe_allow_html=True)
                                if not top_mes.empty:
                                    for prod, row in top_mes.iterrows():
                                        st.markdown(
                                            f"""<div class="item-lista"><b>{prod}</b><br><span class="destaque-valor">{int(row[mes_selecionado])} pçs</span></div>""", unsafe_allow_html=True)
                                else:
                                    st.write("Nada vendido.")
                                st.markdown('</div>', unsafe_allow_html=True)

                            with c_down:
                                st.markdown(
                                    f'<div class="analise-box"><span class="analise-titulo">⚠️ Vendas Baixas em {nome_mes_limpo}</span>', unsafe_allow_html=True)
                                if not menos_mes.empty:
                                    for prod, row in menos_mes.iterrows():
                                        st.markdown(
                                            f"""<div class="item-lista"><b>{prod}</b><br><span class="destaque-negativo">{int(row[mes_selecionado])} pçs</span></div>""", unsafe_allow_html=True)
                                else:
                                    st.write("Sem dados.")
                                st.markdown('</div>', unsafe_allow_html=True)

                            idx_atual = cols_m.index(mes_selecionado)
                            if idx_atual > 0:
                                mes_anterior = cols_m[idx_atual - 1]
                                df_tabela['DELTA_TEMP'] = df_tabela[mes_selecionado] - \
                                    df_tabela[mes_anterior]
                                em_alta = df_tabela[df_tabela['DELTA_TEMP'] > 0].sort_values(
                                    'DELTA_TEMP', ascending=False).head(5)
                                em_queda = df_tabela[df_tabela['DELTA_TEMP'] < 0].sort_values(
                                    'DELTA_TEMP', ascending=True).head(5)

                                with c_alta:
                                    st.markdown(
                                        f'<div class="analise-box"><span class="analise-titulo">🚀 Subiu (vs Mês Anterior)</span>', unsafe_allow_html=True)
                                    if not em_alta.empty:
                                        for prod, row in em_alta.iterrows():
                                            st.markdown(
                                                f"""<div class="item-lista"><b>{prod}</b><br>Era {int(row[mes_anterior])} ➝ <span class="destaque-positivo">Agora {int(row[mes_selecionado])}</span> (+{int(row['DELTA_TEMP'])})</div>""", unsafe_allow_html=True)
                                    else:
                                        st.info("Nenhum crescimento.")
                                    st.markdown(
                                        '</div>', unsafe_allow_html=True)
                                with c_queda:
                                    st.markdown(
                                        f'<div class="analise-box"><span class="analise-titulo">🔻 Caiu (vs Mês Anterior)</span>', unsafe_allow_html=True)
                                    if not em_queda.empty:
                                        for prod, row in em_queda.iterrows():
                                            st.markdown(
                                                f"""<div class="item-lista"><b>{prod}</b><br>Era {int(row[mes_anterior])} ➝ <span class="destaque-negativo">Agora {int(row[mes_selecionado])}</span> ({int(row['DELTA_TEMP'])})</div>""", unsafe_allow_html=True)
                                    else:
                                        st.info("Nenhuma queda.")
                                    st.markdown(
                                        '</div>', unsafe_allow_html=True)
                            else:
                                st.info("Primeiro mês. Sem comparação.")
                        else:
                            st.warning("Importe arquivos.")

                    # --- CHAT OTIMIZADO (PARA NÃO TRAVAR IA) ---
                    with aba_chat:
                        st.subheader("🧠 Assistente Inteligente")

                        # Aviso se não tiver chave
                        if "openai_key" not in st.session_state or not st.session_state.openai_key:
                            st.warning(
                                "⚠️ Para a IA funcionar, cole sua OpenAI API Key na barra lateral esquerda (Configurar IA).")

                        # Exibe histórico
                        if "historico" not in st.session_state:
                            st.session_state.historico = []
                        for msg in st.session_state.historico:
                            with st.chat_message(msg["role"]):
                                st.markdown(msg["content"])

                        # Input do usuário
                        if txt := st.chat_input("Pergunte sobre as vendas..."):
                            st.session_state.historico.append(
                                {"role": "user", "content": txt})
                            with st.chat_message("user"):
                                st.markdown(txt)

                            if "openai_key" in st.session_state and st.session_state.openai_key:
                                try:
                                    client = OpenAI(
                                        api_key=st.session_state.openai_key)

                                    # --- OTIMIZAÇÃO (Resumir dados para não estourar memória da IA) ---
                                    # 1. Seleciona colunas essenciais
                                    df_ai = df_bruto[[
                                        'mes_ref', 'produto', 'quantidade', 'valor']].copy()

                                    # 2. Agrupa (Soma produtos repetidos no mesmo mês)
                                    df_ai = df_ai.groupby(
                                        ['mes_ref', 'produto']).sum().reset_index()

                                    # 3. Ordena pelos maiores valores
                                    df_ai = df_ai.sort_values(
                                        'valor', ascending=False)

                                    # 4. Limita (Se tiver mais de 300 linhas, corta as menores)
                                    if len(df_ai) > 300:
                                        df_ai = df_ai.head(300)
                                        aviso_corte = "\n(Obs: Analisando apenas os top 300 itens principais)"
                                    else:
                                        aviso_corte = ""

                                    # Converte para texto
                                    dados_contexto = df_ai.to_csv(index=False)

                                    prompt_sistema = f"""
                                    Você é um especialista em análise de vendas.
                                    Analise os dados RESUMIDOS abaixo do cliente '{cliente_selecionado}':

                                    DADOS (CSV):
                                    {dados_contexto}

                                    INSTRUÇÕES:
                                    1. Responda à pergunta do usuário baseando-se nesses dados.
                                    2. Os dados já estão agrupados por mês e produto.
                                    3. Seja direto e profissional.{aviso_corte}
                                    """

                                    stream = client.chat.completions.create(
                                        model="gpt-3.5-turbo",
                                        messages=[
                                            {"role": "system",
                                                "content": prompt_sistema},
                                            {"role": "user", "content": txt}
                                        ],
                                        stream=True
                                    )
                                    with st.chat_message("assistant"):
                                        resp = st.write_stream(stream)
                                    st.session_state.historico.append(
                                        {"role": "assistant", "content": resp})

                                except Exception as e:
                                    st.error(f"Erro na IA: {e}")
                            else:
                                resp = "Por favor, insira a chave da API no menu lateral."
                                st.session_state.historico.append(
                                    {"role": "assistant", "content": resp})
                                with st.chat_message("assistant"):
                                    st.markdown(resp)

            else:
                st.warning("Este cliente não tem dados. Importe os CSVs.")
        else:
            st.info("👈 Selecione um cliente no menu lateral.")


# === FLUXO PRINCIPAL ===
if "logado" not in st.session_state or not st.session_state.logado:
    tela_login()
else:
    if st.session_state.usuario_tipo == "admin":
        tela_admin()
    elif st.session_state.get('usuario_cargo') == 'lider_loja':
        tela_lider_loja()
    else:
        tela_funcionario()
