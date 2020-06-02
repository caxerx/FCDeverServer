import {
  Path,
  POST,
  ServiceContext,
  Context,
  FileParam,
} from "typescript-rest";
import { BaseResponse } from "../response/base_response";
import { SuccessResponse } from "../response/success_response";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";

@Path("/api/file")
export class FileService {
  @Context
  context: ServiceContext;

  @POST
  async createItem(
    @FileParam("file") file: Express.Multer.File
  ): Promise<BaseResponse> {
    const fileName = uuidv4();
    fs.writeFile(`public/images/${fileName}`, file.buffer);
    return new SuccessResponse<string>(fileName);
  }
}
