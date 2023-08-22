"use cliennt";
import { getFriendsByUserId } from "@/helpers/getFriendsByUserId";
import { getRedisData } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { chatHrefConstructor } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { User, getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const page = async ({}) => {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const friends = await getFriendsByUserId(session.user.id);

  const friendsLastMessage = await Promise.all(
    friends.map(async (friend) => {
      const [lastMessageString] = (await getRedisData(
        "zrange",
        `chat:${chatHrefConstructor(session.user.id, friend.id)}:message`,
        -1,
        -1
      )) as string[];

      const lastMessage = JSON.parse(lastMessageString) as Message;

      return {
        ...friend,
        lastMessage,
      };
    })
  );
  return (
    <div className="container p-12">
      <h1 className="font-bold text-5xl mb-8">Recent Chats</h1>
      {friendsLastMessage.length === 0 ? (
        <p className="text-sm text-zinc-500">Nothing to show here...</p>
      ) : (
        friendsLastMessage.map((friend) => (
          <div
            key={friend.id}
            className="relative bg-zinc-50 border border-zinc-200 p-3 rounded-md"
          >
            <div className="absolute right-4 inset-y-0 flex items-center">
              <ChevronRight className="h-7 w-7 text-zinc-400" />
            </div>

            <Link
              href={`/dashboard/chat/${chatHrefConstructor(
                session.user.id,
                friend.id
              )}`}
              className="relative sm:flex"
            >
              <div className="mb-4 flex-shrink-0 sm:mb-0 sm:mr-4">
                <div className="relative h-6 w-6">
                  <Image
                    referrerPolicy="no-referrer"
                    className="rounded-full"
                    alt={`${friend.name} profile picture`}
                    src={friend.image}
                    fill
                  />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold">{friend.name}</h4>
                <p className="mt-1 max-w-md">
                  <span className="text-zinc-400">
                    {friend.lastMessage?.senderId === session.user.id &&
                      "You: "}
                  </span>
                  {friend.lastMessage?.text}
                </p>
              </div>
            </Link>
          </div>
        ))
      )}
    </div>
  );
};

export default page;
