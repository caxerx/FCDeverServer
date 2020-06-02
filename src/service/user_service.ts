import { UserInfoResponse } from "./../response/user_info_response";
import { Item } from "./../entity/item";
import {
  Path,
  GET,
  POST,
  ServiceContext,
  Context,
  PathParam,
} from "typescript-rest";
import { User } from "../entity/user";
import { getRepository, QueryFailedError } from "typeorm";
import { BaseResponse } from "../response/base_response";
import { RegisterRequest } from "../request/register_request";
import { ErrorResponse } from "../response/error_response";
import { SuccessResponse } from "../response/success_response";
import { RegisterResponse } from "../response/register_response";
import { LoginResponse } from "../response/login_response";
import { LoginRequest } from "../request/login_request";
import { compareSync } from "bcrypt";

function registrationValidation(request: RegisterRequest) {
  if (!request.email) {
    throw new ErrorResponse<string>("email not present");
  }

  if (
    !/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(
      request.email
    )
  ) {
    throw new ErrorResponse<string>("invalid email format");
  }

  if (!request.password) {
    throw new ErrorResponse<string>("password not present");
  }

  if (
    request.password.length < 8 ||
    !/[A-Z]/.test(request.password) ||
    !/[a-z]/.test(request.password) ||
    !/[0-9]/.test(request.password)
  ) {
    throw new ErrorResponse<string>(
      "password must be more than 8 character and contains at least 1 uppercase chararcter, 1 lowercase character and 1 numeric character."
    );
  }
}

function loginValidation(request: LoginRequest) {
  if (!request.email) {
    throw new ErrorResponse<string>("email not present");
  }

  if (!request.password) {
    throw new ErrorResponse<string>("password not present");
  }
}

@Path("/api/user")
export class UserService {
  @Context
  context: ServiceContext;

  @Path("register")
  @POST
  async registerUser(body: RegisterRequest): Promise<BaseResponse> {
    try {
      registrationValidation(body);
    } catch (e) {
      return e;
    }
    try {
      let entity = getRepository(User).create({
        email: body.email,
        password: body.password,
        phoneNumber: body.phoneNumber,
      });
      entity = await entity.save();
      this.context.request.session.user = entity;
      return new SuccessResponse<RegisterResponse>({
        userId: entity.id,
      });
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        e.message.startsWith("ER_DUP_ENTRY")
      ) {
        return new ErrorResponse<string>(
          "The registration email has been taken"
        );
      } else {
        return new ErrorResponse<object>(e);
      }
    }
  }

  @Path("login")
  @POST
  async loginUser(body: LoginRequest): Promise<BaseResponse> {
    try {
      loginValidation(body);
    } catch (e) {
      return e;
    }

    let entity = await getRepository(User)
      .createQueryBuilder()
      .addSelect("User.password")
      .where({
        email: body.email,
      })
      .getOne();
    if (!entity) {
      return new ErrorResponse<string>("User not found.");
    }

    if (compareSync(body.password, entity.password)) {
      this.context.request.session.user = entity;
      return new SuccessResponse<LoginResponse>({
        userId: entity.id,
        email: entity.email,
        phoneNumber: entity.phoneNumber,
      });
    } else {
      return new ErrorResponse<string>("Invalid password.");
    }
  }

  async getUserInfoRaw(id: string): Promise<UserInfoResponse> {
    const user = await getRepository(User).findOne(
      {
        id,
      },
      {
        relations: [
          "items",
          "receivedComment",
          "receivedComment.fromUser",
          "receivedComment.item",
          "sellTrade",
          "buyTrade",
        ],
      }
    );

    if (user == null) {
      return;
    }

    user.items = user.items.sort((b, a) => +a.createdOn - +b.createdOn);
    user.receivedComment = user.receivedComment.sort(
      (b, a) => +a.createdOn - +b.createdOn
    );

    const successSellTrade: number = user.sellTrade.filter((i) => i.status == 4)
      .length;
    const successBuyTrade: number = user.buyTrade.filter((i) => i.status == 4)
      .length;

    const goodRate: number = user.receivedComment.filter((c) => c.rate == 0)
      .length;
    const badRate: number = user.receivedComment.filter((c) => c.rate == 1)
      .length;

    return {
      userId: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      successTrade: successSellTrade + successBuyTrade,
      goodRate,
      badRate,
      items: user.items,
      comments: user.receivedComment,
    };
  }

  @Path("info")
  @GET
  async getUserInfo(): Promise<BaseResponse> {
    if (this.context.request.session.user) {
      return new SuccessResponse<UserInfoResponse>(
        await this.getUserInfoRaw(this.context.request.session.user.id)
      );
    }
    return new ErrorResponse<string>("user not logged in");
  }

  @Path("info/:id")
  @GET
  async getUserInfoById(@PathParam("id") id: string): Promise<BaseResponse> {
    const user = await this.getUserInfoRaw(id);
    if (user) {
      return new SuccessResponse<UserInfoResponse>(user);
    }
    return new ErrorResponse<string>("User not found.");
  }

  @Path("item/:id")
  @GET
  async getUserItemById(@PathParam("id") id: string): Promise<BaseResponse> {
    const user = await getRepository(User).findOne(id, {
      relations: ["items"],
    });
    if (user) {
      return new SuccessResponse<Item[]>(user.items);
    }
    return new ErrorResponse<string>("User not found.");
  }
}
