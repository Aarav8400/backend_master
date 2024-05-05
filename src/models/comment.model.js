import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true, // Remove leading and trailing whitespace
      minLength: 1, // Enforce minimum content length
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true, // Ensure video association for comments
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // Ensure owner association for comments
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: "User", // Allow multiple users to like a comment
      default: [],
    },
    dislikes: {
      type: [Schema.Types.ObjectId],
      ref: "User", // Allow multiple users to dislike a comment
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now, // Set default creation timestamp
    },
    updatedAt: {
      type: Date,
      default: Date.now, // Set default update timestamp
    },
  },
  {
    timestamps: { currentTime: () => Date.now() }, // Ensure accurate timestamps
  }
);

commentSchema.plugin(mongooseAggregatePaginate); //it means we can use aggregate paginate in this schema ,
//it help to do pagination 

// 1. Validation:
const commentValidation = new Schema.Validator({
  content: {
    validator: (value) => value.length >= 1, // Enforce minimum content length
    message: "Comment content is required and must be at least 1 character long.",
  },
});
commentSchema.pre("validate", commentValidation);

// 2. Indexing:
commentSchema.index({ video: 1, createdAt: -1 }); // Index for efficient video comments retrieval
commentSchema.index({ owner: 1, createdAt: -1 }); // Index for efficient user comments retrieval


export const Comment = mongoose.model("Comment", commentSchema);
