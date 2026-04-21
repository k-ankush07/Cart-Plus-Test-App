import { shopConfigModel } from "../model/schema.js";
import {sessionStorage} from "../../app/shopify.server.js";

export async function getValidAccessToken(shop) {
  const session = await sessionStorage.loadSession(`offline_${shop}`);

  if (!session?.accessToken) {
    throw new Error("No token found");
  }

  const token = session.accessToken;

  await shopConfigModel.findOneAndUpdate(
    { shop },
    { accessToken: token, updatedAt: new Date() },
    { upsert: true }
  );

  return token;
}