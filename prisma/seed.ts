import {
  GlobalRole,
  PrismaClient,
  UnitModuleType,
  UnitRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const clinic = await prisma.clinic.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Clínica Universitaria UNMSM',
    },
  });

  const fisioUnit = await prisma.unit.upsert({
    where: {
      clinicId_code: { clinicId: clinic.id, code: 'FISIO' },
    },
    update: {},
    create: {
      clinicId: clinic.id,
      code: 'FISIO',
      name: 'Fisioterapia y Rehabilitación',
      moduleType: UnitModuleType.REHABILITATION,
    },
  });

  await prisma.unitSetting.upsert({
    where: { unitId: fisioUnit.id },
    update: {},
    create: {
      unitId: fisioUnit.id,
      defaultPlannedSessions: 8,
    },
  });

  const catalogItems = ['Compresa', 'Masaje', 'Corrientes', 'Equipos'];
  for (let i = 0; i < catalogItems.length; i++) {
    const name = catalogItems[i];
    const existing = await prisma.treatmentCatalogItem.findFirst({
      where: { unitId: fisioUnit.id, name },
    });
    if (!existing) {
      await prisma.treatmentCatalogItem.create({
        data: { unitId: fisioUnit.id, name, sortOrder: i + 1 },
      });
    }
  }

  const users = [
    {
      username: 'admin',
      fullName: 'Administrador Sistema',
      globalRole: GlobalRole.ADMIN,
      assignments: [{ unitId: fisioUnit.id, role: UnitRole.SUPERVISOR }],
    },
    {
      username: 'fisio',
      fullName: 'Fisioterapeuta Demo',
      globalRole: GlobalRole.STAFF,
      assignments: [{ unitId: fisioUnit.id, role: UnitRole.THERAPIST }],
    },
    {
      username: 'jefatura',
      fullName: 'Jefatura Fisioterapia',
      globalRole: GlobalRole.STAFF,
      assignments: [{ unitId: fisioUnit.id, role: UnitRole.SUPERVISOR }],
    },
  ];

  for (const u of users) {
    const user = await prisma.staffUser.upsert({
      where: { username: u.username },
      update: { passwordHash, fullName: u.fullName, active: true },
      create: {
        clinicId: clinic.id,
        username: u.username,
        passwordHash,
        fullName: u.fullName,
        globalRole: u.globalRole,
      },
    });

    for (const a of u.assignments) {
      await prisma.staffUnitRole.upsert({
        where: { userId_unitId: { userId: user.id, unitId: a.unitId } },
        update: { role: a.role },
        create: { userId: user.id, unitId: a.unitId, role: a.role },
      });
    }
  }

  console.log('Seed completado.');
  console.log('Usuarios demo (contraseña: demo1234): admin, fisio, jefatura');
  console.log(`Unidad FISIO id: ${fisioUnit.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
