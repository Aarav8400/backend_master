import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishVideo,
    togglePublishStatus,
    updateVideo,
} from '../controllers/video.Controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

// Middleware to ensure authentication for protected routes
router.use(verifyJWT);

// Route for getting all videos with pagination and sorting
router.route('/')
    .get(getAllVideos);

// Route for publishing a new video
router.route('/')
    .post(
        upload.fields([ // Use upload middleware for video and thumbnail with size limits
            {
                name: 'video',
                maxCount: 1,
            },
            {
                name: 'thumbnail',
                maxCount: 1,
            },
        ]),
        publishVideo
    );

// Route for getting a video by ID 
router.route('/:videoId')
    .get(getVideoById);

// Route for deleting a video by ID
router.route('/:videoId')
    .post(deleteVideo);

// Route for updating a video by ID
router.route('/:videoId')
    .patch(
        upload.single('thumbnail'), // Use upload middleware for thumbnail with size limit
        updateVideo
    );

// Route for toggling publish status of a video by ID 
router.route('/toggle/publish/:videoId')
    .patch(togglePublishStatus);

export default router;
