import { Comment } from "./comment";
import { User } from "./user";
import { Item } from "./item";
import {
  BaseEntity,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  BeforeInsert,
} from "typeorm";

@Entity()
export class Trade extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne((type) => User, (user) => user.sellTrade)
  @JoinColumn()
  seller: User;

  @ManyToOne((type) => User, (user) => user.buyTrade)
  @JoinColumn()
  buyer: User;

  @ManyToOne((type) => Item, (item) => item.trade)
  @JoinColumn()
  item: Item;

  //0 = WAITING FOR SELLER ACCEPT
  //1 = WAITING FOR BUYER CONFIRMED
  //2 = SELLER REJECTED
  //3 = ITEM CANCELLED
  //4 = TRADE SUCCESS
  @Column({ nullable: false, default: 0 })
  status: number;

  @Column({ nullable: false, default: false })
  sellerRead: boolean;

  @Column({ nullable: false, default: false })
  buyerRead: boolean;

  @Column({ nullable: false, default: false })
  buyerComment: boolean;

  @Column({ nullable: false, default: false })
  sellerComment: boolean;

  @Column({ nullable: false, type: "datetime" })
  createdOn: Date;

  @BeforeInsert()
  insertTime() {
    this.createdOn = new Date();
  }
}
