import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
  // Specify the liked entity type (video, comment, tweet)
  likedEntity: {
    type: String,
    required: true,
    enum: ["Video", "Comment"], // Enforce valid entity types
  },
  likedEntityId: {
    type: Schema.Types.ObjectId,
    refPath: "likedEntity", // Dynamically reference based on entity type
    required: true,
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

likeSchema.index({ likedEntityId: 1, likedBy: 1 }, { unique: true }); // Ensure unique likes 

export const Like = mongoose.model("Like", likeSchema);
