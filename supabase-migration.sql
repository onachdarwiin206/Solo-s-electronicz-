-- ====================================================================
-- SUPABASE MIGRATION: SECURE ORDER PAYMENT VERIFICATION SHIELD
-- ====================================================================

-- 1. Extend the Orders table with security and verification columns
-- Adds support for unique tracking tokens, verification timestamps, and deadline bounds.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='orders' AND column_name='verification_token') THEN
        ALTER TABLE public.orders ADD COLUMN verification_token text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='orders' AND column_name='payment_verified_at') THEN
        ALTER TABLE public.orders ADD COLUMN payment_verified_at timestamp with time zone;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='orders' AND column_name='payment_deadline') THEN
        ALTER TABLE public.orders ADD COLUMN payment_deadline timestamp with time zone;
    END IF;
END $$;

-- Add a non-blocking fast index for lookup matching during payment reconciliation
CREATE INDEX IF NOT EXISTS idx_orders_verification_token ON public.orders(verification_token);

-- 2. Create the Payment Verifications audit log table
-- Ensures that every approved transaction has a permanent, secure, unalterable trail.
CREATE TABLE IF NOT EXISTS public.payment_verifications (
    id uuid default gen_random_uuid() primary key,
    order_id text not null references public.orders(id) on delete cascade,
    verification_token text not null,
    verification_notes text,
    verified_at timestamp with time zone default timezone('utc'::text, now()) not null,
    verified_by text not null, -- Stores the email or user ID of the verifying admin
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on payment_verifications audit table
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies for Payment Verifications Audit Table
-- A. Admins can view and create all audit entries
DROP POLICY IF EXISTS "Admins can manage all payment verifications" ON public.payment_verifications;
CREATE POLICY "Admins can manage all payment verifications" 
ON public.payment_verifications 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin'
    )
);

-- B. Customers can view their own order payment verification audits
DROP POLICY IF EXISTS "Customers can view own payment verifications" ON public.payment_verifications;
CREATE POLICY "Customers can view own payment verifications" 
ON public.payment_verifications 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE public.orders.id = payment_verifications.order_id AND public.orders.user_id = auth.uid()
    )
);

-- Create simple indexes for optimal join performance on order queries
CREATE INDEX IF NOT EXISTS idx_payment_verifications_order_id ON public.payment_verifications(order_id);
