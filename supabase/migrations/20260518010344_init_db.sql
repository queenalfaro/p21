
create table public.messages (
    id      uuid primary key default gen_random_uuid(),
    text    text not null,
);
