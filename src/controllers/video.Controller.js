import { mongoose } from "mongoose";
import { Video } from "../models/video.model.js"; // Import your Video model
import { ApiError } from "../utils/ApiError.js"; // Import your custom error class
import { ApiResponse } from "../utils/ApiResponse.js"; // Import your response formatting class
import { asyncHandler } from "../utils/asyncHandeler.js"; // Import your async handler middleware
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"; // Import your cloudinary upload/delete functions

// **Helper function to get video by ID (with error handling)**
const getVideoByIdUtil = async (req) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "videoId is required "); // Throw error if video ID is missing
    }

    const video = await Video.findById(videoId).exec(); // Fetch video by ID

    if (!video) {
        throw new ApiError(404, "video not found"); // Throw error if video not found
    }

    return video;
};

// **Publish a new video**
const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Basic validation for required fields (title and description)
    if ([title, description].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Title and Description are required");
    }

    let videoLocalPath;
    if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0) {
        videoLocalPath = req.files.video[0].path;
    }

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    // Upload video and thumbnail to Cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    if (!videoFile) {
        throw new ApiError(500, "Error occurs while uploading video on cloud");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(500, "Error occurs while uploading thumbnail on cloud ");
    }

    // Create a new video document in the database
    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.secure_url,
        thumbnail: thumbnail.secure_url,
        duration: videoFile.duration, // Assuming duration information is available from Cloudinary
        owner: req.user._id, // Assuming ownership information is available from authentication
    });

    if (!video) {
        throw new ApiError(500, "Error occurs while creating video in database");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "video Published successfully"));
});

// **Get all videos with pagination and sorting**
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = "date", sortType = 1, userId, isPublished = true } = req.query;

    if (!userId) {
        throw new ApiError(404, "userId is necessary");
    }

    // Validate and sanitize sorting parameters
    let sortingBy = sortBy.toLowerCase().trim(); // Convert to lowercase and remove leading/trailing spaces
    if (sortingBy !== "date" && sortingBy !== "views" && sortingBy !== "title" && sortingBy !== "duration") {
        throw new ApiError(404, "Invalid sortBy");
    }

    let sortingType = Number(sortType); // Convert sort type to a number
    if (sortingType !== 1 && sortingType !== -1) {
        throw new ApiError(404, "Invalid sorting Type");
    }

    let isPublishedStatus = isPublished.toLowerCase().trim(); // Convert to lowercase and remove leading/trailing spaces
    if (isPublishedStatus !== "true" && isPublishedStatus !== "false" && isPublishedStatus !== "all") {
        throw new ApiError(400, "Invalid published Status");
    }

    if (sortingBy === "date") {
        sortingBy = "createdAt"; // Use "createdAt" field for date sorting
    }

    // Build the query object based on filter criteria 
    let myMatch = {
        owner: new mongoose.Types.ObjectId(userId), // Filter by owner ID
    };

    if (isPublishedStatus !== "all") {
        myMatch.isPublished = isPublishedStatus === "true"; // Filter by published status
    }

    // Create the aggregation pipeline for efficient sorting and pagination
    let myAggregate = Video.aggregate([
        {
            $match: myMatch, // Apply the filter criteria
        },
    ]);

    let options = {
        page, // Current page number
        limit, // Number of videos per page
        sort: {
            [sortingBy]: sortingType, // Sort by the specified field and order
        },
    };

    let videos;
    await Video.aggregatePaginate(myAggregate, options, (err, results) => {
        if (err) {
            throw new ApiError(500, err); // Handle errors during aggregation
        }

        if (results) {
            videos = results; // Store the paginated results
        }
    });

    if (!videos) {
        throw new ApiError(404, "Videos not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// **Get a video by ID**
const getVideoById = asyncHandler(async (req, res) => {
    const video = await getVideoByIdUtil(req); // Use the helper function for error handling
    return res
        .status(200)
        .json(new ApiResponse(200, video, "video get successfully"));
});

// **Update a video**
const updateVideo = asyncHandler(async (req, res) => {
    let { title, description } = req.body;

    const video = await getVideoByIdUtil(req); // Use the helper function for error handling

    // Update title and description if provided, otherwise use existing values
    if (title === undefined) {
        title = video.title;
    }
    if (description === undefined) {
        description = video.description;
    }

    title = title.trim(); // Remove leading/trailing spaces
    description = description.trim();

    // Validate if any changes are made before updating (हिंदी में मान्य करें कि कोई परिवर्तन किए गए हैं या नहीं)
    if (title === video.title && description === video.description && !(req.file && req.file.path)) {
        throw new ApiError(400, "Please change title or description or thumbnail");
    } else if (title === "" || description === "") {
        throw new ApiError(400, "title and description required");
    }

    let thumbnail = video.thumbnail; // Store existing thumbnail URL

    // Update thumbnail if a new one is uploaded
    if (req.file && req.file.path) {
        const thumbnailLocalPath = req.file.path;
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        await deleteFromCloudinary(video.thumbnail); // Delete the old thumbnail from Cloudinary
    }

    // Update the video document in the database
    const updatedVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            title,
            description,
            thumbnail: thumbnail.secure_url, // Update with the new thumbnail URL
        },
        { new: true } // Return the updated document
    );

    if (!updatedVideo) {
        throw new ApiError(500, "video not update successfully");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "video updated successfully"));
});

// **Delete a video**
const deleteVideo = asyncHandler(async (req, res) => {
    const video = await getVideoByIdUtil(req); // Use the helper function for error handling

    if (!video) {
        throw new ApiError(404, "video not found ");
    }

    // Delete the video and thumbnail from Cloudinary
    await deleteFromCloudinary(video.videoFile);
    await deleteFromCloudinary(video.thumbnail);

    // Delete the video document from the database
    const deletedVideo = await Video.findByIdAndDelete(video._id);

    if (!deletedVideo) {
        throw new ApiError(500, "video does not delete");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, deletedVideo, "video deleted successfully"));
});

// **Toggle publish status of a video**
const togglePublishStatus = asyncHandler(async (req, res) => {
    const video = await getVideoByIdUtil(req); // Use the helper function for error handling

    if (!video) {
        throw new ApiError(404, "video does not get");
    }

    // Update the publish status of the video document
    const toggledPublishVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            isPublished: !video.isPublished, // Toggle the existing status
        },
        { new: true } // Return the updated document
    );

    if (!toggledPublishVideo) {
        throw new ApiError(500, "publish status does not toggled successfully");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, toggledPublishVideo, "publish status toggled successfully"));
});

// Export the controller functions for use in your Express application
export { publishVideo, getAllVideos, getVideoById, updateVideo, deleteVideo, togglePublishStatus };
