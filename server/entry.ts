import { telefuncHandler } from "./telefunc-handler";
import { apply, serve } from "@photonjs/express";
import express from "express";
import cookieParser from "cookie-parser";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default startApp() as unknown;

function startApp() {
  const app = express();


  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  apply(app, [

    telefuncHandler,
  ]);

  return serve(app, {
    port,
  });
}
