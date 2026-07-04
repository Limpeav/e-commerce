import DeletedAccountLog from "../models/deletedAccountLogModel.js";

export const recordDeletedAccount = async ({
  user,
  deletedBy,
  deletedByUser = null,
}) => {
  if (!user?._id || !deletedBy) return null;

  return DeletedAccountLog.create({
    user: user._id,
    role: user.role || "user",
    deletedBy,
    deletedByUser,
    deletedAt: new Date(),
  });
};

