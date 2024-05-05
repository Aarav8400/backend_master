import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from '../controllers/playlist.controller.js';

const router = Router();

// Protect all routes with middleware for authentication
router.use(verifyJWT);

// **Create a new playlist**
router.post('/', createPlaylist);

// **Get a playlist by ID**
router.get('/:playlistId', getPlaylistById);

// **Update a playlist**
router.patch('/:playlistId', updatePlaylist);

// **Delete a playlist**
router.delete('/:playlistId', deletePlaylist);

// **Add a video to a playlist**
router.patch('/add/:videoId/:playlistId', addVideoToPlaylist);

// **Remove a video from a playlist**
router.patch('/remove/:videoId/:playlistId', removeVideoFromPlaylist);

// **Get all playlists for a user**
router.get('/user/:userId', getUserPlaylists);

export default router;
