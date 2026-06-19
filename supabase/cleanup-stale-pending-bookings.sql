-- ============================================================================
-- Cleanup de reservas "pending" colgadas (no pagadas)
-- ----------------------------------------------------------------------------
-- Contexto: hasta ahora la reserva se creaba como `pending` ANTES del pago, así
-- que los clientes que abandonaban dejaban filas `pending` que ensucian el admin
-- y bloquean el cupo. Con el flujo "pago primero" de Square ya no se crean
-- pendings nuevos, pero hay que limpiar los acumulados.
--
-- ⚠️ REVISAR ANTES DE CORRER. Ejecuta los SELECT primero para ver qué se afecta.
--    Corre en el SQL editor de Supabase. No es destructivo: pasa a 'cancelled',
--    no borra filas.
-- ============================================================================

-- ── PASO 1: Inspeccionar qué hay pendiente (solo lectura) ────────────────────
-- Cuántos pendings hay y de qué antigüedad:
SELECT
  date_trunc('day', created_at) AS dia,
  count(*)                      AS pendings,
  sum(total_amount)            AS monto_total
FROM bookings
WHERE status = 'pending'
GROUP BY 1
ORDER BY 1 DESC;

-- Ver el detalle de los pendings con más de 1 día:
SELECT id, customer_name, customer_email, payment_method,
       booking_date, start_time, total_amount, created_at
FROM bookings
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;


-- ── PASO 2: Cancelar los pendings viejos (acción) ────────────────────────────
-- Recomendado: cancelar todo pending con más de 1 DÍA (claramente abandonado).
-- Ajusta el intervalo si quieres ser más/menos agresivo.
UPDATE bookings
SET    status = 'cancelled',
       updated_at = NOW()
WHERE  status = 'pending'
  AND  created_at < NOW() - INTERVAL '1 day';

-- (Alternativa más agresiva, alineada con la ventana de cupo de 60 min del código:
--  descomenta si quieres limpiar también los recientes abandonados.)
-- UPDATE bookings
-- SET    status = 'cancelled', updated_at = NOW()
-- WHERE  status = 'pending'
--   AND  created_at < NOW() - INTERVAL '1 hour';


-- ── PASO 3 (OPCIONAL): Auto-limpieza recurrente con pg_cron ──────────────────
-- Si tu proyecto Supabase tiene la extensión pg_cron habilitada, esto cancela
-- automáticamente cada 15 min los pendings de más de 1 hora. Así nunca se vuelven
-- a acumular, incluso si en el futuro reactivas PayPal/Credomatic.
--
-- 1) Habilitar la extensión (una sola vez):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- 2) Programar el job:
-- SELECT cron.schedule(
--   'cancel-stale-pending-bookings',
--   '*/15 * * * *',
--   $$
--     UPDATE bookings
--     SET    status = 'cancelled', updated_at = NOW()
--     WHERE  status = 'pending'
--       AND  created_at < NOW() - INTERVAL '1 hour';
--   $$
-- );
--
-- Para ver / borrar el job:
-- SELECT * FROM cron.job;
-- SELECT cron.unschedule('cancel-stale-pending-bookings');
