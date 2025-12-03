import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2, Users, ChevronRight } from "lucide-react"


import AdminLabDetailModal from "./AdminLabDetailModal"

export default function AdminLabsPage() {
  const [labs] = useState([
    {
      id: "1",
      name: "Frontend Development",
      mentor: "Nguyễn Văn A",
      capacity: 30,
      enrolled: 25,
      status: "active",
      description: "Học tập phát triển web front-end",
      students: [
        { id: "s1", name: "Phạm Thị C", email: "c@email.com", status: "approved" },
        { id: "s2", name: "Lê Văn D", email: "d@email.com", status: "approved" },
        { id: "s3", name: "Hoàng Thị E", email: "e@email.com", status: "pending" },
      ],
    },
    {
      id: "2",
      name: "Backend Development",
      mentor: "Trần Thị B",
      capacity: 25,
      enrolled: 20,
      status: "active",
      description: "Học tập phát triển web back-end",
      students: [
        { id: "s4", name: "Vũ Văn F", email: "f@email.com", status: "approved" },
        { id: "s5", name: "Đặng Thị G", email: "g@email.com", status: "approved" },
      ],
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [selectedLab, setSelectedLab] = useState(null)

  const filteredLabs = labs.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.mentor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: xử lý tạo lab (call API + setLabs)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">

      {showForm && (
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-bold text-foreground mb-4">Tạo Lab Mới</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tên Lab</label>
                <Input placeholder="Nhập tên lab" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Chọn Mentor</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                  <option>Nguyễn Văn A</option>
                  <option>Trần Thị B</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sức Chứa</label>
                <Input type="number" placeholder="Nhập sức chứa" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Trạng Thái</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                  <option value="active">Hoạt Động</option>
                  <option value="inactive">Không Hoạt Động</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Mô Tả</label>
              <textarea
                placeholder="Nhập mô tả lab"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="gap-2">
                <Plus className="w-4 h-4" />
                Tạo Lab
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLabs.map((lab) => (
          <Card key={lab.id} className="p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">{lab.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{lab.mentor}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  lab.status === "active"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-red-500/10 text-red-600"
                }`}
              >
                {lab.status === "active" ? "Hoạt Động" : "Không Hoạt Động"}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{lab.description}</p>

            <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground font-medium">
                {lab.enrolled}/{lab.capacity} sinh viên
              </span>
            </div>

            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(lab.enrolled / lab.capacity) * 100}%` }}
              />
            </div>

            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2 bg-transparent"
                onClick={() => setSelectedLab(lab)}
              >
                <ChevronRight className="w-4 h-4" />
                Chi Tiết
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent">
                <Edit2 className="w-4 h-4" />
                Sửa
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2 text-destructive hover:text-destructive bg-transparent"
              >
                <Trash2 className="w-4 h-4" />
                Xóa
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredLabs.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Không tìm thấy lab nào</p>
        </Card>
      )}

      {selectedLab && (
        <AdminLabDetailModal lab={selectedLab} onClose={() => setSelectedLab(null)} />
      )}
    </div>
  )
}
