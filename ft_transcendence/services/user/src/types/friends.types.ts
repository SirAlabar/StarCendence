//  Friends types
export enum FriendRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Friend {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface FriendsList {
  userId: string;
  friends: Friend[];
}

export interface FriendsData {
  friendsList: FriendsList;
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
}
