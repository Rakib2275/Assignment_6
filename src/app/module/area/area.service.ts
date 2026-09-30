import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createArea = async (payload: {
  name: string;
  code: string;
  feederId: string;
}) => {
  // Check feeder exists
  const feeder = await prisma.feeder.findFirst({
    where: {
      id: payload.feederId,
    },
  });

  if (!feeder) {
    throw new Error("Feeder not found");
  }

  // Check duplicate area
  const existingArea = await prisma.area.findFirst({
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

  if (existingArea) {
    throw new Error("Area name or code already exists");
  }

  const area = await prisma.area.create({
    data: {
      name: payload.name,
      code: payload.code.toUpperCase(),
      feederId: payload.feederId,
    },
    include: {
      feeder: {
        select: {
          id: true,
          name: true,
          code: true,

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
      },
    },
  });

  return area;
};

const getAllAreas = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  feederId?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const {
    page = "1",
    limit = "10",
    search,
    feederId,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(
    Math.max(Number(limit) || 10, 1),
    100
  );

  const skip = (pageNumber - 1) * limitNumber;

  const where: Prisma.AreaWhereInput = {};

  // Search
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

  // Feeder filter
  if (feederId) {
    where.feederId = feederId;
  }

  // Allowed sorting fields
  const allowedSortFields = ["name", "code", "createdAt", "updatedAt"];

  const finalSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const finalSortOrder =
    sortOrder === "asc" ? "asc" : "desc";

  const orderBy = {
    [finalSortBy]: finalSortOrder,
  } as Prisma.AreaOrderByWithRelationInput;

  const [areas, total] = await Promise.all([
    prisma.area.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy,
      include: {
        feeder: {
          select: {
            id: true,
            name: true,
            code: true,

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
        },
      },
    }),

    prisma.area.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limitNumber);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages,
    },
    data: areas,
  };
};

export const AreaService = {
  createArea,
  getAllAreas,
};