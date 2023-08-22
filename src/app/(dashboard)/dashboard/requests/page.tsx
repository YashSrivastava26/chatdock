import FriendRequest from "@/components/FriendRequest";
import { getRedisData } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { FC } from "react";

const page = async () => {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const incomingRequestsId = (await getRedisData(
    "smembers",
    `user:${session.user.id}:incoming_friend_request`
  )) as string[];

  const incomingFriendRequests = await Promise.all(
    incomingRequestsId.map(async (idOfRequestAccount) => {
      const requestAccountString = (await getRedisData(
        "get",
        `user:${idOfRequestAccount}`
      )) as string;

      const requestAccount = JSON.parse(requestAccountString);

      return {
        senderId: idOfRequestAccount,
        senderName: requestAccount.name,
        senderEmail: requestAccount.email,
      };
    })
  );

  return (
    <main className="pt-8">
      <h1 className="font-bold text-5xl mb-8">Add a friend</h1>
      <div className="flex flex-col gap-4">
        <FriendRequest
          incomingFriendRequests={incomingFriendRequests}
          sessionId={session.user.id}
        />
      </div>
    </main>
  );
};

export default page;
