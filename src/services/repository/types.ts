import type { Clip, ClipEditableFields, CreditTransaction, Profile, Project, ProjectWithClips } from '@/types/database';
import type { ClipLengthId } from '@/types/domain';

export interface NewProjectInput { title: string; sourceName: string; sourceSize: number; duration: number; clipLength: ClipLengthId }

/** Persistence port. Implemented by an in-memory mock (demo mode) and by Supabase. */
export interface Repository {
  getProfile(): Promise<Profile | null>;
  listTransactions(): Promise<CreditTransaction[]>;

  listProjects(): Promise<ProjectWithClips[]>;
  getProject(id: string): Promise<ProjectWithClips | null>;
  createProject(input: NewProjectInput): Promise<Project>;
  renameProject(id: string, title: string): Promise<void>;
  deleteProject(id: string): Promise<void>;

  /** Uploads the audio track and asks the AI for the best moments. Charges credits on success only. */
  analyzeProject(id: string, audio: Blob): Promise<void>;

  updateClip(id: string, patch: Partial<ClipEditableFields>): Promise<Clip>;
  deleteClip(id: string): Promise<void>;
}
