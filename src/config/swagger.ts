import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT || 8080;

// Render expone automáticamente la URL pública del servicio en RENDER_EXTERNAL_URL.
// Si existe, solo se muestra ese servidor; en caso contrario (entorno local), se usa localhost.
const servers = process.env.RENDER_EXTERNAL_URL
    ? [
          {
              url: process.env.RENDER_EXTERNAL_URL,
              description: "Servidor de producción (Render)",
          },
      ]
    : [
          {
              url: `http://localhost:${PORT}`,
              description: "Servidor local",
          },
      ];

const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "AsistApp Backend API",
            version: "1.0.0",
            description: "Documentación de la API REST de AsistApp",
        },
        servers,
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Ingresa el token JWT obtenido en /users/login",
                },
            },
            schemas: {
                Organization: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        code: { type: "string" },
                        photoUrl: { type: "string", nullable: true },
                        description: { type: "string", nullable: true },
                        lateTimeLimit: { type: "integer" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        institutionalEmail: { type: "string" },
                        phoneNumber: { type: "string" },
                        career: { type: "string", nullable: true },
                        cycle: { type: "integer", nullable: true },
                        organizationId: { type: "string", format: "uuid", nullable: true },
                        role: { type: "string", enum: ["admin", "trainee"] },
                        status: { type: "string", enum: ["pending", "active", "rejected"] },
                        deviceToken: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                Schedule: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        organizationId: { type: "string", format: "uuid" },
                        weeklyHours: { type: "integer" },
                        status: { type: "string", enum: ["pending", "approved", "rejected"] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                ScheduleDay: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        scheduleId: { type: "string", format: "uuid" },
                        day: { type: "string", enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] },
                        checkInTime: { type: "string", format: "time" },
                        lunchStartTime: { type: "string", format: "time", nullable: true },
                        lunchEndTime: { type: "string", format: "time", nullable: true },
                        checkOutTime: { type: "string", format: "time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                ScheduleChangeRequest: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        scheduleDayId: { type: "string", format: "uuid" },
                        newCheckInTime: { type: "string", format: "time", nullable: true },
                        newLunchStartTime: { type: "string", format: "time", nullable: true },
                        newLunchEndTime: { type: "string", format: "time", nullable: true },
                        newCheckOutTime: { type: "string", format: "time", nullable: true },
                        reason: { type: "string" },
                        status: { type: "string", enum: ["pending", "approved", "rejected"] },
                        reviewedById: { type: "string", format: "uuid", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                AttendanceRecord: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        organizationId: { type: "string", format: "uuid" },
                        date: { type: "string", format: "date" },
                        checkIn: { type: "string", format: "date-time", nullable: true },
                        lunchStart: { type: "string", format: "date-time", nullable: true },
                        lunchEnd: { type: "string", format: "date-time", nullable: true },
                        checkOut: { type: "string", format: "date-time", nullable: true },
                        autoCheckout: { type: "boolean" },
                        lateMinutes: { type: "integer", nullable: true },
                        totalMinutes: { type: "integer", nullable: true },
                        status: { type: "string", enum: ["pending", "confirmed", "absence"] },
                        validatedById: { type: "string", format: "uuid", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                AttendanceRequest: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        userId: { type: "string", format: "uuid" },
                        organizationId: { type: "string", format: "uuid" },
                        requestedDate: { type: "string", format: "date" },
                        reason: { type: "string" },
                        status: { type: "string", enum: ["pending", "approved", "rejected"] },
                        reviewedById: { type: "string", format: "uuid", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                ActivityLog: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        organizationId: { type: "string", format: "uuid" },
                        performedById: { type: "string", format: "uuid" },
                        affectedUserId: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        category: { type: "string", enum: ["attendance", "schedule", "members"] },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        error: { type: "string" },
                    },
                },
                CreateOrganizationDto: {
                    type: "object",
                    required: ["name", "code", "lateTimeLimit"],
                    properties: {
                        name: { type: "string" },
                        code: { type: "string" },
                        photoUrl: { type: "string", nullable: true },
                        description: { type: "string", nullable: true },
                        lateTimeLimit: { type: "integer" },
                    },
                },
                UpdateOrganizationDto: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        code: { type: "string" },
                        photoUrl: { type: "string", nullable: true },
                        description: { type: "string", nullable: true },
                        lateTimeLimit: { type: "integer" },
                    },
                },
                CreateUserDto: {
                    type: "object",
                    required: ["firstName", "lastName", "institutionalEmail", "phoneNumber", "role", "status", "password"],
                    properties: {
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        institutionalEmail: { type: "string" },
                        phoneNumber: { type: "string" },
                        career: { type: "string", nullable: true },
                        cycle: { type: "integer", nullable: true },
                        organizationId: { type: "string", format: "uuid", nullable: true },
                        role: { type: "string", enum: ["admin", "trainee"] },
                        status: { type: "string", enum: ["pending", "active", "rejected"] },
                        deviceToken: { type: "string", nullable: true },
                        password: { type: "string" },
                    },
                },
                UpdateUserDto: {
                    type: "object",
                    properties: {
                        firstName: { type: "string" },
                        lastName: { type: "string" },
                        institutionalEmail: { type: "string" },
                        phoneNumber: { type: "string" },
                        career: { type: "string", nullable: true },
                        cycle: { type: "integer", nullable: true },
                        organizationId: { type: "string", format: "uuid", nullable: true },
                        role: { type: "string", enum: ["admin", "trainee"] },
                        status: { type: "string", enum: ["pending", "active", "rejected"] },
                        deviceToken: { type: "string", nullable: true },
                        password: { type: "string" },
                    },
                },
                CreateScheduleDto: {
                    type: "object",
                    required: ["userId", "organizationId", "weeklyHours", "status"],
                    properties: {
                        userId: { type: "string", format: "uuid" },
                        organizationId: { type: "string", format: "uuid" },
                        weeklyHours: { type: "integer" },
                        status: { type: "string", enum: ["pending", "approved", "rejected"] },
                    },
                },
                UpdateScheduleDto: {
                    type: "object",
                    properties: {
                        userId: { type: "string", format: "uuid" },
                        organizationId: { type: "string", format: "uuid" },
                        weeklyHours: { type: "integer" },
                        status: { type: "string", enum: ["pending", "approved", "rejected"] },
                    },
                },
                CreateScheduleDayDto: {
                    type: "object",
                    required: ["scheduleId", "day", "checkInTime", "checkOutTime"],
                    properties: {
                        scheduleId: { type: "string", format: "uuid" },
                        day: { type: "string", enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] },
                        checkInTime: { type: "string", format: "time" },
                        lunchStartTime: { type: "string", format: "time", nullable: true },
                        lunchEndTime: { type: "string", format: "time", nullable: true },
                        checkOutTime: { type: "string", format: "time" },
                    },
                },
                UpdateScheduleDayDto: {
                    type: "object",
                    properties: {
                        scheduleId: { type: "string", format: "uuid" },
                        day: { type: "string", enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] },
                        checkInTime: { type: "string", format: "time" },
                        lunchStartTime: { type: "string", format: "time", nullable: true },
                        lunchEndTime: { type: "string", format: "time", nullable: true },
                        checkOutTime: { type: "string", format: "time" },
                    },
                },
                CreateScheduleChangeRequestDto: {
                    type: "object",
                    required: ["userId", "scheduleDayId", "reason"],
                    properties: {
                        userId: { type: "string", format: "uuid" },
                        scheduleDayId: { type: "string", format: "uuid" },
                        newCheckInTime: { type: "string", format: "time", nullable: true },
                        newLunchStartTime: { type: "string", format: "time", nullable: true },
                        newLunchEndTime: { type: "string", format: "time", nullable: true },
                        newCheckOutTime: { type: "string", format: "time", nullable: true },
                        reason: { type: "string" },
                    },
                },
                UpdateScheduleChangeRequestDto: {
                    type: "object",
                    properties: {
                        newCheckInTime: { type: "string", format: "time", nullable: true },
                        newLunchStartTime: { type: "string", format: "time", nullable: true },
                        newLunchEndTime: { type: "string", format: "time", nullable: true },
                        newCheckOutTime: { type: "string", format: "time", nullable: true },
                        reason: { type: "string" },
                        status: { type: "string", enum: ["pending", "approved", "rejected"] },
                        reviewedById: { type: "string", format: "uuid", nullable: true },
                    },
                },
                CreateAttendanceRecordDto: {
                    type: "object",
                    required: ["userId", "organizationId", "date", "autoCheckout"],
                    properties: {
                        userId: { type: "string", format: "uuid" },
                        organizationId: { type: "string", format: "uuid" },
                        date: { type: "string", format: "date" },
                        checkIn: { type: "string", format: "date-time", nullable: true },
                        lunchStart: { type: "string", format: "date-time", nullable: true },
                        lunchEnd: { type: "string", format: "date-time", nullable: true },
                        checkOut: { type: "string", format: "date-time", nullable: true },
                        autoCheckout: { type: "boolean" },
                        lateMinutes: { type: "integer", nullable: true },
                        totalMinutes: { type: "integer", nullable: true },
                    },
                },
                UpdateAttendanceRecordDto: {
                    type: "object",
                    properties: {
                        date: { type: "string", format: "date" },
                        checkIn: { type: "string", format: "date-time", nullable: true },
                        lunchStart: { type: "string", format: "date-time", nullable: true },
                        lunchEnd: { type: "string", format: "date-time", nullable: true },
                        checkOut: { type: "string", format: "date-time", nullable: true },
                        autoCheckout: { type: "boolean" },
                        lateMinutes: { type: "integer", nullable: true },
                        totalMinutes: { type: "integer", nullable: true },
                        status: { type: "string", enum: ["pending", "confirmed", "absence"] },
                        validatedById: { type: "string", format: "uuid", nullable: true },
                    },
                },
                CreateAttendanceRequestDto: {
                    type: "object",
                    required: ["userId", "organizationId", "requestedDate", "reason"],
                    properties: {
                        userId: { type: "string", format: "uuid" },
                        organizationId: { type: "string", format: "uuid" },
                        requestedDate: { type: "string", format: "date" },
                        reason: { type: "string" },
                    },
                },
                UpdateAttendanceRequestDto: {
                    type: "object",
                    properties: {
                        requestedDate: { type: "string", format: "date" },
                        reason: { type: "string" },
                        status: { type: "string", enum: ["pending", "approved", "rejected"] },
                        reviewedById: { type: "string", format: "uuid", nullable: true },
                    },
                },
                CreateActivityLogDto: {
                    type: "object",
                    required: ["organizationId", "performedById", "affectedUserId", "title", "category"],
                    properties: {
                        organizationId: { type: "string", format: "uuid" },
                        performedById: { type: "string", format: "uuid" },
                        affectedUserId: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        category: { type: "string", enum: ["attendance", "schedule", "members"] },
                    },
                },
                UpdateActivityLogDto: {
                    type: "object",
                    properties: {
                        organizationId: { type: "string", format: "uuid" },
                        performedById: { type: "string", format: "uuid" },
                        affectedUserId: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        category: { type: "string", enum: ["attendance", "schedule", "members"] },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ["./src/controllers/*.ts", "./dist/controllers/*.js"],
});

export default swaggerSpec;
