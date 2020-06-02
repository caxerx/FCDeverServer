import { Comment } from "./comment";
import { Trade } from "./trade";
import { Item } from "./item";
import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Unique,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from "typeorm";

import { hashSync } from "bcrypt";
import { Message } from "./message";

@Entity()
@Unique(["email"])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false, select: false })
  password: string;

  @Column({
    name: "phone_number",
    nullable: true,
  })
  phoneNumber: string;

  @Column({ nullable: false, type: "datetime" })
  createdOn: Date;

  @OneToMany((type) => Item, (item) => item.owner)
  items: Item[];

  @OneToMany((type) => Trade, (trade) => trade.buyer)
  buyTrade: Trade[];

  @OneToMany((type) => Trade, (trade) => trade.seller)
  sellTrade: Trade[];

  @OneToMany((type) => Comment, (comment) => comment.fromUser)
  sentComment: Comment[];

  @OneToMany((type) => Comment, (comment) => comment.toUser)
  receivedComment: Comment[];

  @OneToMany((type) => Message, (message) => message.fromUser)
  sentMessage: Message[];

  @OneToMany((type) => Message, (message) => message.toUser)
  receivedMessage: Message[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashpassword() {
    this.password = hashSync(this.password, 10);
  }

  @BeforeInsert()
  insertTime() {
    this.createdOn = new Date();
  }
}
