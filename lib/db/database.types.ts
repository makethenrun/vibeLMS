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
export type GradingMode = "STRICT" | "PARTIAL";
export type LessonStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type MaterialType = "PDF" | "DOCX" | "JPG" | "PNG" | "WEBP" | "VIDEO_LINK";
export type MaterialItemType = "INFO" | "QUIZ" | "GAPS" | "FREE" | "MATCH" | "AUDIO" | "VIDEO" | "IMAGE" | "CAROUSEL" | "LINK" | "IMAGE_TASK" | "SENTENCE_TASK";
export type HomeworkType = "FILE" | "QUIZ";

export interface Database {
  public: {
    Tables: {
      dictionary_entries: {
        Row: {
          id: string;
          owner_id: string | null;
          term: string;
          translation: string;
          pinyin: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          term: string;
          translation: string;
          pinyin?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          term?: string;
          translation?: string;
          pinyin?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
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
      lesson_attendance: {
        Row: {
          lesson_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          lesson_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: {
          lesson_id?: string;
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
      files: {
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
      materials: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      material_sections: {
        Row: {
          id: string;
          material_id: string;
          title: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          title: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          title?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      material_lessons: {
        Row: {
          id: string;
          section_id: string;
          title: string;
          position: number;
          background_url: string | null;
          background_dim: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          title: string;
          position?: number;
          background_url?: string | null;
          background_dim?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          section_id?: string;
          title?: string;
          position?: number;
          background_url?: string | null;
          background_dim?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      material_modules: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      material_items: {
        Row: {
          id: string;
          module_id: string;
          position: number;
          type: MaterialItemType;
          title: string | null;
          note: string | null;
          note_hidden: boolean;
          retry_disabled: boolean;
          font_family: string | null;
          font_size: string | null;
          explanation: string | null;
          drawing: string | null;
          content: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          position?: number;
          type: MaterialItemType;
          title?: string | null;
          note?: string | null;
          note_hidden?: boolean;
          retry_disabled?: boolean;
          font_family?: string | null;
          font_size?: string | null;
          explanation?: string | null;
          drawing?: string | null;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          position?: number;
          type?: MaterialItemType;
          title?: string | null;
          note?: string | null;
          note_hidden?: boolean;
          retry_disabled?: boolean;
          font_family?: string | null;
          font_size?: string | null;
          explanation?: string | null;
          drawing?: string | null;
          content?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      live_sessions: {
        Row: {
          id: string;
          group_id: string;
          material_id: string;
          active_item_id: string | null;
          active_kind: string;
          active_node_id: string | null;
          drawing: string | null;
          created_at: string;
          updated_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          material_id: string;
          active_item_id?: string | null;
          active_kind?: string;
          active_node_id?: string | null;
          drawing?: string | null;
          created_at?: string;
          updated_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          material_id?: string;
          active_item_id?: string | null;
          active_kind?: string;
          active_node_id?: string | null;
          drawing?: string | null;
          created_at?: string;
          updated_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      material_groups: {
        Row: { material_id: string; group_id: string; created_at: string };
        Insert: { material_id: string; group_id: string; created_at?: string };
        Update: { material_id?: string; group_id?: string; created_at?: string };
        Relationships: [];
      };
      material_item_pins: {
        Row: { item_id: string; group_id: string; created_at: string };
        Insert: { item_id: string; group_id: string; created_at?: string };
        Update: { item_id?: string; group_id?: string; created_at?: string };
        Relationships: [];
      };
      material_item_submissions: {
        Row: {
          id: string;
          student_id: string;
          item_id: string;
          answer: Json;
          score: number | null;
          reaction: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          item_id: string;
          answer?: Json;
          score?: number | null;
          reaction?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          item_id?: string;
          answer?: Json;
          score?: number | null;
          reaction?: string | null;
          submitted_at?: string;
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
          attachment_url: string | null;
          attachment_urls: string[] | null;
          max_attempts: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          type: HomeworkType;
          deadline?: string | null;
          attachment_url?: string | null;
          attachment_urls?: string[] | null;
          max_attempts?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          type?: HomeworkType;
          deadline?: string | null;
          attachment_url?: string | null;
          attachment_urls?: string[] | null;
          max_attempts?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          id: string;
          homework_id: string;
          student_id: string;
          attempt_no: number;
          answers: string | null;
          score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          homework_id: string;
          student_id: string;
          attempt_no: number;
          answers?: string | null;
          score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          homework_id?: string;
          student_id?: string;
          attempt_no?: number;
          answers?: string | null;
          score?: number | null;
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
          attachment_urls: string[] | null;
          score: number | null;
          comment: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          homework_id: string;
          student_id: string;
          answer?: string | null;
          attachment_urls?: string[] | null;
          score?: number | null;
          comment?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          homework_id?: string;
          student_id?: string;
          answer?: string | null;
          attachment_urls?: string[] | null;
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
          options: string[] | null;
          correct_answers: string[] | null;
          grading: GradingMode;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          correct_answer: string;
          options?: string[] | null;
          correct_answers?: string[] | null;
          grading?: GradingMode;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question?: string;
          correct_answer?: string;
          options?: string[] | null;
          correct_answers?: string[] | null;
          grading?: GradingMode;
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
