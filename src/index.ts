import { MessageService } from "./service/message_service";
import { SearchService } from "./service/search_service";
import { TradeService } from "./service/trade_service";
import { FileService } from "./service/file_service";
import { ItemService } from "./service/item_service";
import "reflect-metadata";
import * as express from "express";
import { Server } from "typescript-rest";
import { createConnection } from "typeorm";

import { UserService } from "./service/user_service";

import * as session from "express-session";
import * as proxy from "express-http-proxy";

let app: express.Application = express();

app.use(
  session({
    secret: "secret_exp",
    resave: false,
    saveUninitialized: true,
  })
);

app.disable("etag");

app.use("/images", express.static("public/images"));

Server.buildServices(
  app,
  UserService,
  ItemService,
  FileService,
  TradeService,
  SearchService,
  MessageService
);

app.use("/", proxy("https://dcff.iw.gy"));

createConnection()
  .then(async (connection) => {
    console.log("Database connect successfully.");
    app.listen(3000, function () {
      console.log("Rest Server listening on port 3000!");
    });
  })
  .catch((error) => console.log(error));
