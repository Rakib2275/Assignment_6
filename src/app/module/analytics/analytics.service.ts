import { prisma } from "../../lib/prisma";
import {
  OutageStatus,
  OutageType,
  Priority,
} from "../../../generated/prisma/client";

const getOverview = async () => {
  const [
    totalUsers,
    totalCustomers,
    totalOperators,
    totalAdmins,
    totalAreas,
    totalSchedules,
    totalOutages,
    reportedOutages,
    verifiedOutages,
    assignedOutages,
    inProgressOutages,
    restoredOutages,
    closedOutages,
    totalPayments,
    successfulPayments,
  ] = await Promise.all([
    // Users
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

    // Areas
    prisma.area.count(),

    // Schedules
    prisma.loadSheddingSchedule.count(),

    // Outages
    prisma.outageReport.count(),

    prisma.outageReport.count({
      where: {
        status: OutageStatus.REPORTED,
      },
    }),

    prisma.outageReport.count({
      where: {
        status: OutageStatus.VERIFIED,
      },
    }),

    prisma.outageReport.count({
      where: {
        status: OutageStatus.ASSIGNED,
      },
    }),

    prisma.outageReport.count({
      where: {
        status: OutageStatus.IN_PROGRESS,
      },
    }),

    prisma.outageReport.count({
      where: {
        status: OutageStatus.RESTORED,
      },
    }),

    prisma.outageReport.count({
      where: {
        status: OutageStatus.CLOSED,
      },
    }),

    // Payments
    prisma.payment.count(),

    prisma.payment.count({
      where: {
        status: "SUCCESS",
      },
    }),
  ]);

  const successfulPaymentAmount =
    await prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
    });

  const outageByType = await prisma.outageReport.groupBy({
    by: ["type"],
    _count: {
      _all: true,
    },
  });

  const outageByPriority =
    await prisma.outageReport.groupBy({
      by: ["priority"],
      _count: {
        _all: true,
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
      reported: reportedOutages,
      verified: verifiedOutages,
      assigned: assignedOutages,
      inProgress: inProgressOutages,
      restored: restoredOutages,
      closed: closedOutages,
    },

    outageBreakdown: {
      byType: outageByType.map((item) => ({
        type: item.type,
        count: item._count._all,
      })),

      byPriority: outageByPriority.map((item) => ({
        priority: item.priority,
        count: item._count._all,
      })),
    },

    payments: {
      total: totalPayments,
      successful: successfulPayments,
      successfulAmount:
        Number(successfulPaymentAmount._sum.amount || 0),
    },
  };
};


const getOutageAnalytics = async (
  startDate?: string,
  endDate?: string
) => {
  const where: any = {};

  // Date filter
  if (startDate || endDate) {
    where.reportedAt = {};

    if (startDate) {
      where.reportedAt.gte = new Date(startDate);
    }

    if (endDate) {
      const end = new Date(endDate);

      // Include complete end date
      end.setHours(23, 59, 59, 999);

      where.reportedAt.lte = end;
    }
  }

  const [
    total,
    scheduled,
    unexpected,
    low,
    medium,
    high,
    critical,
    reported,
    verified,
    assigned,
    inProgress,
    restored,
    closed,
  ] = await Promise.all([
    prisma.outageReport.count({
      where,
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        type: OutageType.SCHEDULED,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        type: OutageType.UNEXPECTED,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        priority: Priority.LOW,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        priority: Priority.MEDIUM,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        priority: Priority.HIGH,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        priority: Priority.CRITICAL,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        status: OutageStatus.REPORTED,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        status: OutageStatus.VERIFIED,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        status: OutageStatus.ASSIGNED,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        status: OutageStatus.IN_PROGRESS,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        status: OutageStatus.RESTORED,
      },
    }),

    prisma.outageReport.count({
      where: {
        ...where,
        status: OutageStatus.CLOSED,
      },
    }),
  ]);

  // Area-wise outage count
  const areaWise = await prisma.outageReport.groupBy({
    by: ["areaId"],
    where,
    _count: {
      _all: true,
    },
  });

  const areaIds = areaWise.map(
    (item) => item.areaId
  );

  const areas = await prisma.area.findMany({
    where: {
      id: {
        in: areaIds,
      },
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  const areaMap = new Map(
    areas.map((area) => [area.id, area])
  );

  const outagesByArea = areaWise.map((item) => {
    const area = areaMap.get(item.areaId);

    return {
      areaId: item.areaId,
      areaName: area?.name || "Unknown",
      areaCode: area?.code || null,
      outageCount: item._count._all,
    };
  });

  return {
    filters: {
      startDate: startDate || null,
      endDate: endDate || null,
    },

    totalOutages: total,

    byType: {
      scheduled,
      unexpected,
    },

    byPriority: {
      low,
      medium,
      high,
      critical,
    },

    byStatus: {
      reported,
      verified,
      assigned,
      inProgress,
      restored,
      closed,
    },

    outagesByArea,
  };
};


export const AnalyticsService = {
  getOverview,
  getOutageAnalytics,
};