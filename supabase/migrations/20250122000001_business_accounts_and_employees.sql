CREATE TABLE IF NOT EXISTS public.business_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  subdomain text UNIQUE NOT NULL,
  industry text,
  company_size text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employee_invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_accounts(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'employee' NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at timestamp with time zone,
  UNIQUE(business_id, email)
);

CREATE TABLE IF NOT EXISTS public.business_employees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES public.business_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'employee' NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(business_id, user_id)
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'individual';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.business_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS business_accounts_owner_id_idx ON public.business_accounts(owner_id);
CREATE INDEX IF NOT EXISTS business_accounts_subdomain_idx ON public.business_accounts(subdomain);
CREATE INDEX IF NOT EXISTS employee_invitations_business_id_idx ON public.employee_invitations(business_id);
CREATE INDEX IF NOT EXISTS employee_invitations_email_idx ON public.employee_invitations(email);
CREATE INDEX IF NOT EXISTS business_employees_business_id_idx ON public.business_employees(business_id);
CREATE INDEX IF NOT EXISTS business_employees_user_id_idx ON public.business_employees(user_id);

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own business" ON public.business_accounts;
  CREATE POLICY "Users can view own business"
  ON public.business_accounts FOR SELECT
  USING (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Users can update own business" ON public.business_accounts;
  CREATE POLICY "Users can update own business"
  ON public.business_accounts FOR UPDATE
  USING (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Users can insert own business" ON public.business_accounts;
  CREATE POLICY "Users can insert own business"
  ON public.business_accounts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

  DROP POLICY IF EXISTS "Business owners can view invitations" ON public.employee_invitations;
  CREATE POLICY "Business owners can view invitations"
  ON public.employee_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.business_accounts
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );

  DROP POLICY IF EXISTS "Business owners can create invitations" ON public.employee_invitations;
  CREATE POLICY "Business owners can create invitations"
  ON public.employee_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_accounts
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );

  DROP POLICY IF EXISTS "Business owners can update invitations" ON public.employee_invitations;
  CREATE POLICY "Business owners can update invitations"
  ON public.employee_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.business_accounts
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );

  DROP POLICY IF EXISTS "Employees can view own business employees" ON public.business_employees;
  CREATE POLICY "Employees can view own business employees"
  ON public.business_employees FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.business_accounts
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );

  DROP POLICY IF EXISTS "Business owners can manage employees" ON public.business_employees;
  CREATE POLICY "Business owners can manage employees"
  ON public.business_employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_accounts
      WHERE id = business_id AND owner_id = auth.uid()
    )
  );
END
$$;

alter publication supabase_realtime add table business_accounts;
alter publication supabase_realtime add table employee_invitations;
alter publication supabase_realtime add table business_employees;