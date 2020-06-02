import { Comment } from "./comment";
import { Trade } from "./trade";
import { User } from "./user";
import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  OneToMany,
} from "typeorm";

@Entity()
export class Item extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false, type: "text", default: "[]" })
  images: string;

  @ManyToOne((type) => User, (user) => user.items)
  @JoinColumn()
  owner: User;

  @OneToMany((type) => Trade, (trade) => trade.item)
  @JoinColumn()
  trade: Trade[];

  @Column({ nullable: false })
  status: number;

  //0 = Available
  //1 = Trading
  //2 = Success
  //3 = Canceled
  @Column({ nullable: false, default: 0 })
  tradeStatus: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, type: "text" })
  description: string;

  @Column({ nullable: false })
  warranty: boolean;

  @Column({ nullable: false })
  price: number;

  @Column({ nullable: false, default: false })
  negotiable: boolean;

  @Column({ nullable: false, type: "text", default: "[]" })
  tags: string;

  @OneToMany((type) => Comment, (comment) => comment.item)
  @JoinColumn()
  comment: Comment;

  @Column({ nullable: false, type: "datetime" })
  createdOn: Date;

  @BeforeInsert()
  insertTime() {
    this.createdOn = new Date();
  }
}
