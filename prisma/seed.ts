import bcrypt from "bcrypt";
import prisma from "../src/config/db";
import { AttendanceStatus, DayOfWeek, ScheduleStatus, UserRole, UserStatus } from "../src/generated/prisma/enums";

const SEED_PASSWORD = "asistapp";

// --- Seed de analíticas: usuarios, horarios y asistencias para una organización existente ---

const ANALYTICS_ORGANIZATION_ID = "362622e7-06ca-473c-9d98-c347c1a8eef3";

interface AnalyticsTraineeSeed {
    firstName: string;
    lastName: string;
    institutionalEmail: string;
    phoneNumber: string;
    career: string;
    cycle: number;
}

const ANALYTICS_TRAINEES: AnalyticsTraineeSeed[] = [
    { firstName: "Ana", lastName: "Torres", institutionalEmail: "ana.torres.seed@gmail.com", phoneNumber: "999222001", career: "Ingeniería de Sistemas", cycle: 9 },
    { firstName: "Diego", lastName: "Ramírez", institutionalEmail: "diego.ramirez.seed@gmail.com", phoneNumber: "999222002", career: "Ingeniería de Software", cycle: 8 },
    { firstName: "Sofía", lastName: "Mendoza", institutionalEmail: "sofia.mendoza.seed@gmail.com", phoneNumber: "999222003", career: "Ingeniería Industrial", cycle: 7 },
    { firstName: "Miguel", lastName: "Vargas", institutionalEmail: "miguel.vargas.seed@gmail.com", phoneNumber: "999222004", career: "Ciencias de la Computación", cycle: 10 },
    { firstName: "Valeria", lastName: "Rojas", institutionalEmail: "valeria.rojas.seed@gmail.com", phoneNumber: "999222005", career: "Ingeniería de Sistemas", cycle: 6 }
];

const SCHEDULE_CHECK_IN = { hours: 8, minutes: 0 };
const SCHEDULE_CHECK_OUT = { hours: 17, minutes: 0 };
const SCHEDULE_LUNCH_START = { hours: 13, minutes: 0 };
const SCHEDULE_LUNCH_END = { hours: 14, minutes: 0 };
const ATTENDANCE_DAYS_TO_SEED = 20; // ~4 semanas hábiles por practicante

// Igual que src/utils/formatters.ts:parseTime -> valores TIME anclados al epoch en UTC
const scheduleTime = (hours: number, minutes: number) => new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));

const atTime = (day: Date, hours: number, minutes: number) => {
    const date = new Date(day);
    date.setUTCHours(hours, minutes, 0, 0);
    return date;
};

const diffMinutes = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 60000);

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function lastBusinessDays(count: number): Date[] {
    const days: Date[] = [];
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    cursor.setUTCDate(cursor.getUTCDate() - 1); // no incluir el día de hoy

    while (days.length < count) {
        const dayOfWeek = cursor.getUTCDay(); // 0 = domingo, 6 = sábado
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days.push(new Date(cursor));
        }
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return days.reverse();
}

interface DayOutcome {
    kind: "puntual" | "tarde" | "olvido_marcar_salida" | "falta";
}

function pickOutcome(): DayOutcome {
    const roll = Math.random();

    if (roll < 0.60) return { kind: "puntual" };
    if (roll < 0.85) return { kind: "tarde" };
    if (roll < 0.93) return { kind: "olvido_marcar_salida" };
    return { kind: "falta" };
}

