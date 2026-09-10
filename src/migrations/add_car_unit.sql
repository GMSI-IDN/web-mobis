-- ============================================================================
-- SQL SCRIPT: Penambahan Kolom "Jenis Mobil" (car_unit) ke tabel customers
-- Database: PostgreSQL
-- Jalankan query ini di database PRODUCTION sebelum deploy kode baru.
-- Query ini aman dijalankan berulang (idempotent).
-- ============================================================================

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "car_unit" varchar;
