import { MessageRequest } from "./../request/message_request";
import { User } from "./../entity/user";
import { ErrorResponse } from "./../response/error_response";
import { Keyword } from "./../entity/keyword";
import { getRepository, Equal } from "typeorm";
import {
  Path,
  ServiceContext,
  Context,
  GET,
  QueryParam,
  POST,
} from "typescript-rest";
import { BaseResponse } from "../response/base_response";
import { SuccessResponse } from "../response/success_response";
import { Message } from "../entity/message";

@Path("/api/message")
export class MessageService {
  @Context
  context: ServiceContext;

  @POST
  async sendMessage(body: MessageRequest): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    let fromUser = await getRepository(User).findOne({
      id: userSession.id,
    });

    let toUser = await getRepository(User).findOne({
      email: body.to,
    });

    if (!(fromUser && toUser)) {
      return new ErrorResponse<string>("User not found.");
    }

    let entity = getRepository(Message).create({
      title: body.title,
      message: body.message,
      fromUser,
      toUser,
    });
    entity = await entity.save();

    return new SuccessResponse<Message>(entity);
  }

  @GET
  @Path("unread")
  async getUnreadMessage(): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    const messages = await getRepository(Message).find({
      relations: ["fromUser", "toUser"],
      order: {
        createdOn: "DESC",
      },
      where: {
        toUser: {
          id: Equal(user.id),
        },
        read: Equal(false),
      },
    });
    return new SuccessResponse<number>(messages.length);
  }

  @GET
  @Path("received")
  async getReceivedMessage(): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    const messages = await getRepository(Message).find({
      relations: ["fromUser", "toUser"],
      order: {
        createdOn: "DESC",
      },
      where: {
        toUser: {
          id: Equal(user.id),
        },
      },
    });

    setTimeout(() => {
      messages.forEach((m) => {
        m.read = true;
        m.save();
      });
    }, 200);
    
    return new SuccessResponse<Message[]>(messages);
  }

  @GET
  @Path("sent")
  async getSentMessage(): Promise<BaseResponse> {
    const userSession = this.context.request.session.user;
    if (!userSession) {
      return new ErrorResponse<string>("User not logged in.");
    }

    let user = await getRepository(User).findOne({
      id: userSession.id,
    });

    const messages = await getRepository(Message).find({
      relations: ["fromUser", "toUser"],
      order: {
        createdOn: "DESC",
      },
      where: {
        fromUser: {
          id: Equal(user.id),
        },
      },
    });
    return new SuccessResponse<Message[]>(messages);
  }
}
