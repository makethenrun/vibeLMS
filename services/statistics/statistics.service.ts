import "server-only";

import { endOfWeek, startOfWeek } from "date-fns";

import type { Db } from "@/lib/db/supabase";
import { getStudentGroupIds } from "@/services/groups/groups.service";
import { listHomeworkForStudent } from "@/services/homework/homework.service";
import { listUpcomingLessons } from "@/services/lessons/lessons.service";
import type {
  OverviewStatistics,
  StudentDashboardData,
  SubmissionWithStudent,
  TutorDashboardData,
} from "@/types";

async function recentSubmissions(db: Db, limit: number): Promise<SubmissionWithStudent[]> {
  const { data } = await db
    .from("homework_submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const studentIds = [...new Set(rows.map((row) => row.student_id))];
  const { data: students } = await db
    .from("students")
    .select("id, full_name")
    .in("id", studentIds);
  const nameById = new Map(
    (students ?? []).map((student) => [student.id, student.full_name] as const),
  );
  return rows.map((row) => ({ ...row, studentName: nameById.get(row.student_id) ?? "—" }));
}

export async function getTutorDashboard(db: Db): Promise<TutorDashboardData> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

  const [studentsRes, groupsRes, lessonsRes, pendingRes] = await Promise.all([
    db.from("students").select("id", { count: "exact", head: true }).eq("is_archived", false),
    db.from("groups").select("id", { count: "exact", head: true }),
    db
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .gte("start_time", weekStart)
      .lte("start_time", weekEnd),
    db.from("homework_submissions").select("id", { count: "exact", head: true }).is("score", null),
  ]);

  const [upcomingLessons, recent] = await Promise.all([
    listUpcomingLessons(db, { limit: 5 }),
    recentSubmissions(db, 5),
  ]);

  return {
    stats: {
      studentCount: studentsRes.count ?? 0,
      groupCount: groupsRes.count ?? 0,
      lessonsThisWeek: lessonsRes.count ?? 0,
      pendingSubmissions: pendingRes.count ?? 0,
    },
    upcomingLessons,
    recentSubmissions: recent,
  };
}

export async function getStudentDashboard(
  db: Db,
  studentId: string,
): Promise<StudentDashboardData> {
  const groupIds = await getStudentGroupIds(db, studentId);

  const [upcomingLessons, homework] = await Promise.all([
    listUpcomingLessons(db, { groupIds, limit: 5 }),
    listHomeworkForStudent(db, studentId),
  ]);

  let upcomingCount = 0;
  if (groupIds.length > 0) {
    const { count } = await db
      .from("lessons")
      .select("id", { count: "exact", head: true })
      .eq("status", "SCHEDULED")
      .gte("start_time", new Date().toISOString())
      .in("group_id", groupIds);
    upcomingCount = count ?? 0;
  }

  const completedHomework = homework.filter((item) => item.submission !== null).length;
  const pendingHomework = homework.filter((item) => item.submission === null);
  const scores = homework
    .map((item) => item.submission?.score)
    .filter((score): score is number => typeof score === "number");
  const averageScore =
    scores.length > 0
      ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100
      : null;

  return {
    stats: {
      upcomingLessons: upcomingCount,
      pendingHomework: pendingHomework.length,
      completedHomework,
      averageScore,
    },
    upcomingLessons,
    pendingHomework: pendingHomework.slice(0, 5),
  };
}

