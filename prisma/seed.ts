import "dotenv/config";
import { PrismaClient, LoadStatus, MovementType, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const examples = [
  ["1375900118", "ENVUELTAS F2 155MM", "2601182", 436, "WC071", "WC091", "160361"],
  ["1376800038", "POLV.B7M67 PARA M67FC", "FAG26D001-008", 900, "C383", "F217", "160371"],
  ["1375900142", "CUERPO MECANIZADO 155MM", "L2601A", 120, "A101", "WC091", "160361"],
  ["1376100455", "CONJUNTO EMBALAJE F2", "E2607", 75, "B205", "F217", "160402"],
  ["1377000100", "TAPA PROTECTORA", "TP-19", 320, "WC071", "C383", "160371"],
];

async function upsertUser(username: string, data: { name: string; email: string; password: string; role: Role }) {
  return prisma.user.upsert({
    where: { username },
    update: {
      name: data.name,
      email: data.email,
      role: data.role,
      active: true,
      passwordHash: await bcrypt.hash(data.password, 12),
    },
    create: {
      username,
      name: data.name,
      email: data.email,
      role: data.role,
      active: true,
      passwordHash: await bcrypt.hash(data.password, 12),
    },
  });
}

async function main() {
  const admin = await upsertUser("admin", {
    name: "Administrador",
    email: "admin@example.local",
    password: "Admin1234!",
    role: Role.ADMINISTRADOR,
  });
  await upsertUser("pablo", {
    name: "Pablo",
    email: "pablo@example.local",
    password: "Pablo1234!",
    role: Role.ADMINISTRATIVO,
  });
  await upsertUser("consulta", {
    name: "Consulta",
    email: "consulta@example.local",
    password: "Consulta1234!",
    role: Role.LECTURA,
  });

  await prisma.appSetting.upsert({ where: { id: "global" }, create: {}, update: {} });

  const existing = await prisma.carga.count();
  if (existing === 0) {
    for (let index = 0; index < 30; index += 1) {
      const base = examples[index % examples.length];
      const cantidadPrevista = Number(base[3]) + (index % 4) * 10;
      const cantidadRealizada = index % 3 === 0 ? cantidadPrevista : index % 3 === 1 ? Math.floor(cantidadPrevista / 2) : 0;
      const estado = cantidadRealizada === cantidadPrevista
        ? LoadStatus.REALIZADA
        : cantidadRealizada > 0
          ? LoadStatus.PARCIAL
          : [LoadStatus.PENDIENTE, LoadStatus.INCIDENCIA, LoadStatus.PENDIENTE_CALIDAD, LoadStatus.FALTA_STOCK][index % 4];
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - (index % 10));

      await prisma.carga.create({
        data: {
          fecha,
          tipoMovimiento: [MovementType.CARGA_OF, MovementType.TRASIEGO, MovementType.MOVIMIENTO_STOCK, MovementType.DEVOLUCION][index % 4],
          nbiEntrega: `NE-${2026000 + index}`,
          nbiRecepcion: `NR-${2026000 + index}`,
          codigoArticulo: String(base[0]),
          descripcionArticulo: String(base[1]),
          lote: String(base[2]),
          cantidadPrevista,
          cantidadRealizada,
          ubicacionOrigen: String(base[4]),
          ubicacionDestino: String(base[5]),
          ordenFabricacion: String(base[6]),
          comentario: index % 5 === 0 ? "Carga prioritaria de ejemplo" : null,
          estado,
          createdById: admin.id,
        },
      });
    }
  }

  console.log("Seed completado. Credenciales de desarrollo: admin/Admin1234!, pablo/Pablo1234!, consulta/Consulta1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
