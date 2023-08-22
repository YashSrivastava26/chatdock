import { getRedisData } from "./redis";

export const getFriendsByUserId = async (userId: string) => {
  //get all friends of user
  const friendsIds = (await getRedisData(
    "smembers",
    `user:${userId}:friends`
  )) as string[];

  const friends = await Promise.all(
    friendsIds.map(async (friendId) => {
      const friendString = (await getRedisData(
        "get",
        `user:${friendId}`
      )) as string;
      const friend = JSON.parse(friendString) as User;

      return friend;
    })
  );
  return friends;
};
