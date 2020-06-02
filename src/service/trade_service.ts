import { CommentRequest } from "./../request/comment_request";
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
import { getRepository, QueryFailedError, Equal, In, Not } from "typeorm";
import { BaseResponse } from "../response/base_response";
import { ErrorResponse } from "../response/error_response";
import { SuccessResponse } from "../response/success_response";
import { Comment } from "../entity/comment";

@Path("/api/trade")
export class TradeService {
  @Context
  context: ServiceContext;

  @Path("unread")
  @GET
  async getUnreadTrade(): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    const trade = await getRepository(Trade).find({
      relations: ["buyer", "seller"],
      where: [
        {
          seller: {
            id: Equal(user.id),
          },
          status: Equal(0),
          sellerRead: Equal(false),
        },
        {
          buyer: {
            id: Equal(user.id),
          },
          status: In([1, 2, 3]),
          buyerRead: Equal(false),
        },
      ],
    });
    return new SuccessResponse<number>(trade.length);
  }

  @GET
  @Path("sell")
  async getSellTrades(): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    let user = await getRepository(User).findOne(
      {
        id: userSession.id,
      },
      {
        relations: [
          "sellTrade",
          "sellTrade.item",
          "sellTrade.buyer",
          "sellTrade.seller",
        ],
      }
    );

    user.sellTrade.forEach((s) => {
      s.sellerRead = true;
      s.save();
    });

    return new SuccessResponse<Trade[]>(
      user.sellTrade.sort((b, a) => +a.createdOn - +b.createdOn)
    );
  }

  @GET
  @Path("buy")
  async getBuyTrades(): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    let user = await getRepository(User).findOne(
      {
        id: userSession.id,
      },
      {
        relations: [
          "buyTrade",
          "buyTrade.item",
          "buyTrade.buyer",
          "buyTrade.seller",
        ],
      }
    );

    user.buyTrade.forEach((s) => {
      s.buyerRead = true;
      s.save();
    });

    return new SuccessResponse<Trade[]>(
      user.buyTrade.sort((b, a) => +a.createdOn - +b.createdOn)
    );
  }

  @POST
  @Path(":id/accept")
  async acceptTrade(@PathParam("id") id: string): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }
    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    let trade = await getRepository(Trade).findOne(
      {
        id,
      },
      {
        relations: ["item", "buyer", "seller"],
      }
    );

    if (trade.seller.id == user.id && trade.status == 0) {
      trade.item.tradeStatus = 1;
      trade.item.save();
      trade.status = 1;
      await trade.save();
      const sameItemTrade = await getRepository(Trade).find({
        relations: ["item"],
        where: {
          id: Not(Equal(trade.id)),
          item: {
            id: Equal(trade.item.id),
            status: Equal(0),
          },
        },
      });
      sameItemTrade.forEach((i) => {
        i.status = 2;
        i.save();
      });
      return new SuccessResponse<string>("Trade accepted.");
    } else {
      return new ErrorResponse<string>(
        "You are not the seller or trade is not waiting for accept"
      );
    }
  }

  @POST
  @Path(":id/reject")
  async rejectTrade(@PathParam("id") id: string): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }
    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    let trade = await getRepository(Trade).findOne(
      {
        id,
      },
      {
        relations: ["item", "buyer", "seller"],
      }
    );

    if (trade.seller.id == user.id && trade.status == 0) {
      trade.status = 2;
      await trade.save();
      return new SuccessResponse<string>("Trade reject.");
    } else {
      return new ErrorResponse<string>(
        "You are not the seller or trade is not waiting for accept"
      );
    }
  }

  @POST
  @Path(":id/confirm")
  async confirmTrade(@PathParam("id") id: string): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }
    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    let trade = await getRepository(Trade).findOne(
      {
        id,
      },
      {
        relations: ["item", "buyer", "seller"],
      }
    );

    if (trade.buyer.id == user.id && trade.status == 1) {
      trade.item.tradeStatus = 2;
      trade.item.save();
      trade.status = 4;
      await trade.save();
      return new SuccessResponse<string>("Trade confirmed.");
    } else {
      return new ErrorResponse<string>(
        "You are not the buter or trade is not waiting for confirm"
      );
    }
  }

  @POST
  @Path(":id/comment")
  async addComment(
    @PathParam("id") id: string,
    body: CommentRequest
  ): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }
    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    let trade = await getRepository(Trade).findOne(
      {
        id,
      },
      {
        relations: ["item", "buyer", "seller"],
      }
    );

    if (trade.status == 4) {
      if (trade.seller.id == user.id) {
        trade.sellerComment = true;
        await trade.save();
        const entity = getRepository(Comment).create({
          type: 0,
          rate: body.rate,
          comment: body.comment,
          fromUser: trade.seller,
          toUser: trade.buyer,
          item: trade.item,
        });
        await entity.save();
        return new SuccessResponse<string>("Trade commented.");
      } else if (trade.buyer.id == user.id) {
        trade.buyerComment = true;
        await trade.save();
        const entity = getRepository(Comment).create({
          type: 1,
          rate: body.rate,
          comment: body.comment,
          fromUser: trade.buyer,
          toUser: trade.seller,
          item: trade.item,
        });
        await entity.save();
        return new SuccessResponse<string>("Trade commented.");
      } else {
        return new ErrorResponse<string>("You cannot comment on this trade");
      }
    } else {
      return new ErrorResponse<string>("Trade is not ready to comment");
    }
  }
}
