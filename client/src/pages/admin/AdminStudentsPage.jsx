import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2 } from "lucide-react"

import AdminManagerHeader from "./AdminManagerHeader"

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([
    {
      id: "s1",
      name: "Phạm Thị C",
      email: "c@email.com",
      phone: "0912345678",
      studentId: "SV001",
      lab: "Frontend Development",
      enrollmentDate: "2024-01-15",
      status: "active",
    },
    {
      id: "s2",
      name: "Lê Văn D",
      email: "d@email.com",
      phone: "0987654321",
      studentId: "SV002",
      lab: "Frontend Development",
      enrollmentDate: "2024-01-16",
      status: "active",
    },
    {
      id: "s3",
      name: "Hoàng Thị E",
      email: "e@email.com",
      phone: "0945123456",
      studentId: "SV003",
      lab: undefined,
      enrollmentDate: "2024-01-17",
      status: "active",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentId: "",
    lab: "",
  })

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddStudent = () => {
    setEditingStudent(null)
    setFormData({ name: "", email: "", phone: "", studentId: "", lab: "" })
    setShowForm(true)
  }

  const handleEditStudent = (student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      studentId: student.studentId,
      lab: student.lab || "",
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (editingStudent) {
      setStudents(
        students.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                studentId: formData.studentId,
                lab: formData.lab || undefined,
              }
            : s,
        ),
      )
    } else {
      const newStudent = {
        id: `s${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        studentId: formData.studentId,
        lab: formData.lab || undefined,
        enrollmentDate: new Date().toISOString().split("T")[0],
        status: "active",
      }
      setStudents([...students, newStudent])
    }

    setShowForm(false)
  }

  const handleDelete = (id) => {
    setStudents(students.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-6">
      <AdminManagerHeader
        searchPlaceholder="Tìm kiếm sinh viên..."
        searchValue={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        buttonLabel="Thêm Sinh Viên"
        onButtonClick={handleAddStudent}
        ButtonIcon={Plus}
      />

      {showForm && (
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {editingStudent ? "Sửa Sinh Viên" : "Thêm Sinh Viên Mới"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Họ Tên</label>
                <Input
                  placeholder="Nhập họ tên"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Mã Sinh Viên</label>
                <Input
                  placeholder="Nhập mã sinh viên"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Số Điện Thoại
                </label>
                <Input
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Chọn Lab</label>
                <select
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  value={formData.lab}
                  onChange={(e) => setFormData({ ...formData, lab: e.target.value })}
                >
                  <option value="">Chưa Gán Lab</option>
                  <option value="Frontend Development">Frontend Development</option>
                  <option value="Backend Development">Backend Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="gap-2">
                <Plus className="w-4 h-4" />
                {editingStudent ? "Cập Nhật" : "Thêm"}
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
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Họ Tên
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Mã SV
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Điện Thoại
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Lab
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground font-medium">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {student.studentId}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {student.phone}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {student.lab ? (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {student.lab}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Chưa Gán</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 bg-transparent"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit2 className="w-4 h-4" />
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive bg-transparent"
                        onClick={() => handleDelete(student.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            Không tìm thấy sinh viên nào
          </div>
        )}
      </Card>
    </div>
  )
}
