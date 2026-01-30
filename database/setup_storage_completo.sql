-- ============================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO
-- Copie TUDO e cole no SQL Editor do Supabase
-- ============================================

-- PARTE 1: Adicionar colunas de imagens
-- ============================================
ALTER TABLE relatorios ADD COLUMN IF NOT EXISTS imagens TEXT[];
ALTER TABLE anotacoes ADD COLUMN IF NOT EXISTS imagens TEXT[];
ALTER TABLE tintas_personalizadas ADD COLUMN IF NOT EXISTS imagens TEXT[];

-- PARTE 2: Criar buckets de storage
-- ============================================
-- Nota: Buckets só podem ser criados via interface web do Supabase
-- Você PRECISA criar manualmente:
-- 1. Vá em Storage
-- 2. Clique em "New bucket" 
-- 3. Crie: relatorios (marque Public)
-- 4. Crie: anotacoes (marque Public)
-- 5. Crie: tintas (marque Public)

-- PARTE 3: Configurar políticas de acesso
-- ============================================

-- BUCKET: relatorios
-- ============================================

-- Política 1: Permitir upload (INSERT)
CREATE POLICY "Allow authenticated uploads relatorios" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'relatorios');

-- Política 2: Permitir leitura pública (SELECT)
CREATE POLICY "Allow public access relatorios" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'relatorios');

-- Política 3: Permitir deletar (DELETE)
CREATE POLICY "Allow authenticated delete relatorios" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'relatorios');

-- BUCKET: anotacoes
-- ============================================

-- Política 1: Permitir upload (INSERT)
CREATE POLICY "Allow authenticated uploads anotacoes" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'anotacoes');

-- Política 2: Permitir leitura pública (SELECT)
CREATE POLICY "Allow public access anotacoes" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'anotacoes');

-- Política 3: Permitir deletar (DELETE)
CREATE POLICY "Allow authenticated delete anotacoes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'anotacoes');

-- BUCKET: tintas
-- ============================================

-- Política 1: Permitir upload (INSERT)
CREATE POLICY "Allow authenticated uploads tintas" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tintas');

-- Política 2: Permitir leitura pública (SELECT)
CREATE POLICY "Allow public access tintas" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'tintas');

-- Política 3: Permitir deletar (DELETE)
CREATE POLICY "Allow authenticated delete tintas" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'tintas');

-- ============================================
-- FIM DO SCRIPT
-- ============================================