export async function getOverviewStatistics(db: Db): Promise<OverviewStatistics> {
  const [studentsRes, lessonsRes, homeworkRes, submissionsRes, paymentsRes, membersRes] =
    await Promise.all([
      db.from("students").select("id", { count: "exact", head: true }).eq("is_archived", false),
      db.from("lessons").select("id, status, group_id"),
      db.from("homework").select("id, lesson_id"),
      db.from("homework_submissions").select("id, score"),
      db.from("payments").select("amount"),
      db.from("group_members").select("group_id"),
    ]);

  const lessons = lessonsRes.data ?? [];
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter((lesson) => lesson.status === "COMPLETED").length;
  const cancelledLessons = lessons.filter((lesson) => lesson.status === "CANCELLED").length;
  const concluded = completedLessons + cancelledLessons;
  const attendanceRate = concluded > 0 ? Math.round((completedLessons / concluded) * 100) : 0;

  const memberCountByGroup = new Map<string, number>();
  for (const member of membersRes.data ?? []) {
    memberCountByGroup.set(member.group_id, (memberCountByGroup.get(member.group_id) ?? 0) + 1);
  }
  const lessonGroupById = new Map(lessons.map((lesson) => [lesson.id, lesson.group_id] as const));

  const homework = homeworkRes.data ?? [];
  const totalHomework = homework.length;
  const expectedSubmissions = homework.reduce((sum, item) => {
    const groupId = lessonGroupById.get(item.lesson_id);
    return sum + (groupId ? (memberCountByGroup.get(groupId) ?? 0) : 0);
  }, 0);

  const submissions = submissionsRes.data ?? [];
  const submittedHomework = submissions.length;
  const gradedHomework = submissions.filter((submission) => submission.score !== null).length;
  const pendingHomework = Math.max(expectedSubmissions - submittedHomework, 0);

  const totalPaid = (paymentsRes.data ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  return {
    totalStudents: studentsRes.count ?? 0,
    totalLessons,
    completedLessons,
    cancelledLessons,
    attendanceRate,
    totalHomework,
    submittedHomework,
    gradedHomework,
    pendingHomework,
    totalPaid,
  };
}

export interface PaymentBreakdownItem {
  label: string;
  total: number;
}

export interface PaymentStatistics {
  byMonth: PaymentBreakdownItem[];
  byGroup: PaymentBreakdownItem[];
  byStudent: PaymentBreakdownItem[];
}

export async function getPaymentStatistics(db: Db): Promise<PaymentStatistics> {
  const { data: payments } = await db
    .from("payments")
    .select("student_id, amount, payment_date");
  const list = payments ?? [];

  // By month (YYYY-MM)
  const monthTotals = new Map<string, number>();
  const studentTotals = new Map<string, number>();
  for (const payment of list) {
    const month = payment.payment_date.slice(0, 7);
    const amount = Number(payment.amount);
    monthTotals.set(month, (monthTotals.get(month) ?? 0) + amount);
    studentTotals.set(payment.student_id, (studentTotals.get(payment.student_id) ?? 0) + amount);
  }

  const byMonth: PaymentBreakdownItem[] = [...monthTotals.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.label.localeCompare(a.label))
    .slice(0, 12);

  const studentIds = [...studentTotals.keys()];

  // By student (top 10)
  let studentNameById = new Map<string, string>();
  if (studentIds.length > 0) {
    const { data: students } = await db
      .from("students")
      .select("id, full_name")
      .in("id", studentIds);
    studentNameById = new Map(
      (students ?? []).map((student) => [student.id, student.full_name] as const),
    );
  }
  const byStudent: PaymentBreakdownItem[] = [...studentTotals.entries()]
    .map(([studentId, total]) => ({ label: studentNameById.get(studentId) ?? "—", total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // By group: a student's total is attributed to every group they belong to.
  const byGroup: PaymentBreakdownItem[] = [];
  if (studentIds.length > 0) {
    const { data: members } = await db.from("group_members").select("group_id, student_id");
    const groupTotals = new Map<string, number>();
    for (const member of members ?? []) {
      const studentTotal = studentTotals.get(member.student_id);
      if (studentTotal) {
        groupTotals.set(member.group_id, (groupTotals.get(member.group_id) ?? 0) + studentTotal);
      }
    }
    const groupIds = [...groupTotals.keys()];
    if (groupIds.length > 0) {
      const { data: groups } = await db.from("groups").select("id, name").in("id", groupIds);
      const groupNameById = new Map(
        (groups ?? []).map((group) => [group.id, group.name] as const),
      );
      for (const [groupId, total] of groupTotals.entries()) {
        byGroup.push({ label: groupNameById.get(groupId) ?? "—", total });
      }
      byGroup.sort((a, b) => b.total - a.total);
    }
  }

  return { byMonth, byGroup, byStudent };
}
