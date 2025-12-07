// import { Card } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { X, CheckCircle, XCircle, Clock } from "lucide-react"

// export default function AdminLabDetailModal({ lab, onClose }) {
//   const statusConfig = {
//     pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10", label: "Chờ Duyệt" },
//     approved: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10", label: "Duyệt" },
//     rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", label: "Từ Chối" },
//   }

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//       <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
//           <div>
//             <h2 className="text-2xl font-bold text-foreground">{lab.name}</h2>
//             <p className="text-sm text-muted-foreground mt-1">Mentor: {lab.mentor}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-muted rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5 text-foreground" />
//           </button>
//         </div>

//         <div className="p-6 space-y-6">
//           <div>
//             <h3 className="text-lg font-semibold text-foreground mb-2">Mô Tả</h3>
//             <p className="text-muted-foreground">{lab.description}</p>
//           </div>

//           <div>
//             <h3 className="text-lg font-semibold text-foreground mb-3">Thông Tin Sức Chứa</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="p-4 bg-muted/50 rounded-lg">
//                 <p className="text-sm text-muted-foreground mb-1">Sức Chứa</p>
//                 <p className="text-2xl font-bold text-foreground">{lab.capacity}</p>
//               </div>
//               <div className="p-4 bg-muted/50 rounded-lg">
//                 <p className="text-sm text-muted-foreground mb-1">Đã Tuyển</p>
//                 <p className="text-2xl font-bold text-foreground">{lab.enrolled}</p>
//               </div>
//             </div>
//           </div>

//           <div>
//             <h3 className="text-lg font-semibold text-foreground mb-3">
//               Danh Sách Sinh Viên ({lab.students.length})
//             </h3>
//             <div className="space-y-2">
//               {lab.students.map((student) => {
//                 const statusInfo = statusConfig[student.status]
//                 const StatusIcon = statusInfo.icon

//                 return (
//                   <div
//                     key={student.id}
//                     className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
//                   >
//                     <div className="flex-1">
//                       <p className="font-medium text-foreground">{student.name}</p>
//                       <p className="text-sm text-muted-foreground">{student.email}</p>
//                     </div>
//                     <div
//                       className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg}`}
//                     >
//                       <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
//                       <span className={`text-sm font-medium ${statusInfo.color}`}>
//                         {statusInfo.label}
//                       </span>
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>
//           </div>

//           <div className="flex gap-2">
//             <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
//               Đóng
//             </Button>
//           </div>
//         </div>
//       </Card>
//     </div>
//   )
// }
