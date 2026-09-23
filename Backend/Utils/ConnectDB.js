import mongoose from "mongoose"
import chalk from "chalk"

export let DBConnection = () => {
    try{
        mongoose.connect(process.env.MONGO_URL, {
            DbName: process.env.DB_NAME
        })
        console.log(chalk.yellow.bgBlack(`DB connected successfully`))

    } catch(err){
        console.log(chalk.red.bgBlack(`Error in DB connection: ${chalk.yellow(err)}`))
    }
}