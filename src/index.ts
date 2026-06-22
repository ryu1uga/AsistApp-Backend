import express, { Request, Response } from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import cors from "cors"
import swaggerUi from "swagger-ui-express"
import swaggerSpec from "./config/swagger"
import OrganizationsController from "./controllers/OrganizationsController"
import UsersController from "./controllers/UsersController"
import SchedulesController from "./controllers/SchedulesController"
import ScheduleDaysController from "./controllers/ScheduleDaysController"
import ScheduleChangeRequestsController from "./controllers/ScheduleChangeRequestsController"
import AttendanceRecordsController from "./controllers/AttendanceRecordsController"
import AttendanceRequestsController from "./controllers/AttendanceRequestsController"
import ActivityLogsController from "./controllers/ActivityLogsController"
import { authenticate } from "./middlewares/authenticate"

dotenv.config()
const PORT = process.env.PORT
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Healthcheck del servicio
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: El servicio está funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get("/health", (req: Request, resp: Response) => {
    resp.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use("/organizations", authenticate, OrganizationsController())
app.use("/users", UsersController())
app.use("/schedules", authenticate, SchedulesController())
app.use("/schedule-days", authenticate, ScheduleDaysController())
app.use("/schedule-change-requests", authenticate, ScheduleChangeRequestsController())
app.use("/attendance-records", authenticate, AttendanceRecordsController())
app.use("/attendance-requests", authenticate, AttendanceRequestsController())
app.use("/activity-logs", authenticate, ActivityLogsController())

app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "AsistApp Backend - API Docs"
}))

app.listen(PORT, () => {
    console.log(`Se inicio servidor en http://localhost:${PORT}/`)
})
