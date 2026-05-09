
-- 1. PROFILES Table (Sync with Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  role text default 'customer' check (role in ('customer', 'admin')),
  avatar_url text,
  wishlist text[] default '{}',
  orders_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PRODUCTS Table
create table if not exists public.products (
  id text primary key,
  name text not null,
  description text,
  price decimal(12,2) not null,
  image text not null,
  video_url text,
  images text[] default '{}',
  videos text[] default '{}',
  category text,
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. SYSTEM CONFIG Table (For Admin Emails etc)
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
alter table public.system_config enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Products Policies
create policy "Products viewable by everyone." on public.products for select using (true);
create policy "Admins can modify products." on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Reviews Policies
create policy "Reviews viewable by everyone." on public.reviews for select using (true);
create policy "Anyone can post a review." on public.reviews for insert with check (true);

-- Orders Policies
create policy "Users can view own orders." on public.orders for select using (auth.uid() = user_id or user_id is null);
create policy "Anyone can create an order." on public.orders for insert with check (true);
create policy "Admins can manage all orders." on public.orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- System Config Policies
create policy "System config viewable by everyone." on public.system_config for select using (true);
create policy "Admins can manage system config." on public.system_config for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

--- AUTOMATION: Auto-create profile on signup ---
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'customer');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

--- INDEXES for Performance ---
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

--- REALTIME ---
alter publication supabase_realtime add table public.reviews;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.orders;

--- STORAGE INSTRUCTIONS ---
-- 1. Create buckets: 'product-images' and 'product-videos'
-- 2. Set both to PUBLIC
-- 3. Add policy for 'product-images':
--    - SELECT: All (using true)
--    - INSERT/UPDATE: Authenticated only (or admin check)
