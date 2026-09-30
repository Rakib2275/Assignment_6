import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const parseDate = (value: string, field: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field}`);
  }

  return date;
};

const createSchedule = async (
  payload: {
    title: string;
    startTime: string;
    endTime: string;
    areaId: string;
  },
  userId: string
) => {
  // Check area
  const area = await prisma.area.findFirst({
    where: {
      id: payload.areaId,
    },
  });

  if (!area) {
    throw new Error("Area not found or inactive");
  }

  const startTime = parseDate(payload.startTime, "start time");
  const endTime = parseDate(payload.endTime, "end time");

  // Check time
  if (endTime <= startTime) {
    throw new Error("End time must be after start time");
  }

  // Check overlapping schedule
  const overlappingSchedule =
    await prisma.loadSheddingSchedule.findFirst({
      where: {
        areaId: payload.areaId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

  if (overlappingSchedule) {
    throw new Error(
      "Another schedule already exists for this area during this time"
    );
  }

  const schedule =
    await prisma.loadSheddingSchedule.create({
      data: {
        title: payload.title,
        startTime,
        endTime,
        areaId: payload.areaId,
        createdById: userId,
      },

      include: {
        area: {
          select: {
            id: true,
            name: true,
            code: true,

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
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  return schedule;
};

const getAllSchedules = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  areaId?: string;
  date?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const {
    page = "1",
    limit = "10",
    search,
    areaId,
    date,
    sortBy = "startTime",
    sortOrder = "desc",
  } = query;

  const pageNumber = Math.max(Number(page) || 1, 1);

  const limitNumber = Math.min(
    Math.max(Number(limit) || 10, 1),
    100
  );

  const skip = (pageNumber - 1) * limitNumber;

  const where: Prisma.LoadSheddingScheduleWhereInput = {};

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (areaId) {
    where.areaId = areaId;
  }

  if (date) {
    const selectedDate = new Date(date);

    if (Number.isNaN(selectedDate.getTime())) {
      throw new Error("Invalid schedule date");
    }

    const startOfDay = new Date(selectedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    where.startTime = { lt: endOfDay };
    where.endTime = { gt: startOfDay };
  }

  const allowedSortFields = [
    "startTime",
    "endTime",
    "createdAt",
    "updatedAt",
    "title",
  ];

  const finalSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "startTime";

  const finalSortOrder =
    sortOrder === "asc" ? "asc" : "desc";

  const orderBy = {
    [finalSortBy]: finalSortOrder,
  } as Prisma.LoadSheddingScheduleOrderByWithRelationInput;

  const [schedules, total] = await Promise.all([
    prisma.loadSheddingSchedule.findMany({
      where,
      skip,
      take: limitNumber,
      orderBy,

      include: {
        area: {
          select: {
            id: true,
            name: true,
            code: true,

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
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),

    prisma.loadSheddingSchedule.count({
      where,
    }),
  ]);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },

    data: schedules,
  };
};

const getScheduleById = async (id: string) => {
  const schedule =
    await prisma.loadSheddingSchedule.findFirst({
      where: {
        id,
      },

      include: {
        area: {
          select: {
            id: true,
            name: true,
            code: true,

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
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  return schedule;
};

const updateSchedule = async (
  id: string,
  payload: {
    title?: string;
    startTime?: string;
    endTime?: string;
    areaId?: string;
  }
) => {
  const existingSchedule =
    await prisma.loadSheddingSchedule.findFirst({
      where: {
        id,
      },
    });

  if (!existingSchedule) {
    throw new Error("Schedule not found");
  }

  const startTime = payload.startTime
    ? parseDate(payload.startTime, "start time")
    : existingSchedule.startTime;

  const endTime = payload.endTime
    ? parseDate(payload.endTime, "end time")
    : existingSchedule.endTime;

  if (endTime <= startTime) {
    throw new Error("End time must be after start time");
  }

  if (payload.areaId) {
    const area = await prisma.area.findFirst({
      where: {
        id: payload.areaId,
      },
    });

    if (!area) {
      throw new Error("Area not found or inactive");
    }
  }

  const areaId = payload.areaId ?? existingSchedule.areaId;
  const overlappingSchedule =
    await prisma.loadSheddingSchedule.findFirst({
      where: {
        id: { not: id },
        areaId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

  if (overlappingSchedule) {
    throw new Error(
      "Another schedule already exists for this area during this time"
    );
  }

  const updatedSchedule =
    await prisma.loadSheddingSchedule.update({
      where: {
        id,
      },

      data: {
        title: payload.title,
        startTime,
        endTime,
        areaId,
      },

      include: {
        area: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

  return updatedSchedule;
};

const deleteSchedule = async (id: string) => {
  const schedule =
    await prisma.loadSheddingSchedule.findFirst({
      where: {
        id,
      },
    });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const deletedSchedule =
    await prisma.loadSheddingSchedule.delete({
      where: { id },
    });

  return deletedSchedule;
};

const generateSchedule = async (
  payload: {
    areaId: string;
    startTime: string;
    endTime: string;
    durationMinutes?: number;
    title?: string;
  },
  userId: string
) => {
  const area = await prisma.area.findFirst({
    where: {
      id: payload.areaId,
    },
  });

  if (!area) {
    throw new Error("Area not found or inactive");
  }

  const startTime = parseDate(payload.startTime, "start time");
  let endTime = parseDate(payload.endTime, "end time");

  // If duration is provided, calculate end time
  if (payload.durationMinutes) {
    endTime = new Date(
      startTime.getTime() +
        payload.durationMinutes * 60 * 1000
    );
  }

  if (endTime <= startTime) {
    throw new Error("End time must be after start time");
  }

  const existingSchedule =
    await prisma.loadSheddingSchedule.findFirst({
      where: {
        areaId: payload.areaId,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

  if (existingSchedule) {
    throw new Error(
      "Another schedule already exists during this time"
    );
  }

  const schedule =
    await prisma.loadSheddingSchedule.create({
      data: {
        title:
          payload.title ||
          `Load Shedding - ${area.name}`,

        startTime,
        endTime,

        areaId: payload.areaId,

        createdById: userId,
      },

      include: {
        area: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

  return schedule;
};

export const ScheduleService = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  generateSchedule,
};