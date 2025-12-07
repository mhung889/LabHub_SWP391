const LabModel = require("../models/lab-model");
const ErrorResponse = require('../helpers/ErrorResponse');

module.exports = {
  // Get all labs (for dropdown selection)
  getLabs: async (req, res) => {
    try {
      const { status } = req.query;
      const query = {};
      
      // Filter by status if provided
      if (status && (status === 'active' || status === 'inactive')) {
        query.status = status;
      }
      
      const labs = await LabModel.find(query)
        .select('name code description major status mentor')
        .populate('mentor', 'fullName email')
        .sort({ createdAt: -1 })
        .lean();
      
      return res.status(200).json({
        labs: labs || [],
      });
    } catch (error) {
      console.error('Error in getLabs:', error);
      throw new ErrorResponse(500, 'Lỗi khi lấy danh sách lab');
    }
  },

  createLab: async (req, res) => {
    // TODO: Implement create lab
  },
}
