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
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false, type: "text", default: "" })
  title: string;

  @Column({ nullable: false, type: "text", default: "" })
  message: string;

  @Column({ nullable: false, default: false })
  read: boolean;

  @ManyToOne((type) => User, (user) => user.sentMessage)
  @JoinColumn()
  fromUser: User;

  @ManyToOne((type) => User, (user) => user.receivedMessage)
  @JoinColumn()
  toUser: User;

  @Column({ nullable: false, type: "datetime" })
  createdOn: Date;

  @BeforeInsert()
  insertTime() {
    this.createdOn = new Date();
  }
}
