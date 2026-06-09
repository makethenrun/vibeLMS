/**
 * Hand-authored Supabase Database type. Mirrors supabase/schema.sql so that the
 * supabase-js client is fully typed without an `any` in sight. If you change
 * the SQL schema, update this file (or regenerate with `supabase gen types`).
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "TUTOR" | "STUDENT";
export type LessonStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type MaterialType = "PDF" | "DOCX" | "JPG" | "PNG" | "WEBP" | "VIDEO_LINK";
export type HomeworkType = "FILE" | "QUIZ";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          login: string;
          password_hash: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          login: string;
          password_hash: string;
          role: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          login?: string;
          password_hash?: string;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          notes: string | null;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          notes?: string | null;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          notes?: string | null;
          is_archived?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          group_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: {
          group_id?: string;
          student_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          title: string;
          group_id: string;
          start_time: string;
          end_time: string;
          meeting_url: string | null;
          status: LessonStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          group_id: string;
          start_time: string;
          end_time: string;
          meeting_url?: string | null;
          status?: LessonStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          group_id?: string;
          start_time?: string;
          end_time?: string;
          meeting_url?: string | null;
          status?: LessonStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          title: string;
          file_url: string;
          material_type: MaterialType;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          file_url: string;
          material_type: MaterialType;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          file_url?: string;
          material_type?: MaterialType;
          created_at?: string;
        };
        Relationships: [];
      };
      homework: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          type: HomeworkType;
          deadline: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          type: HomeworkType;
          deadline?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          type?: HomeworkType;
          deadline?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      homework_submissions: {
        Row: {
          id: string;
          homework_id: string;
          student_id: string;
          answer: string | null;
          score: number | null;
          comment: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          homework_id: string;
          student_id: string;
          answer?: string | null;
          score?: number | null;
          comment?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          homework_id?: string;
          student_id?: string;
          answer?: string | null;
          score?: number | null;
          comment?: string | null;
          submitted_at?: string;
        };
        Relationships: [];
      };
      quizzes: {
        Row: {
          id: string;
          homework_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          homework_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          homework_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          correct_answer: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          correct_answer: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question?: string;
          correct_answer?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          payment_date: string;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          amount: number;
          payment_date?: string;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          amount?: number;
          payment_date?: string;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          organization_name: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_name?: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_name?: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
