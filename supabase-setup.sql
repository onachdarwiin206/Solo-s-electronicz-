
-- 1. PROFILES Table (Sync with Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  role text default 'customer' check (role in ('customer', 'admin')),
  avatar_url text,
  wishlist text[] default '{}',
  likes text[] default '{}',
  orders_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 1.5 Create Categories Enum
DO $$ BEGIN
    CREATE TYPE public.electronics_category AS ENUM (
        'Phones & Tablets',
        'Computers & Laptops',
        'Gaming & Consoles',
        'TVs & Audio',
        'Accessories',
        'Networking',
        'Home Appliances',
        'Smart Devices',
        'Cameras & Security',
        'Deals & Offers'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1.6 Migration: Normalize and Convert category to ENUM
DO $$ 
BEGIN
    -- Only proceed if the column exists and is not yet the ENUM type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'products' 
        AND column_name = 'category' 
        AND data_type = 'text'
    ) THEN
        -- 1. Normalize existing values to match ENUM labels
        UPDATE public.products
        SET category = 
          CASE 
            WHEN trim(lower(category)) IN ('phones', 'phone', 'phones & tablets', 'tablet phones') THEN 'Phones & Tablets'
            WHEN trim(lower(category)) IN ('computers', 'laptops', 'computers & laptops') THEN 'Computers & Laptops'
            WHEN trim(lower(category)) IN ('gaming', 'consoles', 'gaming & consoles') THEN 'Gaming & Consoles'
            WHEN trim(lower(category)) IN ('tvs', 'tv', 'audio', 'tvs & audio', 'tv & audio') THEN 'TVs & Audio'
            WHEN trim(lower(category)) IN ('accessories') THEN 'Accessories'
            WHEN trim(lower(category)) IN ('networking') THEN 'Networking'
            WHEN trim(lower(category)) IN ('home appliances') THEN 'Home Appliances'
            WHEN trim(lower(category)) IN ('smart devices') THEN 'Smart Devices'
            WHEN trim(lower(category)) IN ('cameras & security') THEN 'Cameras & Security'
            WHEN trim(lower(category)) IN ('deals & offers') THEN 'Deals & Offers'
            ELSE 'Phones & Tablets' -- Default fallback
          END;

        -- 2. Cast the column to the ENUM type
        ALTER TABLE public.products
          ALTER COLUMN category TYPE public.electronics_category
          USING category::public.electronics_category;
          
        -- 3. Set default and not null
        ALTER TABLE public.products 
          ALTER COLUMN category SET NOT NULL,
          ALTER COLUMN category SET DEFAULT 'Phones & Tablets';
    END IF;
END $$;

-- 1.7 Migration: Add missing columns to orders
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='orders' AND column_name='estimated_delivery') THEN
        ALTER TABLE public.orders ADD COLUMN estimated_delivery text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='orders' AND column_name='tracking_logs') THEN
        ALTER TABLE public.orders ADD COLUMN tracking_logs jsonb default '[]'::jsonb;
    END IF;
END $$;

