import { prisma } from "../../lib/prisma";
import type { Role } from "../../../generated/prisma/enums";


// ========================================
// Get All Users
// ========================================

const getAllUsers = async (query: any) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(query.limit) || 10, 1),
    100
  );

  const skip = (page - 1) * limit;

  const search = query.search?.trim();
  const role = query.role as Role | undefined;

  const sortBy = query.sortBy || "createdAt";
  const sortOrder =
    query.sortOrder === "asc" ? "asc" : "desc";

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "email",
    "name",
  ];

  const safeSortBy = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const where: any = {};

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
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Role filter
  if (role) {
    where.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [safeSortBy]: sortOrder,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    data: users,

    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};


// ========================================
// Update User Role
// ========================================

const updateUserRole = async (
  adminId: string,
  userId: string,
  role: Role
) => {
  if (adminId === userId) {
    throw new Error(
      "You cannot change your own role."
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: "UPDATE_USER_ROLE",
      entity: "USER",
      userId: adminId,
    },
  });

  return updatedUser;
};


// ========================================
// Dashboard Statistics
// ========================================

const getDashboardStats = async () => {
  const [
    totalUsers,
    totalCustomers,
    totalOperators,
    totalAdmins,
    totalAreas,
    totalSchedules,
    totalOutages,
    activeOutages,
    completedOutages,
    totalPayments,
    successfulPayments,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.count({
      where: {
        role: "CUSTOMER",
      },
    }),

    prisma.user.count({
      where: {
        role: "OPERATOR",
      },
    }),

    prisma.user.count({
      where: {
        role: "ADMIN",
      },
    }),

    prisma.area.count(),

    prisma.loadSheddingSchedule.count(),

    prisma.outageReport.count(),

    prisma.outageReport.count({
      where: {
        status: {
          in: [
            "REPORTED",
            "VERIFIED",
            "ASSIGNED",
            "IN_PROGRESS",
          ],
        },
      },
    }),

    prisma.outageReport.count({
      where: {
        status: {
          in: ["RESTORED", "CLOSED"],
        },
      },
    }),

    prisma.payment.count(),

    prisma.payment.count({
      where: {
        status: "SUCCESS",
      },
    }),
  ]);

  const paymentAmount =
    await prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
    });

  return {
    users: {
      total: totalUsers,
      customers: totalCustomers,
      operators: totalOperators,
      admins: totalAdmins,
    },

    infrastructure: {
      areas: totalAreas,
      schedules: totalSchedules,
    },

    outages: {
      total: totalOutages,
      active: activeOutages,
      completed: completedOutages,
    },

    payments: {
      total: totalPayments,
      successful: successfulPayments,
      successfulAmount: Number(
        paymentAmount._sum.amount || 0
      ),
    },
  };
};


// ========================================
// Get Audit Logs
// ========================================

const getAuditLogs = async (query: any) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(query.limit) || 10, 1),
    100
  );

  const skip = (page - 1) * limit;

  const action = query.action?.trim();

  const where: any = {};

  if (action) {
    where.action = {
      contains: action,
      mode: "insensitive",
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),

    prisma.auditLog.count({
      where,
    }),
  ]);

  return {
    data: logs,

    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};


export const AdminService = {
  getAllUsers,
  updateUserRole,
  getDashboardStats,
  getAuditLogs,
};

