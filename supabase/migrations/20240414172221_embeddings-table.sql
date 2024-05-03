create table "public"."documents_embeddings" (
    "id" uuid not null default gen_random_uuid(),
    "content" text not null,
    "embedding" vector(1536),
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    primary key (id)
);

revoke all on table "public"."documents_embeddings" from anon;
revoke insert, update on table "public"."documents_embeddings" from authenticated;

alter table "public"."documents_embeddings" enable row level security;

CREATE INDEX documents_embeddings_embedding_idx ON public.documents_embeddings USING hnsw (embedding vector_cosine_ops);

alter table "public"."documents" drop column "embedding";
alter table "public"."documents" add column "chatbot_id" uuid not null;
alter table "public"."documents" add column "organization_id" bigint not null;
alter table "public"."documents" add column "title" text not null;

alter table "public"."documents" add constraint "documents_chatbot_id_fkey" FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE not valid;
alter table "public"."documents" add constraint "documents_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."documents" validate constraint "documents_chatbot_id_fkey";
alter table "public"."documents" validate constraint "documents_organization_id_fkey";

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_count integer DEFAULT NULL::integer, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents_embeddings.embedding <=> query_embedding) as similarity
  from documents_embeddings
  where metadata @> filter
  order by documents_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$function$
;

alter table "public"."documents" enable row level security;

create policy "Users can delete documents embeddings in their Organization"
on "public"."documents_embeddings"
as permissive
for delete
to authenticated
using (current_user_is_member_of_organization(((metadata ->> 'organization_id'::text))::bigint));

create policy "Users can select documents embeddings in their Organization"
on "public"."documents_embeddings"
as permissive
for select
to authenticated
using (current_user_is_member_of_organization(((metadata ->> 'organization_id'::text))::bigint));

drop policy "Users can delete documents in their Organization" on "public"."documents";
drop policy "Users can update documents in their Organization" on "public"."documents";
drop policy "Users can select documents in their Organization" on "public"."documents";

create policy "Users can delete documents in their Organization"
on "public"."documents"
as permissive
for delete
to authenticated
using (current_user_is_member_of_organization(organization_id));

create policy "Users can select documents in their Organization"
on "public"."documents"
as permissive
for select
to authenticated
using (current_user_is_member_of_organization(organization_id));

ALTER TABLE "public"."documents" DROP CONSTRAINT "documents_content_check";