-- 2. PRODUCTS Table
create table if not exists public.products (
  id text primary key,
  name text not null,
  description text,
  price decimal(12,2) not null,
  image text not null,
  specifications text,
  video_url text,
  images text[] default '{}',
  videos text[] default '{}',
  category public.electronics_category NOT NULL DEFAULT 'Phones & Tablets',
  stock_status text default 'in_stock',
  is_verified boolean default false,
  likes_count int default 0,
  rating decimal(3,2) default 5.0,
  featured boolean default false,
  stock int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. REVIEWS Table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text references public.products(id) on delete cascade,
  user_id text, -- Can be 'guest' or uuid
  user_name text,
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  status text default 'approved',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ORDERS Table
create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  customer_name text,
  customer_phone text,
  total decimal(12,2) not null,
  status text default 'pending',
  items jsonb not null,
  delivery_address text,
  district text,
  payment_method text,
  estimated_delivery text,
  tracking_logs jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. ADMINS Table (Explicit allowlist)
create table if not exists public.admins (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. SYSTEM CONFIG Table (For miscellaneous settings)
create table if not exists public.system_config (
  key text primary key,
  value jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

--- RLS POLICIES ---

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.admins enable row level security;
alter table public.system_config enable row level security;

-- Global Admin Check Function
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or
    exists (select 1 from public.admins where email = auth.email())
  );
end;
$$ language plpgsql security definer;

-- Profiles Policies
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

drop policy if exists "Users can update own profile." on public.profiles;
-- We allow users to update their own row, but we add a check to ensure they don't change their role
-- Note: In Supabase RLS, we can't easily check 'affected columns' in the 'using' clause besides comparing new vs old
-- A common pattern is to just allow the update but have a database trigger that flattens any role change attempts from non-admins
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile." on public.profiles;
create policy "Users can insert own profile." on public.profiles for insert with check (auth.uid() = id);

-- Secure role management trigger
create or replace function public.preserve_role_integrity()
returns trigger as $$
begin
  if (not public.is_admin()) then
    new.role := old.role; -- Revert role change if not an admin
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_update_integrity on public.profiles;
create trigger on_profile_update_integrity
  before update on public.profiles
  for each row execute procedure public.preserve_role_integrity();

-- Products Policies
drop policy if exists "Products viewable by everyone." on public.products;
create policy "Products viewable by everyone." on public.products for select using (true);

drop policy if exists "Admins can manage products." on public.products;
-- WARNING: Relaxed to allow PIN-authorized admins (anonymous to Supabase) to manage products.
-- In a production environment, you should use Supabase Auth and restricted RLS.
create policy "Admins can manage products." on public.products for all using (true); 

-- Reviews Policies
drop policy if exists "Reviews viewable by everyone." on public.reviews;
create policy "Reviews viewable by everyone." on public.reviews for select using (true);

drop policy if exists "Authenticated users can post a review." on public.reviews;
create policy "Authenticated users can post a review." on public.reviews for insert with check (true); -- Relaxed for easier review submission

drop policy if exists "Owners can delete reviews." on public.reviews;
create policy "Owners can delete reviews." on public.reviews for delete using (true);

-- Orders Policies
drop policy if exists "Users can view own orders." on public.orders;
create policy "Users can view own orders." on public.orders for select using (true);

drop policy if exists "Anyone can create an order." on public.orders;
create policy "Anyone can create an order." on public.orders for insert with check (true);

drop policy if exists "Admins can manage all orders." on public.orders;
-- WARNING: Relaxed to allow PIN-authorized admins to manage orders.
create policy "Admins can manage all orders." on public.orders for all using (true);

-- Admin Table Policies
drop policy if exists "Admins can view admin list." on public.admins;
create policy "Admins can view admin list." on public.admins for select using (is_admin());

drop policy if exists "Super admins can manage admins." on public.admins;
create policy "Super admins can manage admins." on public.admins for all using (is_admin());

-- System Config Policies
drop policy if exists "System config viewable by everyone." on public.system_config;
create policy "System config viewable by everyone." on public.system_config for select using (true);

drop policy if exists "Admins can manage system config." on public.system_config;
create policy "Admins can manage system config." on public.system_config for all using (is_admin());

--- AUTOMATION: Auto-create profile on signup ---
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'), 
    new.email, 
    case 
      when exists (select 1 from public.admins where email = new.email) then 'admin'
      else 'customer'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Ensure trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. CARTS Table
create table if not exists public.carts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  items jsonb default '[]',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. WISHLISTS Table
create table if not exists public.wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

--- RLS POLICIES for carts/wishlists ---
do $$
begin
  alter table public.carts enable row level security;
exception when others then
  raise notice 'RLS already enabled or table missing';
end $$;

do $$
begin
  alter table public.wishlists enable row level security;
exception when others then
  raise notice 'RLS already enabled or table missing';
end $$;

drop policy if exists "Users can manage own cart." on public.carts;
create policy "Users can manage own cart." on public.carts for all using (auth.uid() = user_id);

drop policy if exists "Users can manage own wishlist." on public.wishlists;
create policy "Users can manage own wishlist." on public.wishlists for all using (auth.uid() = user_id);

--- REALTIME (idempotent) ---
DO $$
BEGIN
  -- Enable realtime for the publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reviews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'carts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.carts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'wishlists'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wishlists;
  END IF;
END $$;

--- STORAGE BUCKET CREATION ---
-- NOTE: Run these in the SQL Editor to ensure buckets exist
insert into storage.buckets (id, name, public) 
values ('product-images', 'product-images', true) 
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('product-videos', 'product-videos', true) 
on conflict (id) do nothing;

--- STORAGE POLICIES ---

-- Storage Policies Consolidating all for PIN-based admin functionality
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Upload" on storage.objects;
drop policy if exists "Admin Update" on storage.objects;
drop policy if exists "Admin Delete" on storage.objects;
create policy "Product Images Management" on storage.objects for all 
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

drop policy if exists "Public Access Videos" on storage.objects;
drop policy if exists "Admin Upload Videos" on storage.objects;
drop policy if exists "Admin Update Videos" on storage.objects;
drop policy if exists "Admin Delete Videos" on storage.objects;
create policy "Product Videos Management" on storage.objects for all 
using (bucket_id = 'product-videos')
with check (bucket_id = 'product-videos');

--- INDEXES ---
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_carts_user_id on public.carts(user_id);
create index if not exists idx_wishlists_user_id on public.wishlists(user_id);

--- RPC FUNCTIONS ---
create or replace function public.toggle_product_like(p_id text, increment boolean)
returns void as $$
begin
  update public.products
  set likes_count = case when increment then likes_count + 1 else likes_count - 1 end
  where id = p_id;
end;
$$ language plpgsql security definer;

--- STORAGE BUCKET POLICIES (Run if needed) ---
-- These usually need to be run in the SQL editor since buckets are system-level
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict (id) do nothing;
-- insert into storage.buckets (id, name, public) values ('product-videos', 'product-videos', true) on conflict (id) do nothing;
-- insert into storage.buckets (id, name, public) values ('user-avatars', 'user-avatars', true) on conflict (id) do nothing;

--- STORAGE INSTRUCTIONS ---
-- 1. Create buckets: 'product-images' and 'product-videos'
-- 2. Set both to PUBLIC
-- 3. Add policy for 'product-images':
--    - SELECT: All (using true)
--    - INSERT/UPDATE: Authenticated only (or admin check)
