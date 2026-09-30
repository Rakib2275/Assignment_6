import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createFeeder = async (payload: {
  name: string;
  code: string;
  substationId: string;
}) => {
  // Check substation exists
  const substation = await prisma.substation.findFirst({
    where: {
      id: payload.substationId,
    },
  });

  if (!substation) {
    throw new Error("Substation not found");
  }

  // Check duplicate feeder
  const existingFeeder = await prisma.feeder.findFirst({
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

  if (existingFeeder) {
    throw new Error("Feeder name or code already exists");
  }

  const feeder = await prisma.feeder.create({
    data: {
      name: payload.name,
      code: payload.code.toUpperCase(),
      substationId: payload.substationId,
    },
    include: {
      substation: {
        select: {
          id: true,
          name: true,
          code: true,
          zone: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });

  return feeder;
};

const getAllFeeders = async (query: {
  search?: string;
  substationId?: string;
}) => {
  const { search, substationId } = query;

  const where: Prisma.FeederWhereInput = {};

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

  if (substationId) {
    where.substationId = substationId;
  }

  const feeders = await prisma.feeder.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      substation: {
        select: {
          id: true,
          name: true,
          code: true,
          zone: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      _count: {
        select: {
          areas: true,
        },
      },
    },
  });

  return feeders;
};

export const FeederService = {
  createFeeder,
  getAllFeeders,
};