import IOredis from "ioredis";
import chalk from "chalk";

export let redisClient = new IOredis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
})

redisClient.on("connect", () => {
    console.log(chalk.magenta.bgBlack("Redis client connected"))
})

redisClient.on("error", (err) => {
    console.log(chalk.red.bgBlack("Redis client error:"), err.message)
})