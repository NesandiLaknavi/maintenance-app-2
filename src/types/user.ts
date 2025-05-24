import { User } from 'firebase/auth';

export interface CustomUser extends User {
  role?: string;
} 