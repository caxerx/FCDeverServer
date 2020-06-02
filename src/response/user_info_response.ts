import { Item } from "./../entity/item";
import { Comment } from "../entity/comment";
export class UserInfoResponse {
  userId: string;
  email: string;
  phoneNumber: string;
  successTrade: number;
  goodRate: number;
  badRate: number;
  items: Item[];
  comments: Comment[];
}
