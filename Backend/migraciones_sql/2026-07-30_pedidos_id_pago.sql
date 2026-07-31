-- ====================================================================
-- Un pago puede cubrir varios pedidos (cobro de mesa completa)
-- Fecha: 2026-07-30
-- ====================================================================
--
-- Por qué: la caja cobraba el total de la mesa pero registraba el pago contra
-- un solo pedido (`pagos.id_pedido` es UNIQUE), así que la boleta solo listaba
-- los platos de ese pedido y los demás quedaban en estado "pagado" sin fila en
-- `pagos`. Ahora el vínculo va del lado del pedido y un pago puede cubrir N.
--
-- Cómo aplicarlo: pegar este archivo en el SQL Editor de Supabase.
-- Es idempotente: se puede correr dos veces sin romper nada.
--
-- OJO: este proyecto NO aplica el esquema con Alembic. La única migración
-- versionada (f1d4959577f8) quedó desactualizada: crea 9 tablas, sin
-- `restaurantes` ni `id_restaurante`. El esquema real es supabase_schema.sql.

ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS id_pago INTEGER REFERENCES pagos(id_pago) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_pedidos_id_pago ON pedidos(id_pago);

-- Backfill: los pagos que ya existen cubren el pedido al que apuntan.
UPDATE pedidos p
SET id_pago = g.id_pago
FROM pagos g
WHERE g.id_pedido = p.id_pedido
  AND p.id_pago IS NULL;
