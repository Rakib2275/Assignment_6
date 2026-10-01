import {
  OutageStatus,
  OutageType,
  Priority,
  Prisma,
  Role,
} from "../../../generated/prisma/client";

import { prisma } from "../../lib/prisma";

const createOutage = async (
  payload: {
    title: string;
    description?: string;
    type?: OutageType;
    priority?: Priority;
    areaId: string;
  },
  userId: string
) => {
  // Check area
  const area = await prisma.area.findFirst({
    where: {
      id: payload.areaId
    },
  });

  if (!area) {
    throw new Error("Area not found or inactive");
  }

  const outage: any = await prisma.outageReport.create({
    data: {
      title: payload.title,
      description: payload.description,
      type: payload.type ?? OutageType.UNEXPECTED,
      priority: payload.priority ?? Priority.MEDIUM,
      areaId: payload.areaId,
      reportedById: userId,
      status: OutageStatus.REPORTED,
    } as any,

    include: {
      area: {
        include: {
          feeder: {
            include: {
              substation: {
                include: {
                  zone: true,
                },
              },
            },
          },
        },
      },

      reportedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return outage;
};

const getAllOutages = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  areaId?: string;
  status?: string;
  priority?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 10, 1),
    100
  );

  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
  };

  // Search
  if (query.search) {
    where.OR = [
      {
        title: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Area filter
  if (query.areaId) {
    where.areaId = query.areaId;
  }

  // Status filter
  if (query.status) {
    where.status = query.status as OutageStatus;
  }

  // Priority filter
  if (query.priority) {
    where.priority = query.priority as Priority;
  }

  // Type filter
  if (query.type) {
    where.type = query.type as OutageType;
  }

  const allowedSortFields = [
    "createdAt",
    "reportedAt",
    "priority",
    "status",
    "title",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? (query.sortBy as
        | "createdAt"
        | "reportedAt"
        | "priority"
        | "status"
        | "title")
    : "createdAt";

  const sortOrder =
    query.sortOrder === "asc" ? "asc" : "desc";

  const [outages, total] = await Promise.all([
    prisma.outageReport.findMany({
      where,
      skip,
      take: limit,

      orderBy: {
        [sortBy]: sortOrder,
      },

      include: {
        area: {
          include: {
            feeder: {
              include: {
                substation: {
                  include: {
                    zone: true,
                  },
                },
              },
            },
          },
        },

        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        assignments: {
          where: {
            unassignedAt: null,
          } as any,

          include: {
            technician: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    }),

    prisma.outageReport.count({
      where,
    }),
  ]);

  return {
    data: outages,

    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getMyReports = async (userId: string) => {
  const outages = await prisma.outageReport.findMany({
    where: {
      reportedById: userId,
      deletedAt: null,
    } as any,

    orderBy: {
      createdAt: "desc",
    },

    include: {
      area: {
        include: {
          feeder: {
            include: {
              substation: {
                include: {
                  zone: true,
                },
              },
            },
          },
        },
      },

      assignments: {
        where: {
          unassignedAt: null,
        } as any,

        include: {
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  return outages;
};

const getOutageById = async (
  outageId: string,
  userId: string,
  userRole: Role
) => {
  const outage: any = await prisma.outageReport.findFirst({
    where: {
      id: outageId,
      deletedAt: null,
    } as any,

    include: {
      area: {
        include: {
          feeder: {
            include: {
              substation: {
                include: {
                  zone: true,
                },
              },
            },
          },
        },
      },

      reportedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      assignments: {
        include: {
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        } as any,
      },
    },
  });

  if (!outage) {
    throw new Error("Outage not found");
  }

  // Customer can only see own report
  if (
    userRole === Role.CUSTOMER &&
    outage.reportedById !== userId
  ) {
    throw new Error(
      "You don't have permission to access this outage"
    );
  }

  return outage;
};

const verifyOutage = async (
  outageId: string,
  payload: {
    priority?: Priority;
    description?: string;
  }
) => {
  const outage: any = await prisma.outageReport.findFirst({
    where: {
      id: outageId
    } as any,
  });

  if (!outage) {
    throw new Error("Outage not found");
  }

  if (outage.status !== OutageStatus.REPORTED) {
    throw new Error(
      `Outage cannot be verified from ${outage.status} status`
    );
  }

  const updatedOutage: any = await prisma.outageReport.update({
    where: {
      id: outageId,
    },

    data: {
      status: OutageStatus.VERIFIED,
      verifiedAt: new Date(),

      ...(payload.priority !== undefined && {
        priority: payload.priority,
      }),

      ...(payload.description !== undefined && {
        description: payload.description,
      }),
    } as any,

    include: {
      area: true,

      reportedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedOutage;
};

const updateOutageStatus = async (
  outageId: string,
  newStatus: OutageStatus
) => {
  const outage: any = await prisma.outageReport.findFirst({
    where: {
      id: outageId,
      deletedAt: null,
    } as any,
  });

  if (!outage) {
    throw new Error("Outage not found");
  }

  const currentStatus = outage.status as OutageStatus;

  const allowedTransitions: Record<string, OutageStatus[]> = {
    REPORTED: [OutageStatus.VERIFIED],
    VERIFIED: [OutageStatus.ASSIGNED],
    ASSIGNED: [OutageStatus.IN_PROGRESS],
    IN_PROGRESS: [OutageStatus.RESTORED],
    RESTORED: [OutageStatus.CLOSED],
    CLOSED: [],
    CANCELLED: [],
  };

  if (
    !allowedTransitions[currentStatus]?.includes(newStatus)
  ) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}`
    );
  }

  const data: any = {
    status: newStatus,
  };

  if (newStatus === OutageStatus.VERIFIED) {
    data.verifiedAt = new Date();
  }

  if (newStatus === OutageStatus.IN_PROGRESS) {
    data.startedAt = new Date();
  }

  if (newStatus === OutageStatus.RESTORED) {
    data.restoredAt = new Date();
  }

  if (newStatus === OutageStatus.CLOSED) {
    data.closedAt = new Date();
  }

  const updatedOutage: any = await prisma.outageReport.update({
    where: {
      id: outageId,
    },

    data,

    include: {
      area: true,

      assignments: {
        where: {
          unassignedAt: null,
        } as any,

        include: {
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  return updatedOutage;
};

const assignOutage = async (
  outageId: string,
  technicianId: string
) => {
  const outage: any = await prisma.outageReport.findFirst({
    where: {
      id: outageId
    } as any,
  });

  if (!outage) {
    throw new Error("Outage not found");
  }

  if (
    outage.status !== OutageStatus.VERIFIED
  ) {
    throw new Error(
      "Only VERIFIED outages can be assigned"
    );
  }

  // Check operator
  const technician = await prisma.user.findFirst({
    where: {
      id: technicianId
    },
  });

  if (!technician) {
    throw new Error("Operator not found");
  }

  if (technician.role !== Role.OPERATOR) {
    throw new Error(
      "Only an OPERATOR can be assigned to an outage"
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      // Remove existing active assignment
      await (tx.technicianAssignment.updateMany as any)({
        where: {
          outageId,
          unassignedAt: null,
        } as any,

        data: {
          unassignedAt: new Date(),
        } as any,
      });

      const assignment =
        await tx.technicianAssignment.create({
          data: {
            outageId,
            technicianId,
          },

          include: {
            technician: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        });

      const updatedOutage =
        await tx.outageReport.update({
          where: {
            id: outageId,
          },

          data: {
            status: OutageStatus.ASSIGNED,
            assignedAt: new Date(),
          },

          include: {
            area: true,
          },
        });

      return {
        outage: updatedOutage,
        assignment,
      };
    }
  );

  return result;
};

export const OutageService = {
  createOutage,
  getAllOutages,
  getMyReports,
  getOutageById,
  verifyOutage,
  updateOutageStatus,
  assignOutage,
};