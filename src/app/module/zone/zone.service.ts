import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";


const createZone = async (payload: {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}) => {
  const existingZone = await prisma.distributionZone.findFirst({
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

  if (existingZone) {
    throw new Error("Zone name or code already exists");
  }

  const zone = await prisma.distributionZone.create({
    data: {
      name: payload.name,
      code: payload.code.toUpperCase(),
      description: payload.description,
      isActive: payload.isActive ?? true,
    },
  });

  return zone;
};

const getAllZones = async (query: {
  search?: string;
  isActive?: string;
}) => {
  const { search, isActive } = query;

  const where: Prisma.DistributionZoneWhereInput = {};

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
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const zones = await prisma.distributionZone.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          substations: true,
        },
      },
    },
  });

  return zones;
};

const getZoneById = async (id: string) => {
  const zone = await prisma.distributionZone.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          substations: true,
        },
      },
    },
  });

  if (!zone) {
    throw new Error("Zone not found");
  }

  return zone;
};

const updateZone = async (
  id: string,
  payload: {
    name?: string;
    code?: string;
    description?: string;
    isActive?: boolean;
  },
) => {
  const existingZone = await prisma.distributionZone.findUnique({
    where: {
      id,
    },
  });

  if (!existingZone) {
    throw new Error("Zone not found");
  }

  if (payload.name || payload.code) {
    const duplicateZone = await prisma.distributionZone.findFirst({
      where: {
        id: {
          not: id,
        },
        OR: [
          ...(payload.name
            ? [
                {
                  name: {
                    equals: payload.name,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),

          ...(payload.code
            ? [
                {
                  code: {
                    equals: payload.code,
                    mode: "insensitive" as const,
                  },
                },
              ]
            : []),
        ],
      },
    });

    if (duplicateZone) {
      throw new Error("Another zone already has this name or code");
    }
  }

  const zone = await prisma.distributionZone.update({
    where: {
      id,
    },
    data: {
      ...(payload.name && {
        name: payload.name,
      }),

      ...(payload.code && {
        code: payload.code.toUpperCase(),
      }),

      ...(payload.description !== undefined && {
        description: payload.description,
      }),

      ...(payload.isActive !== undefined && {
        isActive: payload.isActive,
      }),
    },
  });

  return zone;
};

export const ZoneService = {
  createZone,
  getAllZones,
  getZoneById,
  updateZone,
};