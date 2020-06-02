import { Item } from "./item";
import { User } from "./user";
import { Trade } from "./trade";
import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
  Unique,
  ManyToOne,
  BeforeInsert,
} from "typeorm";

@Entity()
@Unique(["item", "type"])
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // 0 = Seller to Buyer
  // 1 = Buyer to Seller
  @Column({ nullable: false })
  type: number;

  // 0 = Good
  // 1 = Bad
  @Column({ nullable: false, default: 0 })
  rate: number;

  @Column({ nullable: false, type: "text", default: "" })
  comment: string;

  @ManyToOne((type) => User, (user) => user.sentComment)
  @JoinColumn()
  fromUser: User;

  @ManyToOne((type) => User, (user) => user.receivedComment)
  @JoinColumn()
  toUser: User;

  @ManyToOne((type) => Item, (item) => item.comment)
  @JoinColumn()
  item: Item;

  @Column({ nullable: false, type: "datetime" })
  createdOn: Date;

  @BeforeInsert()
  insertTime() {
    this.createdOn = new Date();
  }
}
