import { getRedisData } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request, res: Response) {
  try {
    const body = await req.json();

    const { id: idToAdd } = z.object({ id: z.string() }).parse(body);

    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    //verify that the user is not already friends with the user
    const isAlreadyFriends = await getRedisData(
      "sismember",
      `user:${session.user.id}:friends`,
      idToAdd
    );

    if (isAlreadyFriends) {
      return new Response("Already a friend", { status: 400 });
    }

    //verify that the user has a friend request from the user
    const hasFriendRequest = await getRedisData(
      "sismember",
      `user:${session.user.id}:incoming_friend_request`,
      idToAdd
    );

    if (!hasFriendRequest) {
      return new Response("No friend request", { status: 400 });
    }

    //notify user that the friend request was accepted
    pusherServer.trigger(
      toPusherKey(`user:${session.user.id}:friends`),
      "new_friend",
      {}
    );

    //accept the friend request
    await db.sadd(`user:${session.user.id}:friends`, idToAdd);
    await db.sadd(`user:${idToAdd}:friends`, session.user.id);

    //remove the incoming friend request
    await db.srem(`user:${session.user.id}:incoming_friend_request`, idToAdd);

    return new Response("Friend request accepted", { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request body", { status: 422 });
    }

    return new Response("Invalid Request", { status: 400 });
  }
}
