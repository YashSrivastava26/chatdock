import ChatInput from "@/components/ChatInput";
import Messages from "@/components/Messages";
import { getRedisData } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { messageArraySchema } from "@/lib/validations/message";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { notFound } from "next/navigation";

interface pageProps {
  params: {
    chatId: string;
  };
}

async function getChatMessages(chatId: string) {
  try {
    //fetching messages from redis
    const initialMessages = (await getRedisData(
      "zrange",
      `chat:${chatId}:message`,
      0,
      -1
    )) as string[];

    //parsing messages
    const messages = initialMessages.map((message) =>
      JSON.parse(message)
    ) as Message[];

    //reversing messages
    const reversedMessages = messages.reverse();

    const validatedMessage = messageArraySchema.parse(reversedMessages);
    return validatedMessage;
  } catch (error) {
    notFound();
  }
}

const page = async ({ params }: pageProps) => {
  const { chatId } = params;
  const session = await getServerSession(authOptions);

  if (!session) {
    notFound();
  }

  const { user } = session;

  const [userId1, userid2] = chatId.split("--");

  //user is not part of the chat
  if (user.id !== userId1 && user.id !== userid2) {
    notFound();
  }

  const chatPartenerId = user.id === userId1 ? userid2 : userId1;

  const chatPartenerString = (await getRedisData(
    "get",
    `user:${chatPartenerId}`
  )) as string;
  const chatPartener = JSON.parse(chatPartenerString) as User;

  const initialMessages = await getChatMessages(chatId);

  return (
    <div className="flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]">
      <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
        <div className="relative flex items-center space-x-4">
          <div className="relative">
            <div className="relative w-8 h-8 sm:w-12 sm:h-12">
              <Image
                fill
                referrerPolicy="no-referrer"
                src={chatPartener.image}
                alt={`${chatPartener.name} profile picture`}
                className="rounded-full"
              />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <div className="text-xl flex items-center">
              <span className="text-gray-700 mr-3 font-semibold">
                {chatPartener.name}
              </span>
            </div>

            <span className="text-sm text-gray-600">{chatPartener.email}</span>
          </div>
        </div>
      </div>
      <Messages
        initalMessages={initialMessages}
        sessionId={session.user.id}
        chatPartner={chatPartener}
        sessionImg={session.user.image}
        chatId={chatId}
      />
      <ChatInput chatPartner={chatPartener} chatId={chatId} />
    </div>
  );
};

export default page;
