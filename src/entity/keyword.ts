import { Item } from "./item";
import { User } from "./user";
import { Trade } from "./trade";
import { BaseEntity, Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Keyword extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false, type: "text" })
  keyword: string;

  @Column({ nullable: false, default: 1 })
  count: number;
}
