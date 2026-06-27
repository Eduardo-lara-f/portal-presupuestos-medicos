import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("aqui va la url de la base de datos en el .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const CORPORATION_CODE = "RED_CORDILLERA_SALUD";

const divisions = [
  {
    name: "Centro Médico Cordillera Norte",
    code: "CORDILLERA_NORTE",
    corporationCode: CORPORATION_CODE,
    brandPrimaryColor: "#0057B8",
    brandSecondaryColor: "#00A6A6",
    brandAccentColor: "#7AC943",
    brandLogoKey: "generic-cross-blue",
  },
  {
    name: "Centro Médico Cordillera Sur",
    code: "CORDILLERA_SUR",
    corporationCode: CORPORATION_CODE,
    brandPrimaryColor: "#003B71",
    brandSecondaryColor: "#29B6A8",
    brandAccentColor: "#8DC63F",
    brandLogoKey: "generic-shield-teal",
  },
  {
    name: "Clínica Santa Aurora",
    code: "SANTA_AURORA",
    corporationCode: null,
    brandPrimaryColor: "#C8102E",
    brandSecondaryColor: "#0067B1",
    brandAccentColor: "#FFB81C",
    brandLogoKey: "generic-heart-red",
  },
  {
    name: "Instituto Médico Los Robles",
    code: "LOS_ROBLES",
    corporationCode: null,
    brandPrimaryColor: "#005F56",
    brandSecondaryColor: "#00A3E0",
    brandAccentColor: "#A8C500",
    brandLogoKey: "generic-leaf-health",
  },
];

async function main() {
  console.log("Iniciando seed de corporaciones y divisiones...");

  const corporation = await prisma.corporation.upsert({
    where: { code: CORPORATION_CODE },
    update: {
      name: "Red Cordillera Salud",
      status: true,
      deletedAt: null,
    },
    create: {
      name: "Red Cordillera Salud",
      code: CORPORATION_CODE,
      status: true,
    },
  });

  for (const division of divisions) {
    const corporationId =
      division.corporationCode === CORPORATION_CODE ? corporation.id : null;

    await prisma.division.upsert({
      where: { code: division.code },
      update: {
        name: division.name,
        corporationId,
        status: true,
        brandPrimaryColor: division.brandPrimaryColor,
        brandSecondaryColor: division.brandSecondaryColor,
        brandAccentColor: division.brandAccentColor,
        brandLogoKey: division.brandLogoKey,
        deletedAt: null,
      },
      create: {
        name: division.name,
        code: division.code,
        corporationId,
        status: true,
        brandPrimaryColor: division.brandPrimaryColor,
        brandSecondaryColor: division.brandSecondaryColor,
        brandAccentColor: division.brandAccentColor,
        brandLogoKey: division.brandLogoKey,
      },
    });
  }

  console.log("Seed OK: corporacion y divisiones creadas/actualizadas.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });