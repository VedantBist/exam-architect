export type UserRole = 'admin' | 'student' | null;

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}
