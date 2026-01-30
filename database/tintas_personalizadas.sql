-- Tabela de Tintas Personalizadas
CREATE TABLE IF NOT EXISTS tintas_personalizadas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  codigo VARCHAR(100),
  descricao TEXT,
  formula TEXT NOT NULL,
  categoria VARCHAR(100),
  tags TEXT[],
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS comentarios_tintas (
  id SERIAL PRIMARY KEY,
  tinta_id INTEGER REFERENCES tintas_personalizadas(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  comentario TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_tintas_usuario ON tintas_personalizadas(usuario_id);
CREATE INDEX idx_tintas_categoria ON tintas_personalizadas(categoria);
CREATE INDEX idx_comentarios_tinta ON comentarios_tintas(tinta_id);

-- RLS (Row Level Security) - Todos podem ver e criar
ALTER TABLE tintas_personalizadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comentarios_tintas ENABLE ROW LEVEL SECURITY;

-- Políticas: Todos podem ler
CREATE POLICY "Todos podem ver tintas" ON tintas_personalizadas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Todos podem criar tintas" ON tintas_personalizadas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Criador pode atualizar" ON tintas_personalizadas FOR UPDATE TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Criador pode deletar" ON tintas_personalizadas FOR DELETE TO authenticated USING (usuario_id = auth.uid());

-- Comentários: Todos podem ver e criar
CREATE POLICY "Todos podem ver comentários" ON comentarios_tintas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Todos podem criar comentários" ON comentarios_tintas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Criador pode deletar comentário" ON comentarios_tintas FOR DELETE TO authenticated USING (usuario_id = auth.uid());
