import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ndjhwxnprptdceqkfgut.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kamh3eG5wcnB0ZGNlcWtmZ3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNjYwMTQsImV4cCI6MjA4NDY0MjAxNH0.qqM3vuemcHtyi7Tni_0jmkNnGT_hpD2suiCXF4lYHWs'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Authentication helpers
export const auth = {
    async login(username, password) {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nome, tipo, cargo')
                .ilike('login', username)
                .eq('senha', password)
                .eq('ativo', 1)
                .single()

            if (error) throw error
            if (!data) return null

            return {
                id: data.id,
                nome: data.nome,
                tipo: data.tipo,
                cargo: data.cargo || 'colorista'
            }
        } catch (error) {
            console.error('Login error:', error)
            return null
        }
    },

    logout() {
        // Clear user data from localStorage
        localStorage.removeItem('pauliceia_user')
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('pauliceia_user')
        return userStr ? JSON.parse(userStr) : null
    },

    setCurrentUser(user) {
        localStorage.setItem('pauliceia_user', JSON.stringify(user))
    }
}

// Database operations
export const db = {
    // Clients
    async getClientes(usuarioId = null) {
        try {
            let query = supabase
                .from('clientes')
                .select('id, nome')
                .order('nome')

            if (usuarioId) {
                // Try to filter by user
                query = query.eq('usuario_id', usuarioId)
            }

            const { data, error } = await query

            if (error) {
                // If error is about missing column (common in dev), fallback to no filter
                if ((error.code === '42703' || error.code === 'PGRST204') && usuarioId) { // Undefined column
                    console.warn('Column usuario_id missing, fetching all clients as fallback')
                    const { data: fallbackData } = await supabase
                        .from('clientes')
                        .select('id, nome')
                        .order('nome')
                    return fallbackData || []
                }
                throw error
            }
            return data
        } catch (error) {
            console.error('Error fetching clients:', error)
            // Fallback for missing column or other errors: return all clients
            try {
                const { data: fallbackData } = await supabase
                    .from('clientes')
                    .select('id, nome')
                    .order('nome')
                return fallbackData || []
            } catch (fallbackError) {
                console.error('Critical: Failed to fetch clients even with fallback:', fallbackError)
                return []
            }
        }
    },

    async createCliente(cliente) {
        try {
            const { data, error } = await supabase
                .from('clientes')
                .insert([cliente])
                .select()

            if (error) {
                if ((error.code === '42703' || error.code === 'PGRST204') && cliente.usuario_id) { // Undefined column
                    console.warn('Column usuario_id missing, creating without it')
                    const { usuario_id, ...fallbackCliente } = cliente
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('clientes')
                        .insert([fallbackCliente])
                        .select()

                    if (fallbackError) throw fallbackError
                    return fallbackData[0]
                }
                throw error
            }
            return data[0]
        } catch (error) {
            console.error('Error creating client:', error)
            throw error
        }
    },

    async deleteCliente(id) {
        // 1. Delete sales records
        const { error: errorVendas } = await supabase
            .from('vendas')
            .delete()
            .eq('cliente_id', id)
        if (errorVendas) throw errorVendas

        // 2. Delete year folders
        const { error: errorAnos } = await supabase
            .from('vendas_anos')
            .delete()
            .eq('cliente_id', id)
        if (errorAnos) throw errorAnos

        // 3. Delete favorites
        const { error: errorFavoritos } = await supabase
            .from('essenciais')
            .delete()
            .eq('cliente_id', id)
        if (errorFavoritos) throw errorFavoritos

        // 4. Finally delete the client
        const { error } = await supabase
            .from('clientes')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    // Users
    async getUsuarios() {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, login, tipo, cargo, ativo')
            .order('nome')

        if (error) {
            console.error('Error fetching users:', error)
            return []
        }
        return data
    },

    async createUsuario(usuario) {
        const { data, error } = await supabase
            .from('usuarios')
            .insert([usuario])
            .select()

        if (error) throw error
        return data[0]
    },

    async updateUsuario(id, updates) {
        const { data, error } = await supabase
            .from('usuarios')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        return data[0]
    },

    async deleteUsuario(id) {
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    // Relatorios
    async getRelatorios(usuarioId = null, destinatario = null, arquivado = false, limit = 50) {
        let query = supabase
            .from('relatorios')
            .select('*, usuarios(nome)')
            .eq('arquivado', arquivado)
            .order('data_relatorio', { ascending: false })
            .limit(limit)

        if (usuarioId) {
            query = query.eq('usuario_id', usuarioId)
        }

        if (destinatario) {
            query = query.eq('destinatario', destinatario)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching reports:', error)
            return []
        }
        return data
    },

    async createRelatorio(relatorio) {
        const { data, error } = await supabase
            .from('relatorios')
            .insert([relatorio])
            .select()

        if (error) throw error
        return data[0]
    },

    async updateRelatorio(id, updates) {
        const { data, error } = await supabase
            .from('relatorios')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        return data[0]
    },

    async deleteRelatorio(id) {
        const { error } = await supabase
            .from('relatorios')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    async arquivarRelatorio(id) {
        const { data, error } = await supabase
            .from('relatorios')
            .update({
                arquivado: true,
                lido: true,
                data_arquivamento: new Date().toISOString()
            })
            .eq('id', id)
            .select()

        if (error) throw error
        return data[0]
    },

    async desarquivarRelatorio(id) {
        const { data, error } = await supabase
            .from('relatorios')
            .update({
                arquivado: false,
                data_arquivamento: null
            })
            .eq('id', id)
            .select()

        if (error) throw error
        return data[0]
    },

    // Devemos
    async getDevemos(usuarioId = null, devolvido = false) {
        let query = supabase
            .from('devemos')
            .select('*, usuarios(nome)')
            .eq('devolvido', devolvido)
            .order('criado_em', { ascending: false })

        if (usuarioId) {
            query = query.eq('usuario_id', usuarioId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching devemos:', error)
            return []
        }
        return data
    },

    async createDevemos(devemos) {
        const { data, error } = await supabase
            .from('devemos')
            .insert([devemos])
            .select()

        if (error) throw error
        return data[0]
    },

    async updateDevemos(id, updates) {
        const { data, error } = await supabase
            .from('devemos')
            .update(updates)
            .eq('id', id)
            .select()

        if (error) throw error
        return data[0]
    },

    async deleteDevemos(id) {
        const { error } = await supabase
            .from('devemos')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    // Materiais Emprestados
    async getMateriaisEmprestados(usuarioId = null) {
        let query = supabase
            .from('materiais_emprestados')
            .select('*, usuarios(nome)')
            .order('criado_em', { ascending: false })

        if (usuarioId) {
            query = query.eq('usuario_id', usuarioId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching materiais:', error)
            return []
        }
        return data
    },

    async createMaterialEmprestado(material) {
        const { data, error } = await supabase
            .from('materiais_emprestados')
            .insert([material])
            .select()

        if (error) throw error
        return data[0]
    },

    async deleteMaterialEmprestado(id) {
        const { error } = await supabase
            .from('materiais_emprestados')
            .delete()
            .eq('id', id)

        if (error) throw error
    }
}
