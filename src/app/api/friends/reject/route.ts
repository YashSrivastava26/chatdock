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

    const { id: idToReject } = z.object({ id: z.string() }).parse(body);

    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    pusherServer.trigger(
      toPusherKey(`user:${session.user.id}:reject`),
      "reject_friend",
      {}
    );
    //reject the incoming friend request
    await db.srem(
      `user:${session.user.id}:incoming_friend_request`,
      idToReject
    );

    return new Response("Friend request rejected", { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request body", { status: 422 });
    }

    return new Response("Invalid Request", { status: 400 });
  }
}
