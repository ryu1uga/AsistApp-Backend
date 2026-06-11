import express, { Request, Response } from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import cors from "cors"
import OrganizationsController from "./controllers/OrganizationsController"
import UsersController from "./controllers/UsersController"
import SchedulesController from "./controllers/SchedulesController"
import ScheduleDaysController from "./controllers/ScheduleDaysController"
import ScheduleChangeRequestsController from "./controllers/ScheduleChangeRequestsController"
import AttendanceRecordsController from "./controllers/AttendanceRecordsController"
import AttendanceRequestsController from "./controllers/AttendanceRequestsController"
import ActivityLogsController from "./controllers/ActivityLogsController"

dotenv.config()
const PORT = process.env.PORT
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.get("/", (req: Request, resp: Response) => {
    resp.send("Endpoint raiz de Backend")
})

app.use("/organizations", OrganizationsController())
app.use("/users", UsersController())
app.use("/schedules", SchedulesController())
app.use("/schedule-days", ScheduleDaysController())
app.use("/schedule-change-requests", ScheduleChangeRequestsController())
app.use("/attendance-records", AttendanceRecordsController())
app.use("/attendance-requests", AttendanceRequestsController())
app.use("/activity-logs", ActivityLogsController())

app.listen(PORT, () => {
    console.log(`Se inicio servidor en http://localhost:${PORT}/`)
})