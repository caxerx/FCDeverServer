import { CreateTradeResponse } from "./../response/create_trade_response";
import { Trade } from "./../entity/trade";
import { User } from "./../entity/user";
import { Item } from "./../entity/item";
import { CreateItemResponse } from "./../response/create_item_response";
import { ItemRequest } from "./../request/item_request";
import {
  Path,
  GET,
  POST,
  ServiceContext,
  Context,
  PathParam,
  QueryParam,
} from "typescript-rest";
import { getRepository, QueryFailedError, Equal } from "typeorm";
import { BaseResponse } from "../response/base_response";
import { ErrorResponse } from "../response/error_response";
import { SuccessResponse } from "../response/success_response";

@Path("/api/item")
export class ItemService {
  @Context
  context: ServiceContext;

  @POST
  async createItem(body: ItemRequest): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    let entity = getRepository(Item).create({
      owner: user,
      images: body.images,
      status: body.status,
      name: body.name,
      description: body.description,
      warranty: body.warranty,
      price: body.price,
      negotiable: body.negotiable,
      tags: body.tags,
    });

    entity = await entity.save();

    return new SuccessResponse<CreateItemResponse>({
      itemId: entity.id,
    });
  }

  @Path(":id")
  @GET
  async getItemInfo(@PathParam("id") id: string): Promise<BaseResponse> {
    const item = await getRepository(Item).findOne(
      { id },
      { relations: ["owner", "trade"] }
    );
    if (item) return new SuccessResponse<Item>(item);
    return new ErrorResponse<string>("Item not found");
  }

  @Path(":id/cancel")
  @POST
  async cancelItem(@PathParam("id") id: string): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    const item = await getRepository(Item).findOne(
      {
        id,
      },
      {
        relations: ["owner", "trade"],
      }
    );

    if (item == null) {
      return new ErrorResponse<string>("Item not found");
    }

    if (item.owner.id != user.id) {
      return new ErrorResponse<string>(
        "You only can cancel the item created by you."
      );
    }

    item.tradeStatus = 3;
    await item.save();
    for (const i of item.trade) {
      i.status = 3;
      await i.save();
    }

    return new SuccessResponse<string>("Item cancelled");
  }

  @GET
  async getDiscover(): Promise<BaseResponse> {
    const item = await getRepository(Item).find({
      relations: ["owner", "trade"],
      order: {
        createdOn: "DESC",
      },
      where: {
        tradeStatus: Equal(0),
      },
      take: 9,
    });

    return new SuccessResponse<Item[]>(item);
  }

  @POST
  @Path(":id/trade")
  async sendTradeRequest(@PathParam("id") id: string): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    const item = await getRepository(Item).findOne(
      {
        id,
      },
      {
        relations: ["owner", "trade"],
      }
    );
    if (item == null) {
      return new ErrorResponse<string>("Item not found");
    }
    if (item.owner.id == userSession.id) {
      return new ErrorResponse<string>("Can't trade with yourself.");
    }

    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    let entity = getRepository(Trade).create({
      item: item,
      buyer: user,
      seller: item.owner,
    });

    entity = await entity.save();

    return new SuccessResponse<CreateTradeResponse>({
      tradeId: entity.id,
    });
  }
}
