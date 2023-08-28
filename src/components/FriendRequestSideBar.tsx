"use client";

import { pusherClient } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { User } from "lucide-react";
import Link from "next/link";
import { FC, useEffect, useState } from "react";

interface FriendRequestSideBarProps {
  sessionId: string;
  initialUnseenRequestCount: number;
}

const FriendRequestSideBar: FC<FriendRequestSideBarProps> = ({
  sessionId,
  initialUnseenRequestCount,
}) => {
  const [unseenRequestCount, setUnseenRequestCount] = useState<number>(
    initialUnseenRequestCount
  );

  useEffect(() => {
    pusherClient.subscribe(
      toPusherKey(`user:${sessionId}:incoming_friend_request`)
    );

    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`));
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:reject`));
    const friendRequestHandler = () => {
      setUnseenRequestCount((prev) => prev + 1);
    };

    const decrementCountHandler = () => {
      setUnseenRequestCount((prev) => prev - 1);
    };

    pusherClient.bind("incoming_friend_request", friendRequestHandler);
    pusherClient.bind("new_friend", decrementCountHandler);
    pusherClient.bind("reject_friend", decrementCountHandler);

    return () => {
      pusherClient.unbind("new_friend", decrementCountHandler);
      pusherClient.unbind("reject_friend", decrementCountHandler);
      pusherClient.unbind("incoming_friend_request", friendRequestHandler);

      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`));
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:reject`));
      pusherClient.unsubscribe(
        toPusherKey(`user:${sessionId}:incoming_friend_request`)
      );
    };
  }, [sessionId]);

  return (
    <Link
      href="/dashboard/requests"
      className="text-gray-700 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
    >
      <div className="text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white">
        <User className="h-4 w-4" />
      </div>
      <p className="truncate"> Friend Requests</p>

      {unseenRequestCount > 0 && (
        <div className="rounded-full h-5 w-5 text-sm flex justify-center items-center text-white bg-indigo-600">
          {unseenRequestCount}
        </div>
      )}
    </Link>
  );
};

export default FriendRequestSideBar;
