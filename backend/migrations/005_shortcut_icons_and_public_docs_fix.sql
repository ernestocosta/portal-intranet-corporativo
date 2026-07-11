-- ============================================================
-- Correção: ícones dos atalhos por imagem + documentos públicos
-- ============================================================

ALTER TABLE shortcuts ADD COLUMN IF NOT EXISTS icon_path VARCHAR(500) NOT NULL DEFAULT '';
ALTER TABLE shortcuts ALTER COLUMN icon TYPE VARCHAR(200);
ALTER TABLE shortcuts ALTER COLUMN icon SET DEFAULT '';

-- Para publicar os documentos já cadastrados na tela pública, execute também:
-- UPDATE documents SET is_public = TRUE WHERE is_public = FALSE;
