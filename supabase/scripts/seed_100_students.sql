-- ===========================================================================
-- seed_100_students.sql
-- Creates 100 student accounts and gives them access to every material.
--   * logins: student001 … student100
--   * password == login (e.g. login "student007" → password "student007")
--   * all placed in a new group «Поток (100 учеников)»
--   * that group is granted access to ALL existing materials
--
-- Run in the Supabase SQL Editor. Idempotent: re-running removes the previous
-- student001…student100 accounts and the «Поток (100 учеников)» group first,
-- then recreates everything (so passwords/access stay in sync).
-- ===========================================================================

-- pgcrypto (crypt/gen_salt) lives in the `extensions` schema on Supabase.
set search_path to public, extensions;

do $$
declare
  gid uuid;
  uid uuid;
  sid uuid;
  i   int;
  lg  text;
begin
  -- --- clean up any previous run -------------------------------------------
  delete from students where user_id in (select id from users where login ~ '^student[0-9]{3}$');
  delete from users where login ~ '^student[0-9]{3}$';
  delete from groups where name = 'Поток (100 учеников)';

  -- --- group ----------------------------------------------------------------
  insert into groups (name) values ('Поток (100 учеников)') returning id into gid;

  -- --- 100 students (login == password) ------------------------------------
  for i in 1..100 loop
    lg := 'student' || lpad(i::text, 3, '0');

    insert into users (login, password_hash, role)
      values (lg, crypt(lg, gen_salt('bf')), 'STUDENT')
      returning id into uid;

    insert into students (user_id, full_name)
      values (uid, 'Ученик ' || lpad(i::text, 3, '0'))
      returning id into sid;

    insert into group_members (group_id, student_id) values (gid, sid);
  end loop;

  -- --- give the group access to every material ------------------------------
  insert into material_groups (material_id, group_id)
    select m.id, gid from materials m
    on conflict do nothing;
end $$;
