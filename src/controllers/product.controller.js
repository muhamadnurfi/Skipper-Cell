export const createProduct = async (req, res) => {
  res.status(201).json({
    message: "Product created successfully!",
    data: req.body,
    userRole: req.user.role,
  });
};

export const getAllProduct = (req, res) => {
  res.status(200).json({
    message: "List of all mobile phones and accessories.",
  });
};
