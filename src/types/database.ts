/**
 * Supabase database types. Mirrors supabase/migrations/0001_init.sql.
 * Regenerate with: npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
import type { Caption, CaptionStyleId, ClipLengthId, LayoutId } from './domain';

export type ProjectStatus = 'uploading' | 'analyzing' | 'ready' | 'failed';
export type CreditTransactionType = 'purchase' | 'subscription_grant' | 'consumption' | 'refund' | 'bonus';
export type PlanId = 'free' | 'creator' | 'pro';

type Timestamp = string; // ISO-8601
type UUID = string;

export type Profile = { id: UUID; display_name: string | null; plan: PlanId; credit_balance: number; stripe_customer_id: string | null; created_at: Timestamp };

export type Project = {
  id: UUID;
  user_id: UUID;
  title: string;
  source_name: string;
  source_size: number;
  duration_seconds: number;
  clip_length: ClipLengthId;
  status: ProjectStatus;
  error_message: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type Clip = {
  id: UUID;
  project_id: UUID;
  user_id: UUID;
  position: number;
  start_s: number;
  end_s: number;
  title: string;
  hook: string;
  reason: string;
  score: number;
  captions: Caption[];
  caption_style: CaptionStyleId;
  layout: LayoutId;
  show_title: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type CreditTransaction = {
  id: UUID;
  user_id: UUID;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  project_id: UUID | null;
  description: string;
  created_at: Timestamp;
};

export type ClipEditableFields = Pick<Clip, 'start_s' | 'end_s' | 'title' | 'captions' | 'caption_style' | 'layout' | 'show_title'>;

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: UUID }; Update: { display_name?: string | null }; Relationships: [] };
      projects: {
        Row: Project;
        Insert: Pick<Project, 'user_id' | 'title' | 'source_name' | 'source_size' | 'duration_seconds' | 'clip_length'>;
        Update: { title?: string };
        Relationships: [];
      };
      clips: {
        Row: Clip;
        Insert: Omit<Clip, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ClipEditableFields>;
        Relationships: [{ foreignKeyName: 'clips_project_id_fkey'; columns: ['project_id']; isOneToOne: false; referencedRelation: 'projects'; referencedColumns: ['id'] }];
      };
      credit_transactions: { Row: CreditTransaction; Insert: Omit<CreditTransaction, 'id' | 'created_at'>; Update: never; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { project_status: ProjectStatus; credit_tx_type: CreditTransactionType };
    CompositeTypes: Record<string, never>;
  };
}

export type ProjectWithClips = Project & { clips: Clip[] };
