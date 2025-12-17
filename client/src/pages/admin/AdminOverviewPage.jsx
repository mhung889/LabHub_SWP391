import { useEffect, useMemo, useState } from "react";
import { Users, Briefcase, BookOpen, CheckCircle } from "lucide-react";
import { Card } from "../../components/ui/card";

import labApi from "@/api/labApi";
import mentorApi from "@/api/mentorApi";
import studentApi from "@/api/studentApi";

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statsData, setStatsData] = useState({
    totalMentors: 0,
    totalLabs: 0,
    totalStudents: 0,
    activeLabs: 0,
  });

  useEffect(() => {
    let mounted = true;

    const pickTotal = (resData, fallbackArrayKey) => {
      if (!resData) return 0;
      if (typeof resData.total === "number") return resData.total;
      if (typeof resData?.pagination?.total === "number") return resData.pagination.total;

      const arr = fallbackArrayKey ? resData?.[fallbackArrayKey] : null;
      if (Array.isArray(arr)) return arr.length;

      if (Array.isArray(resData)) return resData.length;

      return 0;
    };

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const mentorsPromise = mentorApi.getMentors({ page: 1, limit: 1 });
        const labsPromise = labApi.getAll({ page: 1, limit: 1 });
        const activeLabsPromise = labApi.getAll({ page: 1, limit: 1, status: "active" });
        const studentsPromise = studentApi.getAll();

        const [mentorsRes, labsRes, activeLabsRes, studentsRes] = await Promise.all([
          mentorsPromise,
          labsPromise,
          activeLabsPromise,
          studentsPromise,
        ]);

        if (!mounted) return;

        const mentorsTotal = pickTotal(mentorsRes?.data, "mentors");
        const labsTotal = pickTotal(labsRes?.data, "labs");
        const activeLabsTotal = pickTotal(activeLabsRes?.data, "labs");

        const studentsData = studentsRes?.data;
        const studentsTotal = Array.isArray(studentsData)
          ? studentsData.length
          : Array.isArray(studentsData?.students)
          ? studentsData.students.length
          : 0;

        setStatsData({
          totalMentors: mentorsTotal,
          totalLabs: labsTotal,
          totalStudents: studentsTotal,
          activeLabs: activeLabsTotal,
        });
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || "Không thể tải dữ liệu overview");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const s = statsData;
    return [
      {
        label: "Tổng Mentor",
        value: s.totalMentors,
        icon: <Users className="w-6 h-6" />,
        color: "bg-blue-500/10 text-blue-600",
      },
      {
        label: "Tổng Lab",
        value: s.totalLabs,
        icon: <Briefcase className="w-6 h-6" />,
        color: "bg-emerald-500/10 text-emerald-600",
      },
      {
        label: "Tổng Sinh Viên",
        value: s.totalStudents,
        icon: <BookOpen className="w-6 h-6" />,
        color: "bg-purple-500/10 text-purple-600",
      },
      {
        label: "Lab Hoạt Động",
        value: s.activeLabs,
        icon: <CheckCircle className="w-6 h-6" />,
        color: "bg-orange-500/10 text-orange-600",
      },
    ];
  }, [statsData]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
