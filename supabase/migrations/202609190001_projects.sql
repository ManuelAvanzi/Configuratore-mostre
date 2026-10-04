begin;

create table public.projects (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (length(name) between 1 and 200),
  document jsonb not null check (octet_length(document::text) <= 2097152),
  revision integer not null default 1 check (revision > 0),
  asset_count integer not null default 0 check (asset_count between 0 and 1501),
  width numeric not null check (width between 2 and 100),
  depth numeric not null check (depth between 2 and 100),
  object_count integer not null check (object_count between 0 and 500),
  updated_at timestamptz not null default now()
);
create index projects_owner_updated on public.projects(owner_id, updated_at desc);
alter table public.projects enable row level security;
create policy "Read own projects" on public.projects for select to authenticated using (owner_id = (select auth.uid()));
-- Writes only through the atomic revision-checked function below.
revoke all on public.projects from anon, authenticated;
grant select on public.projects to authenticated;

create function public.save_project(project_id uuid, expected_revision integer, project_document jsonb, project_asset_count integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare next_revision integer; caller uuid := auth.uid();
begin
  if caller is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if project_document->>'version' is distinct from '1'
     or jsonb_typeof(project_document->'objects') is distinct from 'array'
     or jsonb_typeof(project_document->'walls') is distinct from 'array'
     or jsonb_array_length(project_document->'walls') > 500 then
    raise exception 'Invalid project' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.projects(id,owner_id,name,document,asset_count,width,depth,object_count)
    values(project_id,caller,project_document->>'name',project_document,project_asset_count,
      (project_document->>'width')::numeric,(project_document->>'depth')::numeric,jsonb_array_length(project_document->'objects'))
    returning revision into next_revision;
  else
    update public.projects set name=project_document->>'name', document=project_document,
      asset_count=project_asset_count,width=(project_document->>'width')::numeric,
      depth=(project_document->>'depth')::numeric,object_count=jsonb_array_length(project_document->'objects'),
      revision=revision+1,updated_at=now()
    where id=project_id and owner_id=caller and revision=expected_revision
    returning revision into next_revision;
    if next_revision is null then raise exception 'Project conflict or unavailable'; end if;
  end if;
  return next_revision;
end;
$$;
revoke all on function public.save_project(uuid,integer,jsonb,integer) from public, anon;
grant execute on function public.save_project(uuid,integer,jsonb,integer) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('project-assets','project-assets',false,31457280,
  array['image/png','image/jpeg','image/webp','video/mp4','video/webm','model/gltf-binary','application/octet-stream']);
create policy "Read own contents" on storage.objects for select to authenticated
  using (bucket_id='project-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "Upload own contents" on storage.objects for insert to authenticated
  with check (bucket_id='project-assets' and (storage.foldername(name))[1]=(select auth.uid())::text
    and name ~ '^[0-9a-f-]{36}/[0-9a-f]{64}$');
-- No public bucket, overwrite, or client deletion: assets are shared by a user's projects.
commit;
