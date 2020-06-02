import { Keyword } from "./../entity/keyword";
import { Item } from "./../entity/item";
import { getRepository } from "typeorm";
import {
  Path,
  ServiceContext,
  Context,
  GET,
  QueryParam,
} from "typescript-rest";
import { BaseResponse } from "../response/base_response";
import { SuccessResponse } from "../response/success_response";

@Path("/api/search")
export class SearchService {
  @Context
  context: ServiceContext;

  @GET
  @Path("keyword")
  async getHotKeyword(): Promise<BaseResponse> {
    return new SuccessResponse(
      await getRepository(Keyword).find({ order: { count: "DESC" }, take: 10 })
    );
  }

  @GET
  async search(
    @QueryParam("keyword") keyword: string = "",
    @QueryParam("price_from") priceFrom: number = -1,
    @QueryParam("price_to") priceTo: number = -1,
    @QueryParam("order_field") orderField: string = "createdOn",
    @QueryParam("order") order: string = "DESC",
    @QueryParam("item_status") itemStatus: number = -1,
    @QueryParam("warranty") warranty: number = -1
  ): Promise<BaseResponse> {
    let all = await getRepository(Item).find({
      relations: ["owner"],
    });

    if (keyword) {
      for (const k of keyword.split(" ")) {
        const kw = await getRepository(Keyword).findOne({ keyword: k });
        if (kw != null) {
          kw.count++;
          kw.save();
        } else {
          await getRepository(Keyword).insert({ keyword: k });
        }
      }
    }

    all = all.filter((i) => {
      let found = false;
      if (keyword) {
        keyword.split(" ").forEach((k) => {
          if (i.name.toLowerCase().includes(k.toLowerCase())) {
            found = true;
          }
          const tags: string[] = JSON.parse(i.tags);
          tags.forEach((t) => {
            if (t.toLowerCase() == k.toLowerCase()) {
              found = true;
            }
          });
        });
        return found;
      } else {
        return true;
      }
    });

    if (priceFrom >= 0) {
      all = all.filter((i) => i.price >= priceFrom);
    }

    if (priceTo >= 0) {
      all = all.filter((i) => i.price <= priceTo);
    }

    if (warranty >= 0) {
      all = all.filter((i) => i.warranty == !!warranty);
    }

    if (itemStatus >= 0) {
      all = all.filter((i) => i.status == itemStatus);
    }

    order = order || "DESC";
    const orderAsc = order == "ASC";

    if (orderField == "price") {
      all = all.sort(
        (a, b) =>
          (orderAsc ? a.price : b.price) - (orderAsc ? b.price : a.price)
      );
    } else if (orderField == "name") {
      all = all.sort((a, b) =>
        (orderAsc ? a.name : b.name).localeCompare(orderAsc ? b.name : a.name)
      );
    } else {
      all = all.sort(
        (a, b) =>
          +(orderAsc ? a.createdOn : b.createdOn) -
          +(orderAsc ? b.createdOn : a.createdOn)
      );
    }

    return new SuccessResponse<Item[]>(all);
  }
}
