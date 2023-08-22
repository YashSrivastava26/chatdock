"use client";

import { pusherClient } from "@/lib/pusher";
import { chatHrefConstructor, toPusherKey } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import UnseenMessageNotification from "./UnseenMessageNotification";

interface SideBarChatListProps {
  friends: User[];
  sessionId: string;
}

interface ExtendedMessage extends Message {
  senderImage: string;
  senderName: string;
}
const SideBarChatList: FC<SideBarChatListProps> = ({ friends, sessionId }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [unseenMessage, setUnseenMessage] = useState<Message[]>([]);

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:chats`));
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`));

    const newMessageHandler = (message: ExtendedMessage) => {
      const shouldNotify =
        pathname !==
        `/dashboard/chats/${chatHrefConstructor(sessionId, message.senderId)}`;

      if (!shouldNotify) return;

      //notifing the user
      toast.custom((t) => (
        <UnseenMessageNotification
          t={t}
          senderId={message.senderId}
          senderName={message.senderName}
          senderMessage={message.text}
          senderImg={message.senderImage}
          sessionId={sessionId}
        />
      ));
      setUnseenMessage((prev) => [...prev, message]);
    };

    const newFriendHandler = () => {
      router.refresh();
    };

    pusherClient.bind("new_message", newMessageHandler);
    pusherClient.bind("new_friend", newFriendHandler);

    return () => {
      pusherClient.unbind("new_message", newMessageHandler);
      pusherClient.unbind("new_friend", newFriendHandler);
      pusherClient.unsubscribe(`user:${sessionId}:chats`);
      pusherClient.unsubscribe(`user:${sessionId}:friends`);
    };
  }, [pathname, sessionId, router]);

  useEffect(() => {
    if (pathname?.includes("chat")) {
      setUnseenMessage((prev) => {
        return prev.filter((message) => !pathname.includes(message.id));
      });
    }
  }, [pathname]);

  return (
    <ul role="list" className="max-h-[25rem] overflow-y-auto -mx-2 space-y-1">
      {friends.sort().map((friend) => {
        const unseenMeassageCount = unseenMessage.filter((message) => {
          return message.senderId === friend.id;
        }).length;
        return (
          <li key={friend.id}>
            <a
              className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 flex items-center justify-between gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
              href={`/dashboard/chats/${chatHrefConstructor(
                sessionId,
                friend.id
              )}`}
            >
              {friend.name}
              {unseenMeassageCount > 0 && (
                <div className="bg-indigo-600 font-medium text-sm text-white w-4 h-4 rounded-full flex justify-center items-center">
                  {unseenMeassageCount}
                </div>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default SideBarChatList;
