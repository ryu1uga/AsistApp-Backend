import bcrypt from "bcrypt";
import prisma from "../src/config/db";
import { UserRole, UserStatus } from "../src/generated/prisma/enums";

const SEED_PASSWORD = "asistapp";

async function main() {
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

    const organization = await prisma.organization.upsert({
        where: { code: "ITLAB-1234" },
        update: {
            name: "ITLAB",
            description: "Organización de datos iniciales para desarrollo",
            lateTimeLimit: 15
        },
        create: {
            name: "ITLAB",
            code: "ITLAB-1234",
            description: "Organización de datos iniciales para desarrollo",
            lateTimeLimit: 15
        }
    });

    const users = [
        {
            firstName: "Esteban",
            lastName: "Terrones",
            institutionalEmail: "admin@gmail.com",
            phoneNumber: "999111222",
            role: UserRole.admin,
            career: undefined,
            cycle: undefined
        },
        {
            firstName: "Bruno",
            lastName: "Gutierrez",
            institutionalEmail: "practicante@gmail.com",
            phoneNumber: "999111223",
            role: UserRole.trainee,
            career: "Ingeniería de Sistemas",
            cycle: 8
        },
        {
            firstName: "Carla",
            lastName: "Escobedo",
            institutionalEmail: "practicante2@gmail.com",
            phoneNumber: "999111224",
            role: UserRole.trainee,
            career: "Ingeniería de Software",
            cycle: 7
        }
    ];

    await Promise.all(users.map((user) => prisma.user.upsert({
        where: { institutionalEmail: user.institutionalEmail },
        update: {
            ...user,
            organizationId: organization.id,
            status: UserStatus.active,
            passwordHash
        },
        create: {
            ...user,
            organizationId: organization.id,
            status: UserStatus.active,
            passwordHash
        }
    })));

    console.log("Seed completado: 1 organización, 1 administrador y 2 practicantes.");
    console.log(`Contraseña de desarrollo: ${SEED_PASSWORD}`);
}

main()
    .catch((error) => {
        console.error("Error al ejecutar el seed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
