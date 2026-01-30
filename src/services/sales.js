import { supabase } from './supabase'

// Sales-specific database operations
export const salesService = {
    // Get all sales data for a client and year
    async getVendas(clienteId, ano) {
        // First, get all sales data
        const { data: vendasData, error: vendasError } = await supabase
            .from('vendas')
            .select('*')
            .eq('cliente_id', clienteId)
            .eq('ano_referencia', ano)
            .order('mes_ref')

        if (vendasError) {
            console.error('Error fetching sales:', vendasError)
            return []
        }

        if (!vendasData || vendasData.length === 0) {
            return []
        }

        // Get all unique product codes from sales
        const produtoCodigos = [...new Set(vendasData.map(v => v.produto))]

        // Fetch product names for these codes
        const { data: produtosData, error: produtosError } = await supabase
            .from('produtos')
            .select('codigo, nome')
            .in('codigo', produtoCodigos)

        if (produtosError) {
            console.warn('Error fetching product names:', produtosError)
            // Continue without product names
        }

        // Create a map of codigo -> nome
        const produtosMap = {}
        if (produtosData) {
            produtosData.forEach(p => {
                produtosMap[p.codigo] = p.nome
            })
        }

        // Transform data to include product name
        return vendasData.map(venda => ({
            ...venda,
            produto_nome: produtosMap[venda.produto] || venda.produto,
            produto_codigo: venda.produto
        }))
    },

    // Get available years for a client
    async getAnos(clienteId) {
        // Obter anos da tabela de pastas (vendas_anos)
        const { data: pastas, error: errorPastas } = await supabase
            .from('vendas_anos')
            .select('ano')
            .eq('cliente_id', clienteId)

        // Opcional: também buscar da tabela de vendas para garantir legado
        const { data: vendas, error: errorVendas } = await supabase
            .from('vendas')
            .select('ano_referencia')
            .eq('cliente_id', clienteId)

        if (errorPastas && errorVendas) {
            console.error('Error fetching years:', errorPastas || errorVendas)
            return []
        }

        const anosPastas = pastas ? pastas.map(p => p.ano) : []
        const anosVendas = vendas ? vendas.map(v => v.ano_referencia) : []

        // Merge and unique
        const anos = [...new Set([...anosPastas, ...anosVendas].filter(Boolean))]
        return anos.sort((a, b) => b - a) // descending
    },

    // Create year record
    async createAno(clienteId, ano) {
        try {
            const { data, error } = await supabase
                .from('vendas_anos')
                .insert([{
                    cliente_id: clienteId,
                    ano: ano,
                    descricao: `Vendas ${ano}`
                }])
                .select()

            if (error) throw error
            return data[0]
        } catch (error) {
            // Ignore if already exists
            console.log('Year may already exist:', error)
            return null
        }
    },

    // Auto-register products from CSV data
    async autoRegisterProdutos(vendas, onProgress) {
        try {
            // Extract unique products from vendas
            // Map: code -> name
            const produtosUnicos = {}
            vendas.forEach(v => {
                if (v.produto) {
                    // If we haven't seen this code yet, or if we have a better name now (not just the code)
                    if (!produtosUnicos[v.produto] || (produtosUnicos[v.produto] === v.produto && v.produto_nome && v.produto_nome !== v.produto)) {
                        produtosUnicos[v.produto] = v.produto_nome || v.produto
                    }
                }
            })

            const produtosList = Object.keys(produtosUnicos)
            if (produtosList.length === 0) return

            if (onProgress) onProgress(`Verificando ${produtosList.length} produtos...`)

            // Check which products already exist (in batches to avoid URL overflow)
            const BATCH_SIZE = 200
            const existingCodigos = new Set()

            for (let i = 0; i < produtosList.length; i += BATCH_SIZE) {
                const batch = produtosList.slice(i, i + BATCH_SIZE)
                const { data: existingProdutos } = await supabase
                    .from('produtos')
                    .select('codigo')
                    .in('codigo', batch)
                
                existingProdutos?.forEach(p => existingCodigos.add(p.codigo))
            }

            // Insert only new products
            const newProdutos = produtosList
                .filter(codigo => !existingCodigos.has(codigo))
                .map(codigo => ({
                    codigo: codigo,
                    nome: produtosUnicos[codigo] || codigo, // Use the captured name
                    descricao: 'Produto importado automaticamente do CSV'
                }))

            if (newProdutos.length > 0) {
                if (onProgress) onProgress(`Cadastrando ${newProdutos.length} novos produtos...`)
                
                // Insert in batches
                for (let i = 0; i < newProdutos.length; i += BATCH_SIZE) {
                    const batch = newProdutos.slice(i, i + BATCH_SIZE)
                    const { error } = await supabase
                        .from('produtos')
                        .insert(batch)

                    if (error) console.warn('⚠️ Error batch inserting products:', error)
                }
                console.log(`✅ Auto-registered ${newProdutos.length} new products`)
            } else {
                console.log('✅ All products already registered')
            }
        } catch (error) {
            console.error('❌ Error in autoRegisterProdutos:', error)
        }
    },

    // Import CSV data
    async importVendas(clienteId, ano, vendasData, onProgress) {
        try {
            // Auto-register products FIRST
            await this.autoRegisterProdutos(vendasData, onProgress)

            // Then, ensure year exists
            if (onProgress) onProgress('Verificando pasta do ano...')
            await this.createAno(clienteId, ano)

            // Clean data for insertion (remove non-schema fields like produto_nome)
            // We clone objects to avoid modifying the original array if it's used elsewhere
            console.log('🧹 Cleaning data for import (removing extra columns)...')
            const cleanedData = vendasData.map(({ produto_nome, ...rest }) => rest)

            // Insert in batches (Supabase has limits)
            const batchSize = 500
            const total = cleanedData.length

            for (let i = 0; i < total; i += batchSize) {
                if (onProgress) onProgress(`Salvando vendas: ${Math.min(i + batchSize, total)} / ${total}...`)
                
                const batch = cleanedData.slice(i, i + batchSize)
                const { error } = await supabase
                    .from('vendas')
                    .insert(batch)

                if (error) throw error
            }

            return { success: true }
        } catch (error) {
            console.error('Error importing sales:', error)
            return { success: false, error: error.message }
        }
    },

    // Delete sales for a specific month
    async deleteVendasMes(clienteId, ano, mesRef) {
        const { error } = await supabase
            .from('vendas')
            .delete()
            .eq('cliente_id', clienteId)
            .eq('ano_referencia', ano)
            .eq('mes_ref', mesRef)

        if (error) {
            console.error('Error deleting sales:', error)
            return false
        }
        return true
    },

    // Delete all sales for a year
    async deleteVendasAno(clienteId, ano) {
        const { error } = await supabase
            .from('vendas')
            .delete()
            .eq('cliente_id', clienteId)
            .eq('ano_referencia', ano)

        if (error) {
            console.error('Error deleting year sales:', error)
            return false
        }
        return true
    },

    // Favorites (Essenciais)
    async getFavoritos(clienteId) {
        const { data, error } = await supabase
            .from('essenciais')
            .select('produto')
            .eq('cliente_id', clienteId)

        if (error) {
            console.error('Error fetching favorites:', error)
            return []
        }
        return data.map(f => f.produto)
    },

    async addFavorito(clienteId, produto) {
        const { error } = await supabase
            .from('essenciais')
            .insert([{ cliente_id: clienteId, produto: produto }])

        if (error) {
            console.error('Error adding favorite:', error)
            return false
        }
        return true
    },

    async removeFavorito(clienteId, produto) {
        const { error } = await supabase
            .from('essenciais')
            .delete()
            .eq('cliente_id', clienteId)
            .eq('produto', produto)

        if (error) {
            console.error('Error removing favorite:', error)
            return false
        }
        return true
    },

    async toggleFavorito(clienteId, produto) {
        const favoritos = await this.getFavoritos(clienteId)

        if (favoritos.includes(produto)) {
            return await this.removeFavorito(clienteId, produto)
        } else {
            return await this.addFavorito(clienteId, produto)
        }
    }
}
