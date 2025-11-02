-- Bucket policies for agent-documents storage bucket
begin;

create policy if not exists "agent_docs_write"
on storage.objects
for insert
with check (
  bucket_id = 'agent-documents'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy if not exists "agent_docs_update"
on storage.objects
for update
using (
  bucket_id = 'agent-documents'
  and auth.uid()::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'agent-documents'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy if not exists "agent_docs_select"
on storage.objects
for select
using (
  bucket_id = 'agent-documents'
  and auth.uid()::text = split_part(name, '/', 1)
);

create policy if not exists "agent_docs_delete"
on storage.objects
for delete
using (
  bucket_id = 'agent-documents'
  and auth.uid()::text = split_part(name, '/', 1)
);

commit;
