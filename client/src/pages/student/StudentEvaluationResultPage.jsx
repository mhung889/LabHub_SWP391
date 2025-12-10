import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import evaluationApi from "@/api/evaluationApi";

export default function StudentEvaluationResultPage() {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvaluation();
  }, []);

  const loadEvaluation = async () => {
    try {
      setLoading(true);
      const response = await evaluationApi.getStudentEvaluation();
      setEvaluation(response.data.evaluation);
    } catch (error) {
      console.error("Error loading evaluation:", error);
      if (error.response?.status !== 404) {
        alert(error.response?.data?.message || "Lỗi khi tải kết quả đánh giá");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (!evaluation) {
    return (
      <Card className="p-8 text-center">
        <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Chưa có kết quả đánh giá</h2>
        <p className="text-muted-foreground">
          Kết quả đánh giá sẽ được hiển thị sau khi mentor nộp báo cáo.
        </p>
      </Card>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Kết Quả Đánh Giá</h1>
        {evaluation.status === "submitted" && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Đã được nộp</span>
          </div>
        )}
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Thông Tin Đánh Giá</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Mentor:</span>
              <p className="font-medium">{evaluation.mentor?.fullName || "N/A"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Ngày nộp:</span>
              <p className="font-medium">
                {formatDate(evaluation.submittedDate || evaluation.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold">Chi Tiết Điểm Số</h3>
          {evaluation.criteriaScores?.map((cs, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold">{cs.criterionName}</h4>
                  {cs.comment && (
                    <p className="text-sm text-muted-foreground mt-1">{cs.comment}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {cs.score} / {cs.maxScore}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Trọng số: {cs.weight}%
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${(cs.score / cs.maxScore) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold">Tổng Điểm:</span>
            <span className="text-3xl font-bold text-primary">
              {evaluation.totalScore?.toFixed(2) || "0.00"} / 100
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

