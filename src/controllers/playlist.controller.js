import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

// **Create a new playlist**
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // Basic validation for required fields (name)
    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist name is required");
    }

    // Create a new playlist document
    const playlist = await Playlist.create({
        name,
        description: description.trim() || "", // Handle optional description
        owner: req.user._id, // Assuming ownership information is available from authentication
    });

    if (!playlist) {
        throw new ApiError(500, "Playlist creation failed ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist created successfully")
        );
});

// **Get all playlists for a user**
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate user ID
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const playlists = await Playlist.find({ owner: userId });

    if (!playlists) {
        throw new ApiError(404, "User playlists not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "User playlists found successfully ")
        );
});

// **Get a playlist by ID**
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate playlist ID
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.findOne({ _id: playlistId });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist found successfully")
        );
});

// **Add a video to a playlist**
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate playlist and video IDs
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Both playlist ID and video ID are required");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    // Use `$addToSet` operator to add video only if it doesn't exist in the playlist already
    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { $addToSet: { videos: videoId } },
        { new: true } // Return the updated document
    );

    if (!playlist) {
        throw new ApiError(500, "Failed to add video to playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video added to playlist successfully")
        );
});

// **Remove a video from a playlist**
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate playlist and video IDs
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Both playlist ID and video ID are required");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    // Use `$pull` operator to remove video from the playlist
    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { $pull: { videos: videoId } },
        { new: true } // Return the updated document
    );

    if (!playlist) {
        throw new ApiError(500, "Failed to remove video from playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video removed from playlist successfully")
        );
});

// **Delete a playlist**
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate playlist ID
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required (प्लेलिस्ट आईडी आवश्यक है)");
    }

    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, owner: req.user._id });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or unauthorized access");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist deleted successfully")
        );
});

// **Update a playlist**
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    // Validate playlist ID
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const updateObject = {}; // Object to store update fields

    // Check if any update fields are provided
    if (!name && !description) {
        throw new ApiError(400, "Changes in name or description are required");
    }

    // Update fields based on provided values
    if (description !== undefined) {
        updateObject.description = description.trim();
    }
    if (name !== undefined) {
        if (name.trim() === "") {
            throw new ApiError(400, "Playlist name cannot be empty");
        } else {
            updateObject.name = name.trim();
        }
    }

    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { $set: updateObject },
        { new: true } // Return the updated document
    );

    if (!playlist) {
        throw new ApiError(500, "Failed to update playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist updated successfully")
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
