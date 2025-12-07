import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Mail, Phone, Calendar, MapPin, User } from "lucide-react";

export default function MentorDetailModal({ mentor, open, onClose }) {
  if (!mentor) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Chưa cập nhật";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Chi Tiết Mentor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {mentor.image ? (
                  <img
                    src={mentor.image}
                    alt={mentor.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {mentor.fullName}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{mentor.email}</span>
                  </div>
                  {mentor.phoneNumber && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{mentor.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    mentor.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {mentor.status === "active" ? "Hoạt động" : "Không hoạt động"}
                </span>
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">
              Thông Tin Cá Nhân
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Ngày Sinh</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-foreground">{formatDate(mentor.dateOfBirth)}</p>
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Giới Tính</label>
                <p className="text-foreground mt-1">
                  {mentor.gender === "male"
                    ? "Nam"
                    : mentor.gender === "female"
                    ? "Nữ"
                    : mentor.gender === "other"
                    ? "Khác"
                    : "Chưa cập nhật"}
                </p>
              </div>
              {mentor.address && (
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Địa Chỉ</label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <p className="text-foreground">{mentor.address}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Labs Section */}
          {mentor.labs && mentor.labs.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">
                Labs Phụ Trách ({mentor.labCount || mentor.labs.length})
              </h4>
              <div className="space-y-2">
                {mentor.labs.map((lab) => (
                  <div
                    key={lab._id || lab.id}
                    className="p-4 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{lab.name}</p>
                        {lab.code && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Mã: {lab.code}
                          </p>
                        )}
                        {lab.major && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Chuyên ngành: {lab.major}
                          </p>
                        )}
                      </div>
                    </div>
                    {lab.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {lab.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Emergency Contact */}
          {mentor.emergencyContact && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">
                Liên Hệ Khẩn Cấp
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mentor.emergencyContact.name && (
                  <div>
                    <label className="text-sm text-muted-foreground">Tên</label>
                    <p className="text-foreground mt-1">
                      {mentor.emergencyContact.name}
                    </p>
                  </div>
                )}
                {mentor.emergencyContact.relationship && (
                  <div>
                    <label className="text-sm text-muted-foreground">Mối Quan Hệ</label>
                    <p className="text-foreground mt-1">
                      {mentor.emergencyContact.relationship}
                    </p>
                  </div>
                )}
                {mentor.emergencyContact.phoneNumber && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted-foreground">Số Điện Thoại</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p className="text-foreground">
                        {mentor.emergencyContact.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Timestamps */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-muted-foreground">Ngày Tạo</label>
                <p className="text-foreground mt-1">
                  {formatDate(mentor.createdAt)}
                </p>
              </div>
              {mentor.updatedAt && (
                <div>
                  <label className="text-muted-foreground">Cập Nhật Lần Cuối</label>
                  <p className="text-foreground mt-1">
                    {formatDate(mentor.updatedAt)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

