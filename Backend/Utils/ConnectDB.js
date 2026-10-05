import mongoose from "mongoose"
import chalk from "chalk"
import { workspaceMemberShip, workspaceModel } from "../Models/workspace.model.js"

export let DBConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            dbName: process.env.DB_NAME
        })
        console.log(chalk.yellow.bgBlack(`DB connected successfully`))

        // Drop obsolete indexes if they still exist (safe to run on every start)
        try { await workspaceModel.collection.dropIndex("workspaceOwner_1_name_1") } catch (_) {}
        try { await workspaceMemberShip.collection.dropIndex("user_1_workspaceModel_1") } catch (_) {}
        
    } catch(err) {
        console.log(chalk.red.bgBlack(`Error in DB connection: ${chalk.yellow(err)}`))
    }
}