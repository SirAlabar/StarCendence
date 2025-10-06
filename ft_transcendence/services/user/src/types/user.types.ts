//  Core user types

export interface CreateUserBody {
  authId: string
  email: string
  username: string
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserBody {
  bio?: string;
  avatarUrl?: string;
}