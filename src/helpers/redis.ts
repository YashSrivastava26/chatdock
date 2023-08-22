const redsisRestUrl: string = process.env.UPSTASH_REDIS_REST_URL as string;
const redsisRestToken: string = process.env.UPSTASH_REDIS_REST_TOKEN as string;

type Command = 'zrange' | 'sismember' | 'get' | 'smembers'

export async function getRedisData(
  command: Command,
  ...args: (string | number)[]
) {
    const url = `${redsisRestUrl}/${command}/${args.join('/')}`;
    const dbRespose = await fetch(url,{
        headers: {
            authorization: `Bearer ${redsisRestToken}`,
        },
        cache: "no-store",
    });

    //checking if valid response
    if(!dbRespose.ok) {
        throw new Error(`Database error: ${dbRespose.statusText}`);
    }

    const data = await dbRespose.json();
    return data.result;
}