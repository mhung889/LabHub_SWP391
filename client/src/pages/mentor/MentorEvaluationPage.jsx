import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Send, Users, CheckCircle } from "lucide-react";
import evaluationApi from "@/api/evaluationApi";

export default function MentorEvaluationPage() {
  const [students, setStudents] = useState([]);
  const [criterias, setCriterias] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadEvaluation();
    }
  }, [selectedStudent]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, criteriasRes] = await Promise.all([
        evaluationApi.getAssignedStudents(),
        evaluationApi.getActiveCriterias(),
      ]);
      setStudents(studentsRes.data.students || []);
      setCriterias(criteriasRes.data.criterias || []);

      // Initialize scores
      const initialScores = {};
      const initialComments = {};
      (criteriasRes.data.criterias || []).forEach((c) => {
        initialScores[c._id] = "";
        initialComments[c._id] = "";
      });
      setScores(initialScores);
      setComments(initialComments);
    } catch (error) {
      console.error("Error loading data:", error);
      alert(error.response?.data?.message || "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluation = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      const response = await evaluationApi.getEvaluationByStudent(selectedStudent._id);
      const evalData = response.data.evaluation;

      if (evalData) {
        setEvaluation(evalData);
        const newScores = {};
        const newComments = {};
        evalData.criteriaScores?.forEach((cs) => {
          newScores[cs.criterionId] = cs.score.toString();
          newComments[cs.criterionId] = cs.comment || "";
        });
        setScores(newScores);
        setComments(newComments);
      } else {
        setEvaluation(null);
        const initialScores = {};
        const initialComments = {};
        criterias.forEach((c) => {
          initialScores[c._id] = "";
          initialComments[c._id] = "";
        });
        setScores(initialScores);
        setComments(initialComments);
      }
    } catch (error) {
      console.error("Error loading evaluation:", error);
      alert(error.response?.data?.message || "Lỗi khi tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handleScoreChange = (criterionId, value) => {
    setScores({ ...scores, [criterionId]: value });
  };

  const handleCommentChange = (criterionId, value) => {
    setComments({ ...comments, [criterionId]: value });
  };

  const validateScores = () => {
    for (const criteria of criterias) {
      const score = scores[criteria._id];
      if (!score || score === "" || score === null) {
        alert(`Vui lòng nhập điểm cho tiêu chí: ${criteria.criterionName}`);
        return false;
      }
      const scoreNum = parseFloat(score);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > criteria.maxScore) {
        alert(
          `Điểm cho tiêu chí ${criteria.criterionName} phải từ 0 đến ${criteria.maxScore}`
        );
        return false;
      }
    }
    return true;
  };

  const calculateTotalScore = () => {
    let total = 0;
    criterias.forEach((criteria) => {
      const score = parseFloat(scores[criteria._id] || 0);
      const weightedScore = (score / criteria.maxScore) * criteria.weight;
      total += weightedScore;
    });
    return total.toFixed(2);
  };

  const handleSave = async () => {
    if (!selectedStudent) {
      alert("Vui lòng chọn học sinh");
      return;
    }

    if (!validateScores()) return;

    try {
      setSaving(true);
      const criteriaScores = criterias.map((criteria) => ({
        criterionId: criteria._id,
        score: parseFloat(scores[criteria._id]),
        comment: comments[criteria._id] || "",
      }));

      await evaluationApi.createOrUpdateEvaluation({
        studentId: selectedStudent._id,
        criteriaScores,
      });

      alert("Lưu đánh giá thành công");
      loadEvaluation();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu đánh giá");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      alert("Vui lòng chọn học sinh");
      return;
    }

    if (!evaluation) {
      alert("Vui lòng lưu đánh giá trước khi nộp");
      return;
    }

    if (!confirm("Bạn có chắc muốn nộp báo cáo đánh giá này? Sau khi nộp sẽ không thể chỉnh sửa.")) {
      return;
    }

    try {
      setSaving(true);
      await evaluationApi.submitEvaluation(evaluation._id);
      alert("Nộp báo cáo đánh giá thành công");
      loadEvaluation();
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      alert(error.response?.data?.message || "Lỗi khi nộp báo cáo đánh giá");
    } finally {
      setSaving(false);
    }
  };

  if (loading && students.length === 0) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Đánh Giá Học Sinh</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Danh Sách Học Sinh
          </h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {students.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Chưa có học sinh được gán
              </p>
            ) : (
              students.map((student) => (
                <button
                  key={student._id}
                  onClick={() => handleStudentSelect(student)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedStudent?._id === student._id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <p className="font-medium">{student.fullName}</p>
                  <p className="text-sm opacity-80">{student.studentCode}</p>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Evaluation Form */}
        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <Card className="p-8 text-center text-muted-foreground">
              Vui lòng chọn học sinh để đánh giá
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedStudent.fullName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedStudent.studentCode}
                  </p>
                </div>
                {evaluation?.status === "submitted" && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Đã nộp</span>
                  </div>
                )}
              </div>

              {criterias.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có tiêu chí đánh giá nào được cấu hình
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {criterias.map((criteria) => (
                      <div key={criteria._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{criteria.criterionName}</h3>
                            {criteria.description && (
                              <p className="text-sm text-muted-foreground">
                                {criteria.description}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Trọng số: {criteria.weight}% | Điểm tối đa: {criteria.maxScore}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Điểm <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max={criteria.maxScore}
                              step="0.1"
                              value={scores[criteria._id] || ""}
                              onChange={(e) =>
                                handleScoreChange(criteria._id, e.target.value)
                              }
                              disabled={evaluation?.status === "submitted"}
                              placeholder={`0 - ${criteria.maxScore}`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Nhận xét
                            </label>
                            <Input
                              value={comments[criteria._id] || ""}
                              onChange={(e) =>
                                handleCommentChange(criteria._id, e.target.value)
                              }
                              disabled={evaluation?.status === "submitted"}
                              placeholder="Nhận xét (tùy chọn)"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Tổng điểm:</span>
                      <span className="text-2xl font-bold text-primary">
                        {calculateTotalScore()} / 100
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        disabled={saving || evaluation?.status === "submitted"}
                        className="gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Đang lưu..." : "Lưu"}
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={
                          saving ||
                          !evaluation ||
                          evaluation.status === "submitted"
                        }
                        variant="default"
                        className="gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Nộp Báo Cáo
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

