const UserModel = require("../models/UserModel");
const PostModel = require("../models/PostModel");

const likeOrUnlikePost = async (postId, userId, like) => {
  try {
    const post = await PostModel.findById(postId);

    if (!post) return { error: "No post found" };

    const isLiked =
        post.likes.filter(like => like.user.toString() === userId).length > 0;

    if (isLiked) return { error: "Post liked before" };

    const user = await UserModel.findById(userId);

    const { profilePicUrl, username } = user;

    return {
      profilePicUrl,
      username,
      postByUserId: post.user.toString()
    };
  } catch (error) {
    return { error: "Server error" };
  }
};

module.exports = { likeOrUnlikePost };
