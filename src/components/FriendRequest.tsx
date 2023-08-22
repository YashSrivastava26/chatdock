"use client";

import { pusherClient } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import axios from "axios";
import { Check, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";

interface FriendRequestProps {
  incomingFriendRequests: incomingFriendRequest[];
  sessionId: string;
}

const FriendRequest: FC<FriendRequestProps> = ({
  incomingFriendRequests,
  sessionId,
}) => {
  const router = useRouter();
  const [friendRequests, setFriendRequests] = useState<incomingFriendRequest[]>(
    incomingFriendRequests
  );

  useEffect(() => {
    pusherClient.subscribe(
      toPusherKey(`user:${sessionId}:incoming_friend_request`)
    );
    const friendRequestHandler = ({
      senderId,
      senderEmail,
      senderName,
    }: incomingFriendRequest) => {
      setFriendRequests((prev) => [
        ...prev,
        { senderId, senderEmail, senderName },
      ]);
    };

    pusherClient.bind("incoming_friend_request", friendRequestHandler);

    return () => {
      pusherClient.unbind("incoming_friend_request", friendRequestHandler);
      pusherClient.unsubscribe(
        toPusherKey(`user:${sessionId}:incoming_friend_request`)
      );
    };
  }, [sessionId]);

  //accept friend request
  const acceptFriendRequest = async (senderId: string) => {
    await axios.post("/api/friends/accept", { id: senderId });

    setFriendRequests(
      friendRequests.filter(
        (friendRequest) => friendRequest.senderId !== senderId
      )
    );

    router.refresh();
  };

  //reject friend request
  const rejectFriendRequest = async (senderId: string) => {
    await axios.post("/api/friends/reject", { id: senderId });

    setFriendRequests(
      friendRequests.filter(
        (friendRequest) => friendRequest.senderId !== senderId
      )
    );

    router.refresh();
  };

  return (
    <>
      {friendRequests.length === 0 ? (
        <p className="text-sm text-zinc-500 =">Nothing to show here...</p>
      ) : (
        friendRequests.map((friendRequest) => (
          <div key={friendRequest.senderId} className="flex gap-4 items-center">
            <UserPlus className="text-black" />
            <p className="font-medium text-lg">{friendRequest.senderEmail}</p>
            <button
              onClick={() => acceptFriendRequest(friendRequest.senderId)}
              aria-label="accept friend"
              className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 flex justify-center items-center rounded-full transition hover:shadow-md"
            >
              <Check className="font-semibold text-white w-3/4 h-3/4" />
            </button>
            <button
              onClick={() => rejectFriendRequest(friendRequest.senderId)}
              aria-label="Deny friend"
              className="w-8 h-8 bg-red-600 hover:bg-red-700 flex justify-center items-center rounded-full transition hover:shadow-md"
            >
              <X className="font-semibold text-white w-3/4 h-3/4" />
            </button>
          </div>
        ))
      )}
    </>
  );
};

export default FriendRequest;
