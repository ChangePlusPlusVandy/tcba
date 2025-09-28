// Basic types for the TCBA application

export interface User {
  id: number;
  firebase_uid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'member' | 'individual';
  created_at: Date;
  updated_at: Date;
}