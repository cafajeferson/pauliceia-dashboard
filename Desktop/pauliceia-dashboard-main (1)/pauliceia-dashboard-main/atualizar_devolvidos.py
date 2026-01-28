#!/usr/bin/env python3
"""
Script para atualizar app.py com sistema de devolução
Autor: GitHub Copilot
Data: 23/01/2026
"""

import os
import shutil
from datetime import datetime


def fazer_backup(arquivo):
    """Cria backup do arquivo antes de modificar"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = f"{arquivo}_backup_{timestamp}"
    shutil.copy2(arquivo, backup)
    print(f"✅ Backup criado: {backup}")
    return backup


def ler_arquivo(arquivo):
    """Lê o conteúdo do arquivo"""
    with open(arquivo, 'r', encoding='utf-8') as f:
        return f.read()


def escrever_arquivo(arquivo, conteudo):
    """Escreve conteúdo no arquivo"""
    with open(arquivo, 'w', encoding='utf-8') as f:
        f.write(conteudo)


def atualizar_codigo():
    """Atualiza o código do app.py"""

    arquivo = "app.py"

    if not os.path.exists(arquivo):
        print(f"❌ Arquivo {arquivo} não encontrado!")
        return False

    print(f"📝 Lendo {arquivo}...")
    codigo = ler_arquivo(arquivo)

    # Fazer backup
    backup_file = fazer_backup(arquivo)

    print("🔧 Aplicando atualizações...")

    # === ATUALIZAÇÃO 1: Seção DEVEMOS na tela_lider_loja ===
    # Procurar e substituir a seção DEVEMOS

    old_devemos = '''    # === ABA: DEVEMOS ===
    with tab2:
        st.subheader("💰 Devemos (Produtos que devemos para lojas)")'''

    new_devemos = '''    # === ABA: DEVEMOS ===
    with tab2:
        # Sub-abas: Pendentes e Devolvidos
        subtab1, subtab2 = st.tabs(["📋 Pendentes", "✅ Devolvidos"])
        
        with subtab1:
            st.subheader("💰 Devemos (Pendentes)")'''

    if old_devemos in codigo:
        codigo = codigo.replace(old_devemos, new_devemos)
        print("  ✅ Atualização 1: Cabeçalho DEVEMOS")
    else:
        print("  ⚠️ Atualização 1: Padrão não encontrado (pode já estar atualizado)")

    # === ATUALIZAÇÃO 2: Adicionar devolvido=False no INSERT ===
    old_insert = '''                        supabase.table("devemos").insert({
                            "usuario_id": st.session_state.usuario_id,
                            "nome_loja": nome_loja_devemos.strip(),
                            "produtos": produtos_devemos
                        }).execute()'''

    new_insert = '''                        supabase.table("devemos").insert({
                            "usuario_id": st.session_state.usuario_id,
                            "nome_loja": nome_loja_devemos.strip(),
                            "produtos": produtos_devemos,
                            "devolvido": False
                        }).execute()'''

    if old_insert in codigo:
        codigo = codigo.replace(old_insert, new_insert)
        print("  ✅ Atualização 2: INSERT com devolvido=False")
    else:
        print("  ⚠️ Atualização 2: Padrão não encontrado")

    # === ATUALIZAÇÃO 3: Filtrar por devolvido=False no SELECT ===
    old_select = '''        result_devemos = supabase.table("devemos").select(
            "id, nome_loja, produtos, criado_em, atualizado_em"
        ).eq("usuario_id", st.session_state.usuario_id).order("criado_em", desc=True).execute()'''

    new_select = '''        result_devemos = supabase.table("devemos").select(
            "id, nome_loja, produtos, criado_em, atualizado_em"
        ).eq("usuario_id", st.session_state.usuario_id).eq("devolvido", False).order("criado_em", desc=True).execute()'''

    if old_select in codigo:
        codigo = codigo.replace(old_select, new_select)
        print("  ✅ Atualização 3: SELECT filtrando devolvido=False")
    else:
        print("  ⚠️ Atualização 3: Padrão não encontrado")

    # === ATUALIZAÇÃO 4: Adicionar botões de Editar e Marcar como Devolvido ===
    old_expander = '''                with st.expander(f"🏪 {reg['nome_loja']}", expanded=False):
                    st.markdown("**Produtos:**")
                    st.text(reg['produtos'] or '-')
                    st.caption(f"Criado em: {reg['criado_em']}")

                    if st.button("🗑️ Excluir", key=f"del_devemos_{reg['id']}"):
                        supabase.table("devemos").delete().eq("id", reg['id']).execute()
                        st.rerun()'''

    new_expander = '''                # Controle de edição
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
                                    st.rerun()'''

    if old_expander in codigo:
        codigo = codigo.replace(old_expander, new_expander)
        print("  ✅ Atualização 4: Botões Editar e Marcar como Devolvido")
    else:
        print("  ⚠️ Atualização 4: Padrão não encontrado")

    # === ATUALIZAÇÃO 5: Adicionar aba de DEVOLVIDOS ===
    old_info = '''        else:
            st.info("Nenhum registro de 'Devemos' cadastrado.")

    # === ABA: MATERIAIS EMPRESTADOS ==='''

    new_info = '''        else:
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

    # === ABA: MATERIAIS EMPRESTADOS ==='''

    if old_info in codigo:
        codigo = codigo.replace(old_info, new_info)
        print("  ✅ Atualização 5: Aba de DEVOLVIDOS adicionada")
    else:
        print("  ⚠️ Atualização 5: Padrão não encontrado")

    # Salvar arquivo atualizado
    escrever_arquivo(arquivo, codigo)
    print(f"\n✅ Arquivo {arquivo} atualizado com sucesso!")
    print(f"📁 Backup salvo em: {backup_file}")

    return True


def main():
    print("=" * 60)
    print("🚀 SCRIPT DE ATUALIZAÇÃO - SISTEMA DE DEVOLUÇÃO")
    print("=" * 60)
    print()

    if atualizar_codigo():
        print()
        print("=" * 60)
        print("✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 60)
        print()
        print("📋 PRÓXIMOS PASSOS:")
        print("1. Execute: streamlit run app.py")
        print("2. Teste as novas funcionalidades")
        print("3. Se tudo estiver ok, faça commit:")
        print("   git add .")
        print("   git commit -m '✨ Sistema de devolução implementado'")
        print("   git push origin main")
        print()
        print("⚠️ Se algo der errado, restaure o backup criado!")
        print()
    else:
        print()
        print("❌ ERRO NA ATUALIZAÇÃO!")
        print("Verifique os avisos acima.")
        print()


if __name__ == "__main__":
    main()
