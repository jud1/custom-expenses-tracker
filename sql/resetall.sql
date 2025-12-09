-- #############################################
-- # SCRIPT 1/2: LIMPIEZA TOTAL DE LA ESTRUCTURA
-- #############################################

-- ELIMINAR TRIGGERS Y FUNCIONES
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS before_expense_status_update ON public.expenses;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.check_expense_archive_status() CASCADE;
DROP FUNCTION IF EXISTS public.is_member_active(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_member_or_pending(uuid, uuid) CASCADE;

-- ELIMINAR TABLAS
DROP TABLE IF EXISTS public.expense_shares CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.account_members CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ELIMINAR ENUMS
DROP TYPE IF EXISTS public.member_status;
DROP TYPE IF EXISTS public.expense_status;
DROP TYPE IF EXISTS public.share_status;

-- Mensaje de confirmación
SELECT '✅ Limpieza completa. Ahora ejecute el SCRIPT 2/2.' AS status;