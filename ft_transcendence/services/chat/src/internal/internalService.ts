import { HttpError } from "../utils/HttpError";
import * as internalRepository from "./internalRepository";

export async function saveMessage(fromUserId: string, roomId: string, message: string) {
  await internalRepository.saveMessage(fromUserId, roomId, message);
}