function buildAttendanceRecord(userId: string, organizationId: string, day: Date) {
    const outcome = pickOutcome();

    if (outcome.kind === "falta") {
        return {
            userId,
            organizationId,
            date: day,
            checkIn: null,
            lunchStart: null,
            lunchEnd: null,
            checkOut: null,
            autoCheckout: false,
            lateMinutes: null,
            totalMinutes: null,
            status: AttendanceStatus.absence
        };
    }

    const lateMinutes = outcome.kind === "puntual" ? Math.max(0, randomInt(-3, 4)) : randomInt(16, 45);
    const checkIn = atTime(day, SCHEDULE_CHECK_IN.hours, SCHEDULE_CHECK_IN.minutes + lateMinutes);
    const lunchStart = atTime(day, SCHEDULE_LUNCH_START.hours, SCHEDULE_LUNCH_START.minutes);
    const lunchEnd = atTime(day, SCHEDULE_LUNCH_END.hours, SCHEDULE_LUNCH_END.minutes);

    if (outcome.kind === "olvido_marcar_salida") {
        return {
            userId,
            organizationId,
            date: day,
            checkIn,
            lunchStart,
            lunchEnd,
            checkOut: null,
            autoCheckout: true,
            lateMinutes,
            totalMinutes: diffMinutes(checkIn, lunchStart) + diffMinutes(lunchEnd, atTime(day, SCHEDULE_CHECK_OUT.hours, SCHEDULE_CHECK_OUT.minutes)),
            status: AttendanceStatus.confirmed
        };
    }

    const checkOut = atTime(day, SCHEDULE_CHECK_OUT.hours, SCHEDULE_CHECK_OUT.minutes + randomInt(-5, 15));
    const totalMinutes = diffMinutes(checkIn, lunchStart) + diffMinutes(lunchEnd, checkOut);

    return {
        userId,
        organizationId,
        date: day,
        checkIn,
        lunchStart,
        lunchEnd,
        checkOut,
        autoCheckout: false,
        lateMinutes,
        totalMinutes,
        status: AttendanceStatus.confirmed
    };
}

async function seedAnalyticsOrganization() {
    const organization = await prisma.organization.upsert({
        where: { id: ANALYTICS_ORGANIZATION_ID },
        update: {},
        create: {
            id: ANALYTICS_ORGANIZATION_ID,
            name: "Organización de Analíticas",
            code: "ANALYTICS-SEED",
            description: "Organización de seed con datos de asistencia para poblar analíticas",
            lateTimeLimit: 15
        }
    });

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    const businessDays = lastBusinessDays(ATTENDANCE_DAYS_TO_SEED);

    for (const trainee of ANALYTICS_TRAINEES) {
        const user = await prisma.user.upsert({
            where: { institutionalEmail: trainee.institutionalEmail },
            update: {
                firstName: trainee.firstName,
                lastName: trainee.lastName,
                phoneNumber: trainee.phoneNumber,
                career: trainee.career,
                cycle: trainee.cycle,
                role: UserRole.trainee,
                organizationId: organization.id,
                status: UserStatus.active,
                passwordHash
            },
            create: {
                firstName: trainee.firstName,
                lastName: trainee.lastName,
                institutionalEmail: trainee.institutionalEmail,
                phoneNumber: trainee.phoneNumber,
                career: trainee.career,
                cycle: trainee.cycle,
                role: UserRole.trainee,
                organizationId: organization.id,
                status: UserStatus.active,
                passwordHash
            }
        });

        const existingSchedule = await prisma.schedule.findFirst({ where: { userId: user.id } });
        if (!existingSchedule) {
            await prisma.schedule.create({
                data: {
                    userId: user.id,
                    organizationId: organization.id,
                    weeklyHours: 40,
                    status: ScheduleStatus.approved,
                    days: {
                        create: ([DayOfWeek.monday, DayOfWeek.tuesday, DayOfWeek.wednesday, DayOfWeek.thursday, DayOfWeek.friday] as const).map((day) => ({
                            day,
                            checkInTime: scheduleTime(SCHEDULE_CHECK_IN.hours, SCHEDULE_CHECK_IN.minutes),
                            lunchStartTime: scheduleTime(SCHEDULE_LUNCH_START.hours, SCHEDULE_LUNCH_START.minutes),
                            lunchEndTime: scheduleTime(SCHEDULE_LUNCH_END.hours, SCHEDULE_LUNCH_END.minutes),
                            checkOutTime: scheduleTime(SCHEDULE_CHECK_OUT.hours, SCHEDULE_CHECK_OUT.minutes)
                        }))
                    }
                }
            });
        }

        const existingAttendanceCount = await prisma.attendanceRecord.count({ where: { userId: user.id } });
        if (existingAttendanceCount === 0) {
            await prisma.attendanceRecord.createMany({
                data: businessDays.map((day) => buildAttendanceRecord(user.id, organization.id, day))
            });
        }
    }

    console.log(`Seed de analíticas completado: organización ${organization.id}, ${ANALYTICS_TRAINEES.length} practicantes con horarios y ${ATTENDANCE_DAYS_TO_SEED} días de asistencia cada uno.`);
}

async function main() {
    await seedAnalyticsOrganization();
}

main()
    .catch((error) => {
        console.error("Error al ejecutar el seed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
