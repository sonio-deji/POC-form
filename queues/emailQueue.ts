import { Queue } from "bullmq";
import { redisConnection } from "../libs/redis";



export const emailQueue = new Queue("email-queue", {
  connection: redisConnection,
});
