import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ClipboardList, Users, CheckCircle2, Clock } from "lucide-react";
import taskApi from "@/api/taskApi";

export default function MentorDashboard() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    activeTasks: 0,
    totalStudents: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const tasksResponse = await taskApi.getTasks({ page: 1, limit: 10 });
      const tasks = tasksResponse.data.tasks || [];
      
      const activeTasks = tasks.filter((t) => 
        t.status && ["Open", "To do", "In progress", "Reviewing"].includes(t.status)
      );
      const completedTasks = tasks.filter((t) => t.status === "Done");

      let totalStudents = 0;
      for (const task of tasks) {
        if (task.assignedStudentsCount) {
          totalStudents += task.assignedStudentsCount;
        }
      }

      setStats({
        totalTasks: tasks.length,
        activeTasks: activeTasks.length,
        totalStudents: totalStudents,
        completedTasks: completedTasks.length,
      });

      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Tổng Task",
      value: stats.totalTasks,
      icon: <ClipboardList className="w-6 h-6" />,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Task Đang Hoạt Động",
      value: stats.activeTasks,
      icon: <Clock className="w-6 h-6" />,
      color: "bg-yellow-500/10 text-yellow-600",
    },
    {
      label: "Task Đã Hoàn Thành",
      value: stats.completedTasks,
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Tổng Sinh Viên Đã Gán",
      value: stats.totalStudents,
      icon: <Users className="w-6 h-6" />,
      color: "bg-purple-500/10 text-purple-600",
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600";
      case "low":
        return "bg-green-500/10 text-green-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return "Cao";
      case "medium":
        return "Trung bình";
      case "low":
        return "Thấp";
      default:
        return priority;
    }
  };

  const getComplexityLabel = (complexity) => {
    switch (complexity) {
      case "easy":
        return "Dễ";
      case "medium":
        return "Trung bình";
      case "complex":
        return "Phức tạp";
      case "veryComplex":
        return "Rất phức tạp";
      default:
        return complexity || "Trung bình";
    }
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case "easy":
        return "bg-green-500/10 text-green-600";
      case "medium":
        return "bg-blue-500/10 text-blue-600";
      case "complex":
        return "bg-orange-500/10 text-orange-600";
      case "veryComplex":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-500/10 text-blue-600";
      case "To do":
        return "bg-gray-500/10 text-gray-600";
      case "In progress":
        return "bg-yellow-500/10 text-yellow-600";
      case "Reviewing":
        return "bg-purple-500/10 text-purple-600";
      case "Done":
        return "bg-emerald-500/10 text-emerald-600";
      case "Cancel":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Task Gần Đây
        </h2>
        {recentTasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Chưa có task nào
          </p>
        ) : (
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center justify-between pb-4 border-b border-border last:border-0"
              >
                <div className="flex-1">
                  <p className="text-foreground font-medium">
                    {task.taskTitle}
                  </p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="text-muted-foreground text-sm">
                      Bắt đầu: {formatDate(task.startDate)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      Hết hạn: {formatDate(task.dueDate)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getComplexityColor(
                        task.complexity || "medium"
                      )}`}
                    >
                      {getComplexityLabel(task.complexity || "medium")}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {task.assignedStudentsCount || 0} sinh viên
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${getStatusColor(
                    task.status || "Open"
                  )}`}
                >
                  {task.status || "Open"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

