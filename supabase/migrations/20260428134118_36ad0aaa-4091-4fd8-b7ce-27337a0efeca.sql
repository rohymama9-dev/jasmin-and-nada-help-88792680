-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- admin_uploads (public)
create table public.admin_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  storage_path text not null,
  public_url text not null,
  mime_type text,
  created_at timestamptz not null default now()
);
alter table public.admin_uploads enable row level security;
create policy "Admin uploads viewable by everyone" on public.admin_uploads for select using (true);
create policy "Authenticated users can insert admin uploads" on public.admin_uploads for insert to authenticated with check (auth.uid() = user_id);
create policy "Owners can update admin uploads" on public.admin_uploads for update using (auth.uid() = user_id);
create policy "Owners can delete admin uploads" on public.admin_uploads for delete using (auth.uid() = user_id);

-- private_uploads
create table public.private_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  storage_path text not null,
  mime_type text,
  created_at timestamptz not null default now()
);
alter table public.private_uploads enable row level security;
create policy "Owners can view private uploads" on public.private_uploads for select using (auth.uid() = user_id);
create policy "Owners can insert private uploads" on public.private_uploads for insert with check (auth.uid() = user_id);
create policy "Owners can update private uploads" on public.private_uploads for update using (auth.uid() = user_id);
create policy "Owners can delete private uploads" on public.private_uploads for delete using (auth.uid() = user_id);

-- storage buckets
insert into storage.buckets (id, name, public) values ('admin-uploads', 'admin-uploads', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('private-uploads', 'private-uploads', false)
  on conflict (id) do nothing;

-- storage policies: admin-uploads (public read, owner write within their folder)
create policy "Admin uploads public read" on storage.objects for select using (bucket_id = 'admin-uploads');
create policy "Admin uploads owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'admin-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Admin uploads owner update" on storage.objects for update to authenticated
  using (bucket_id = 'admin-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Admin uploads owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'admin-uploads' and auth.uid()::text = (storage.foldername(name))[1]);

-- storage policies: private-uploads (owner only)
create policy "Private uploads owner read" on storage.objects for select to authenticated
  using (bucket_id = 'private-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Private uploads owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'private-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Private uploads owner update" on storage.objects for update to authenticated
  using (bucket_id = 'private-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Private uploads owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'private-uploads' and auth.uid()::text = (storage.foldername(name))[1]);