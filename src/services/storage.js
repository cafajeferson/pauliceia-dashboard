import { supabase } from './supabase'

const BUCKETS = {
    REPORTS: 'relatorios',
    NOTES: 'anotacoes',
    PAINTS: 'tintas'
}

export const storageService = {
    /**
     * Upload de uma imagem
     * @param {File} file - Arquivo da imagem
     * @param {string} bucket - Nome do bucket (REPORTS, NOTES, PAINTS)
     * @param {string} folder - Pasta dentro do bucket (ex: userId)
     * @returns {Promise<string>} URL pública da imagem
     */
    async uploadImage(file, bucket, folder = '') {
        try {
            console.log(`📤 [Storage] Uploading to bucket: ${bucket}, folder: ${folder}, file: ${file.name}`)

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
            const filePath = folder ? `${folder}/${fileName}` : fileName

            console.log(`📤 [Storage] File path: ${filePath}`)

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) {
                console.error('❌ [Storage] Upload error:', error)
                if (error.message && error.message.includes('not found')) {
                    throw new Error(`Bucket '${bucket}' não existe. Por favor, configure o Supabase Storage primeiro (veja supabase_storage_setup.md)`)
                }
                if (error.message && error.message.includes('permission')) {
                    throw new Error(`Sem permissão para upload no bucket '${bucket}'. Verifique as políticas de acesso.`)
                }
                throw new Error(`Erro no upload: ${error.message || 'Erro desconhecido'}`)
            }

            // Obter URL pública
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath)

            console.log('✅ [Storage] Upload success:', urlData.publicUrl)
            return urlData.publicUrl
        } catch (error) {
            console.error('❌ [Storage] Error uploading image:', error)
            throw error
        }
    },

    /**
     * Upload de múltiplas imagens
     * @param {File[]} files - Array de arquivos
     * @param {string} bucket - Nome do bucket
     * @param {string} folder - Pasta dentro do bucket
     * @returns {Promise<string[]>} Array de URLs públicas
     */
    async uploadImages(files, bucket, folder = '') {
        try {
            const uploadPromises = files.map(file =>
                this.uploadImage(file, bucket, folder)
            )
            return await Promise.all(uploadPromises)
        } catch (error) {
            console.error('Error uploading images:', error)
            throw error
        }
    },

    /**
     * Deletar imagem
     * @param {string} url - URL da imagem
     * @param {string} bucket - Nome do bucket
     */
    async deleteImage(url, bucket) {
        try {
            // Extrair o caminho da URL
            const urlParts = url.split(`/${bucket}/`)
            if (urlParts.length < 2) return

            const filePath = urlParts[1]

            const { error } = await supabase.storage
                .from(bucket)
                .remove([filePath])

            if (error) throw error
        } catch (error) {
            console.error('Error deleting image:', error)
            throw error
        }
    },

    /**
     * Deletar múltiplas imagens
     * @param {string[]} urls - Array de URLs
     * @param {string} bucket - Nome do bucket
     */
    async deleteImages(urls, bucket) {
        try {
            const deletePromises = urls.map(url =>
                this.deleteImage(url, bucket)
            )
            await Promise.all(deletePromises)
        } catch (error) {
            console.error('Error deleting images:', error)
            throw error
        }
    },

    // Constantes para os buckets
    BUCKETS
}
