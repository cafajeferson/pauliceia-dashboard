import { supabase } from './supabase'

export const notesService = {
    // Get all notes for current user
    async getAnotacoes(userId) {
        const { data, error } = await supabase
            .from('anotacoes')
            .select('*')
            .eq('usuario_id', userId)
            .order('atualizado_em', { ascending: false })

        if (error) throw error
        return data || []
    },

    // Get note by ID
    async getAnotacaoById(id) {
        const { data, error } = await supabase
            .from('anotacoes')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    // Create new note
    async createAnotacao(userId, titulo, conteudo, imagens = []) {
        const { data, error } = await supabase
            .from('anotacoes')
            .insert([{
                usuario_id: userId,
                titulo: titulo,
                conteudo: conteudo,
                imagens: imagens.length > 0 ? imagens : null
            }])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update note
    async updateAnotacao(id, titulo, conteudo, imagens = []) {
        const { data, error } = await supabase
            .from('anotacoes')
            .update({
                titulo: titulo,
                conteudo: conteudo,
                imagens: imagens.length > 0 ? imagens : null,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete note
    async deleteAnotacao(id) {
        const { error } = await supabase
            .from('anotacoes')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    // Search notes by title
    async searchAnotacoes(userId, searchTerm) {
        const { data, error } = await supabase
            .from('anotacoes')
            .select('*')
            .eq('usuario_id', userId)
            .ilike('titulo', `%${searchTerm}%`)
            .order('atualizado_em', { ascending: false })

        if (error) throw error
        return data || []
    }
}
