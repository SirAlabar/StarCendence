//  Friends types
export enum FriendRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface FriendRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Friend {
  requestId: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
}
