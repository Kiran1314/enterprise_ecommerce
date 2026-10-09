import Category from '../models/Category.js';

export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, isFeatured } = req.body;
    let iconPath = '';

    // If multer successfully processed a file, req.file will be populated
    if (req.file) {
      // Create the relative path that the frontend expects
      iconPath = `/assets/images/spare-parts/${req.file.filename}`;
    }

    const newCategory = new Category({
      name,
      slug,
      description,
      isFeatured: isFeatured === 'true', // FormData sends boolean as string
      icon: iconPath
    });

    await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};