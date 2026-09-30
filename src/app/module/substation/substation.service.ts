import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createSubstation = async (payload: {
  name: string;
  code: string;
  zoneId: string;
}) => {
  // Check zone exists
  const zone = await prisma.distributionZone.findFirst({
    where: {
      id: payload.zoneId,
    },
  });

  if (!zone) {
    throw new Error("Distribution zone not found");
  }

  // Check duplicate substation
  const existingSubstation = await prisma.substation.findFirst({
    where: {
      OR: [
        {
          name: {
            equals: payload.name,
            mode: "insensitive",
          },
        },
        {
          code: {
            equals: payload.code,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (existingSubstation) {
    throw new Error("Substation name or code already exists");
  }

  const substation = await prisma.substation.create({
    data: {
      name: payload.name,
      code: payload.code.toUpperCase(),
      zoneId: payload.zoneId,
    },
    include: {
      zone: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  return substation;
};

const getAllSubstations = async (query: {
  search?: string;
  zoneId?: string;
}) => {
  const { search, zoneId } = query;

  const where: Prisma.SubstationWhereInput = {};

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        code: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (zoneId) {
    where.zoneId = zoneId;
  }

  const substations = await prisma.substation.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      zone: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      _count: {
        select: {
          feeders: true,
        },
      },
    },
  });

  return substations;
};

export const SubstationService = {
  createSubstation,
  getAllSubstations,
};