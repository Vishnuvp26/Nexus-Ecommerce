//Route
// adminRouter.delete('/deleteCategory', adminController.deleteCategory);


// Delete Category
// const deleteCategory = async (req, res) => {
//     try {
//         const { id } = req.query;

//         const deletedCategory = await categoryModel.findByIdAndUpdate(id,
//             { $set: { status: inactive } },
//             { new: true }
//         );

//         if (!deletedCategory) {
//             return res.status(404).json({ message: 'Category not found' });
//         }

//         res.status(200).json({ message: 'Category has been deleted', category: deletedCategory });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'An error occurred while deleting the category.' });
//     }
// };