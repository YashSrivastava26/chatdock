import { getRedisData } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friends";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    //validating request
    const { email: emailToAdd } = addFriendValidator.parse(body.email);

    const restUrl: string = process.env.UPSTASH_REDIS_REST_URL as string;
    const token: string = process.env.UPSTASH_REDIS_REST_TOKEN as string;

    //getting userToAdd data
    const idToAdd = (await getRedisData("get", `user:email:${emailToAdd}`)) as
      | string
      | null;

    //user not found
    if (!idToAdd) {
      console.log("user not found");
      return new Response("User not found", { status: 400 });
    }

    const session = await getServerSession(authOptions);

    //unauthorised access
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    //user is already your friend
    const isFriend = (await getRedisData(
      "sismember",
      `user:${idToAdd}:friends`,
      session.user.id
    )) as 0 | 1;
    if (isFriend) {
      return new Response("User is already your friend", { status: 400 });
    }

    //Friend request already sent
    const alreadySentRequest = (await getRedisData(
      "sismember",
      `user:${session.user.id}:incoming_friend_request`,
      idToAdd
    )) as 0 | 1;
    if (alreadySentRequest) {
      return new Response("Friend request already sent", { status: 400 });
    }

    //adding yourself
    if (idToAdd === session.user.id) {
      return new Response("You can't add yourself", { status: 400 });
    }

    //vaild

    pusherServer.trigger(
      toPusherKey(`user:${idToAdd}:incoming_friend_request`),
      "incoming_friend_request",
      {
        senderId: session.user.id,
        senderEmail: session.user.email,
        senderName: session.user.name,
      }
    );

    db.sadd(`user:${idToAdd}:incoming_friend_request`, session.user.id);
    // console.log(data)
    return new Response("Friend request sent", { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("invalid payload", { status: 422 });
    }

    return new Response("Internal server error", { status: 500 });
  }
}
