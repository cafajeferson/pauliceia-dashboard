import { supabase } from './supabase'

export const paintsService = {
    // Get all paints
    async getTintas() {
        const { data, error } = await supabase
            .from('tintas_personalizadas')
            .select(`
        *,
        usuarios:usuario_id (id, nome)
      `)
            .order('criado_em', { ascending: false })

        if (error) throw error
        return data || []
    },

    // Get paint by ID
    async getTintaById(id) {
        const { data, error } = await supabase
            .from('tintas_personalizadas')
            .select(`
        *,
        usuarios:usuario_id (id, nome)
      `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    },

    // Create new paint
    async createTinta(tintaData) {
        const { data, error } = await supabase
            .from('tintas_personalizadas')
            .insert([tintaData])
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Update paint
    async updateTinta(id, tintaData) {
        const { data, error } = await supabase
            .from('tintas_personalizadas')
            .update({
                ...tintaData,
                atualizado_em: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Delete paint
    async deleteTinta(id) {
        const { error } = await supabase
            .from('tintas_personalizadas')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    // Get comments for a paint
    async getComentarios(tintaId) {
        const { data, error } = await supabase
            .from('comentarios_tintas')
            .select(`
        *,
        usuarios:usuario_id (id, nome)
      `)
            .eq('tinta_id', tintaId)
            .order('criado_em', { ascending: true })

        if (error) throw error
        return data || []
    },

    // Create comment
    async createComentario(tintaId, comentario, usuarioId) {
        const { data, error } = await supabase
            .from('comentarios_tintas')
            .insert([{
                tinta_id: tintaId,
                comentario: comentario,
                usuario_id: usuarioId
            }])
            .select(`
        *,
        usuarios:usuario_id (id, nome)
      `)
            .single()

        if (error) throw error
        return data
    },

    // Delete comment
    async deleteComentario(id) {
        const { error } = await supabase
            .from('comentarios_tintas')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    },

    // Search paints
    async searchTintas(query) {
        const { data, error } = await supabase
            .from('tintas_personalizadas')
            .select(`
        *,
        usuarios:usuario_id (id, nome)
      `)
            .or(`nome.ilike.%${query}%,codigo.ilike.%${query}%,descricao.ilike.%${query}%`)
            .order('criado_em', { ascending: false })

        if (error) throw error
        return data || []
    },

    // Filter by category
    async getTintasByCategoria(categoria) {
        const { data, error } = await supabase
            .from('tintas_personalizadas')
            .select(`
        *,
        usuarios:usuario_id (id, nome)
      `)
            .eq('categoria', categoria)
            .order('criado_em', { ascending: false })

        if (error) throw error
        return data || []
    }
}
