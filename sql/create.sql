-- #############################################
-- # SCRIPT 2/2: CREACIÓN DE ESTRUCTURA Y RLS FINAL
-- #############################################

-- 2.1. TIPOS ENUM
CREATE TYPE public.member_status AS ENUM ('PENDING', 'ACCEPTED', 'ADMIN');
CREATE TYPE public.expense_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE public.share_status AS ENUM ('PENDING', 'ACCEPTED', 'PAID');


-- 2.2. CREACIÓN DE TABLAS (con RLS habilitado)
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL, 
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  name text NOT NULL,
  owner_id uuid REFERENCES public.profiles(id) NOT NULL
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.account_members (
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  status public.member_status DEFAULT 'PENDING' NOT NULL,
  PRIMARY KEY (account_id, user_id)
);
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES public.profiles(id) NOT NULL,
  title text,
  amount numeric NOT NULL,
  date date DEFAULT now() NOT NULL,
  status public.expense_status DEFAULT 'DRAFT' NOT NULL
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.expense_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  amount numeric NOT NULL,
  status public.share_status DEFAULT 'PENDING' NOT NULL
);
ALTER TABLE public.expense_shares ENABLE ROW LEVEL SECURITY;


-- 2.3. FUNCIONES Y TRIGGERS (Anti-Recursión y Lógica)
-- Trigger: Crea perfil al registrarse.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Función Anti-Recursión: Verifica si el usuario es miembro activo (ACCEPTED/ADMIN)
CREATE OR REPLACE FUNCTION public.is_member_active(target_account_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_members
    WHERE account_id = target_account_id
    AND user_id = target_user_id
    AND status IN ('ACCEPTED', 'ADMIN')
  );
$$;

-- Función Anti-Recursión: Verifica si el usuario es miembro (PENDING, ACCEPTED, o ADMIN).
CREATE OR REPLACE FUNCTION public.is_member_or_pending(target_account_id uuid, target_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_members
    WHERE account_id = target_account_id
    AND user_id = target_user_id
  );
$$;

-- Trigger de Lógica de Negocio: Prevenir ARCHIVED con PENDING shares.
CREATE OR REPLACE FUNCTION public.check_expense_archive_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ARCHIVED' AND OLD.status != 'ARCHIVED' THEN
    IF EXISTS (
      SELECT 1 
      FROM public.expense_shares 
      WHERE expense_id = NEW.id 
      AND status = 'PENDING'
    ) THEN
      RAISE EXCEPTION 'No se puede archivar el gasto (expense) porque existen shares con estado PENDING.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER before_expense_status_update
  BEFORE UPDATE OF status ON public.expenses
  FOR EACH ROW EXECUTE PROCEDURE public.check_expense_archive_status();


-- #############################################
-- # 3. RLS POLICIES (POLÍTICAS CORREGIDAS)
-- #############################################

-- 3.1. POLÍTICAS PARA PROFILES
-- SELECT: Permite buscar a cualquier usuario autenticado por email para invitar. (Corrige error 406)
CREATE POLICY "Allow authenticated users to read profiles for invitations"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE); 

-- UPDATE: Permite al usuario logueado cambiar su propio nombre/avatar. (Corrige error de edición)
CREATE POLICY "Allow authenticated user to update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- 3.2. POLÍTICAS PARA ACCOUNTS
-- SELECT: Permite al usuario ver las cuentas donde está invitado (PENDING) o pertenece.
CREATE POLICY "Allow members and invited users to read account data" ON public.accounts
  FOR SELECT TO authenticated
  USING (
    public.is_member_or_pending(accounts.id, auth.uid())
  );
  
-- ALL: Permite al dueño (owner) realizar todas las operaciones en su cuenta.
CREATE POLICY "Allow owner to manage account" ON public.accounts
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());


-- 3.3. POLÍTICAS PARA ACCOUNT_MEMBERS
-- INSERT: Solo el dueño de la cuenta puede agregar miembros.
CREATE POLICY "Allow owner to insert member" ON public.account_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts WHERE accounts.id = account_members.account_id AND accounts.owner_id = auth.uid()
    )
  );

-- SELECT: CORRECCIÓN CRÍTICA: Permite al usuario ver su propia fila O ser un miembro de la cuenta para ver las demás.
CREATE POLICY "Allow member or invited user to view status" ON public.account_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_member_or_pending(account_members.account_id, auth.uid())
  );
  
-- DELETE: Solo el dueño puede eliminar. Un miembro solo puede eliminarse a sí mismo si está PENDING.
CREATE POLICY "Allow members to delete membership if PENDING or owner" ON public.account_members
  FOR DELETE TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.accounts WHERE accounts.id = account_members.account_id AND accounts.owner_id = auth.uid()))
    OR (user_id = auth.uid() AND status = 'PENDING')
  );

-- UPDATE: Permite al usuario actualizar su propio estado (ej: de PENDING a ACCEPTED)
CREATE POLICY "Allow user to update own status" ON public.account_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());


-- 3.4. POLÍTICAS PARA EXPENSES (CRUD solo para miembros activos)
CREATE POLICY "Allow active members to manage expenses" ON public.expenses
  FOR ALL TO authenticated
  USING (public.is_member_active(account_id, auth.uid()))
  WITH CHECK (public.is_member_active(account_id, auth.uid()));


-- 3.5. POLÍTICAS PARA EXPENSE_SHARES (CRUD solo para miembros activos de la cuenta)
CREATE POLICY "Allow active members to manage expense shares" ON public.expense_shares
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.expenses WHERE expenses.id = expense_id AND public.is_member_active(expenses.account_id, auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.expenses WHERE expenses.id = expense_id AND public.is_member_active(expenses.account_id, auth.uid()))
  );

CREATE POLICY "Allow active members to read expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (public.is_member_active(account_id, auth.uid()));

CREATE POLICY "Allow active members to read expense shares" ON public.expense_shares
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.expenses WHERE expenses.id = expense_id AND public.is_member_active(expenses.account_id, auth.uid()))
  );

SELECT '✅ Base de datos restaurada con correcciones de RLS.' AS status;