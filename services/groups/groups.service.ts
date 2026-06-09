import "server-only";

import type { Db } from "@/lib/db/supabase";
import type { GroupInput } from "@/lib/validators";
import type { Group, GroupWithCount, GroupWithMembers, Student } from "@/types";

export async function listGroups(db: Db): Promise<GroupWithCount[]> {
  const { data: groups, error } = await db
    .from("groups")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);

  const { data: members } = await db.from("group_members").select("group_id");
  const countByGroup = new Map<string, number>();
  for (const member of members ?? []) {
    countByGroup.set(member.group_id, (countByGroup.get(member.group_id) ?? 0) + 1);
  }

  return (groups ?? []).map((group) => ({
    ...group,
    memberCount: countByGroup.get(group.id) ?? 0,
  }));
}

export async function getGroup(db: Db, id: string): Promise<Group | null> {
  const { data } = await db.from("groups").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getGroupWithMembers(db: Db, id: string): Promise<GroupWithMembers | null> {
  const group = await getGroup(db, id);
  if (!group) return null;

  const { data: links } = await db
    .from("group_members")
    .select("student_id")
    .eq("group_id", id);
  const studentIds = (links ?? []).map((link) => link.student_id);

  let members: Student[] = [];
  if (studentIds.length > 0) {
    const { data: students } = await db
      .from("students")
      .select("*")
      .in("id", studentIds)
      .order("full_name", { ascending: true });
    members = students ?? [];
  }

  return { ...group, members };
}

export async function createGroup(db: Db, input: GroupInput): Promise<Group> {
  const { data, error } = await db
    .from("groups")
    .insert({ name: input.name })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateGroup(db: Db, id: string, input: GroupInput): Promise<Group> {
  const { data, error } = await db
    .from("groups")
    .update({ name: input.name })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteGroup(db: Db, id: string): Promise<void> {
  const { error } = await db.from("groups").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addGroupMember(db: Db, groupId: string, studentId: string): Promise<void> {
  const { error } = await db
    .from("group_members")
    .upsert({ group_id: groupId, student_id: studentId }, { onConflict: "group_id,student_id" });
  if (error) throw new Error(error.message);
}

export async function removeGroupMember(
  db: Db,
  groupId: string,
  studentId: string,
): Promise<void> {
  const { error } = await db
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("student_id", studentId);
  if (error) throw new Error(error.message);
}

/** Active students who are not yet members of the given group. */
export async function listAddableStudents(db: Db, groupId: string): Promise<Student[]> {
  const { data: links } = await db
    .from("group_members")
    .select("student_id")
    .eq("group_id", groupId);
  const memberIds = new Set((links ?? []).map((link) => link.student_id));

  const { data: students } = await db
    .from("students")
    .select("*")
    .eq("is_archived", false)
    .order("full_name", { ascending: true });

  return (students ?? []).filter((student) => !memberIds.has(student.id));
}

/** Group ids a student belongs to — used to scope lessons/homework for students. */
export async function getStudentGroupIds(db: Db, studentId: string): Promise<string[]> {
  const { data } = await db.from("group_members").select("group_id").eq("student_id", studentId);
  return (data ?? []).map((row) => row.group_id);
}

export async function listGroupsForStudent(db: Db, studentId: string): Promise<Group[]> {
  const groupIds = await getStudentGroupIds(db, studentId);
  if (groupIds.length === 0) return [];
  const { data } = await db
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("name", { ascending: true });
  return data ?? [];
}
