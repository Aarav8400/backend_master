import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
  })
);

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

//routes import

import userRouter from "./routes/user.routes.js";
import videoRouter from './routes/video.routes.js';
import playlistRouter from './routes/playlist.routes.js';

//router declartion
app.use("/api/v1/users", userRouter);
app.use('/api/v1/videos', videoRouter)
app.use('/api/v1/playlists', playlistRouter)

export { app };
