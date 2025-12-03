import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2 } from "lucide-react"


export default function AdminMentorsPage() {
  const [mentors] = useState([
    {
      id: "1",
      name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      phone: "0123456789",
      department: "IT",
      labCount: 2,
    },
    {
      id: "2",
      name: "Trần Thị B",
      email: "tranthib@example.com",
      phone: "0987654321",
      department: "Business",
      labCount: 1,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)

  const filteredMentors = mentors.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: tạo mentor
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      {/* <AdminManagerHeader
        searchPlaceholder="Tìm kiếm mentor..."
        searchValue={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        buttonLabel={showForm ? "Ẩn Form" : "Thêm Mentor"}
        onButtonClick={() => setShowForm(!showForm)}
        ButtonIcon={Plus}
      /> */}

      {showForm && (
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-bold text-foreground mb-4">Tạo Tài Khoản Mentor</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Họ Tên</label>
                <Input placeholder="Nhập họ tên" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input type="email" placeholder="Nhập email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Số Điện Thoại</label>
                <Input placeholder="Nhập số điện thoại" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phòng Ban</label>
                <Input placeholder="Nhập phòng ban" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="gap-2">
                <Plus className="w-4 h-4" />
                Tạo Mentor
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-6 py-4 font-bold text-foreground">Họ Tên</th>
                <th className="text-left px-6 py-4 font-bold text-foreground">Email</th>
                <th className="text-left px-6 py-4 font-bold text-foreground">Số ĐT</th>
                <th className="text-left px-6 py-4 font-bold text-foreground">Phòng Ban</th>
                <th className="text-left px-6 py-4 font-bold text-foreground">Lab</th>
                <th className="text-center px-6 py-4 font-bold text-foreground">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMentors.map((mentor) => (
                <tr key={mentor.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-foreground font-medium">{mentor.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{mentor.email}</td>
                  <td className="px-6 py-4 text-muted-foreground">{mentor.phone}</td>
                  <td className="px-6 py-4 text-muted-foreground">{mentor.department}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {mentor.labCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredMentors.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Không tìm thấy mentor nào</p>
        </Card>
      )}
    </div>
  )
}
