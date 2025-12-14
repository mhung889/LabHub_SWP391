import { Users, Briefcase, BookOpen, CheckCircle } from "lucide-react"
import { Card } from "../../components/ui/card"

export default function AdminOverviewPage() {
  const stats = [
    {
      label: "Tổng Mentor",
      value: 12,
      icon: <Users className="w-6 h-6" />,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Tổng Lab",
      value: 8,
      icon: <Briefcase className="w-6 h-6" />,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Tổng Sinh Viên",
      value: 156,
      icon: <BookOpen className="w-6 h-6" />,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      label: "Lab Hoạt Động",
      value: 7,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "bg-orange-500/10 text-orange-600",
    },
  ]

  const activities = [
    { action: "Tạo mentor mới", user: "Nguyễn Văn A", time: "2 giờ trước" },
    { action: "Thêm lab mới", user: "Trần Thị B", time: "4 giờ trước" },
    { action: "Gán mentor cho lab", user: "Lê Văn C", time: "1 ngày trước" },
  ]

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

      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Hoạt Động Gần Đây</h2>
        <div className="space-y-4">
          {activities.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between pb-4 border-b border-border last:border-0"
            >
              <div>
                <p className="text-foreground font-medium">{item.action}</p>
                <p className="text-muted-foreground text-sm">{item.user}</p>
              </div>
              <span className="text-muted-foreground text-sm">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
