-- Tabela de Anotações Pessoais
CREATE TABLE IF NOT EXISTS anotacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_anotacoes_usuario ON anotacoes(usuario_id);
CREATE INDEX idx_anotacoes_titulo ON anotacoes(titulo);

-- RLS (Row Level Security)
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

-- Políticas: Usuário só vê suas próprias anotações
CREATE POLICY "Usuário pode ver suas anotações" ON anotacoes FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Usuário pode criar suas anotações" ON anotacoes FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Usuário pode atualizar suas anotações" ON anotacoes FOR UPDATE TO authenticated USING (usuario_id = auth.uid());
CREATE POLICY "Usuário pode deletar suas anotações" ON anotacoes FOR DELETE TO authenticated USING (usuario_id = auth.uid());
