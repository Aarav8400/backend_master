import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Remove leading and trailing whitespace
  },
  description: {
    type: String,
    required: true,
    trim: true, // Remove leading and trailing whitespace
  },
  videos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

playlistSchema.index({ owner: 1, name: 1 }, { unique: true }); // Ensure unique playlist names per user

export const Playlist = mongoose.model("Playlist", playlistSchema);
