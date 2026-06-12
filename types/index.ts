import type { Database } from "@/lib/db/database.types";

export type {
  Json,
  UserRole,
  LessonStatus,
  MaterialType,
  HomeworkType,
} from "@/lib/db/database.types";

type Tables = Database["public"]["Tables"];

// --- Core entity row types -------------------------------------------------
export type User = Tables["users"]["Row"];
export type Student = Tables["students"]["Row"];
export type Group = Tables["groups"]["Row"];
export type GroupMember = Tables["group_members"]["Row"];
export type Lesson = Tables["lessons"]["Row"];
export type Material = Tables["materials"]["Row"];
export type Homework = Tables["homework"]["Row"];
export type HomeworkSubmission = Tables["homework_submissions"]["Row"];
export type Quiz = Tables["quizzes"]["Row"];
export type QuizQuestion = Tables["quiz_questions"]["Row"];
export type Payment = Tables["payments"]["Row"];
export type Settings = Tables["settings"]["Row"];

// --- Composite / view models ----------------------------------------------
export interface StudentWithAccount extends Student {
  login: string | null;
}

export interface GroupWithCount extends Group {
  memberCount: number;
}

export interface GroupWithMembers extends Group {
  members: Student[];
}

export interface LessonWithGroup extends Lesson {
  groupName: string;
}

export interface HomeworkListItem extends Homework {
  lessonTitle: string;
  groupId: string;
  groupName: string;
  submissionCount: number;
}

export interface AttendanceRosterItem {
  studentId: string;
  fullName: string;
  present: boolean;
}

/** Homework as seen by a student, including their own submission (if any). */
export interface StudentHomeworkItem extends Homework {
  lessonTitle: string;
  groupName: string;
  submission: HomeworkSubmission | null;
}

export interface SubmissionWithStudent extends HomeworkSubmission {
  studentName: string;
}

export interface PaymentWithStudent extends Payment {
  studentName: string;
}

/** Quiz question without the correct answer — safe to send to students. */
export interface QuizQuestionForStudent {
  id: string;
  question: string;
  position: number;
  /** Choices for multiple-choice questions; null/empty => free-text answer. */
  options: string[] | null;
}

// --- Dashboard & statistics models -----------------------------------------
export interface TutorDashboardData {
  stats: {
    studentCount: number;
    groupCount: number;
    lessonsThisWeek: number;
    pendingSubmissions: number;
  };
  upcomingLessons: LessonWithGroup[];
  recentSubmissions: SubmissionWithStudent[];
}

export interface StudentDashboardData {
  stats: {
    upcomingLessons: number;
    pendingHomework: number;
    completedHomework: number;
    averageScore: number | null;
  };
  upcomingLessons: LessonWithGroup[];
  pendingHomework: StudentHomeworkItem[];
}

export interface OverviewStatistics {
  totalStudents: number;
  totalLessons: number;
  completedLessons: number;
  cancelledLessons: number;
  attendanceRate: number;
  totalHomework: number;
  submittedHomework: number;
  gradedHomework: number;
  pendingHomework: number;
  totalPaid: number;
}
