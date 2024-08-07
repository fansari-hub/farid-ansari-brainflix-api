const express = require("express");
const videoData = require("../data/videos.json");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const imagesPath = "http://localhost:8080/images/";
const errorMsgID = "not found, please verify ID for";
const multer = require("multer");

// ** Custom Multer setup to support image file uploading
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    const filePrefix = Math.round(Math.random() * 1e9);
    cb(null, filePrefix + "-" + file.originalname);
  },
});

const upload = multer({ storage: multerStorage });
// ****************************************************

// *** ROUTE: GET /videos ***
router.get("/", (_req, res) => {
  const videoList = videoData.map((i) => {
    return {
      id: i.id,
      title: i.title,
      channel: i.channel,
      image: imagesPath + i.image,
    };
  });
  res.json(videoList);
});
// ****************************************************

// *** ROUTE: POST /videos ***
router.post("/", upload.single("imageFile"), (req, res) => {
  const postVideoTitle = req.body.title;
  const postVideoDescription = req.body.description;
  const postVideoChannel = req.body.userName;
  let imageFileName = "";

  if (!postVideoTitle || !postVideoDescription || !postVideoChannel) {
    res.status(400).send(`POST /videos/:${videoid}/comments - Missing values in post body!`);
    return;
  }
  console.log(req.file);
  if (req.file) {
    imageFileName = req.file.filename;
  } else {
    imageFileName = "Upload-video-preview.jpg";
  }

  const newVideo = videoData.push({
    id: uuidv4(),
    title: postVideoTitle,
    channel: postVideoChannel,
    image: imageFileName,
    description: postVideoDescription,
    views: 0,
    likes: 0,
    duration: "99:99",
    video: "https://unit-3-project-api-0a5620414506.herokuapp.com/stream",
    timestamp: Date.now(),
    comments: [],
  });
  res.status(201).json(videoData[newVideo - 1]);
});
// ****************************************************

// *** ROUTE: GET /videos/:id ***
router.get("/:id", (req, res) => {
  const videoid = req.params.id;
  const videoIndex = videoData.findIndex((o) => o.id === videoid);

  if (videoIndex === -1) {
    res.status(404).send(`GET /videos/:${videoid} - ${errorMsgID} video.`);
    return;
  }

  const videoDetail = { ...videoData[videoIndex] };
  videoDetail.image = imagesPath + videoDetail.image;
  res.json(videoDetail);
  console.log(videoDetail.image);
});
// ****************************************************

// *** ROUTE: PUT /videos/:id/likes ***
router.put("/:id/likes", (req, res) => {
  const videoid = req.params.id;
  const videoIndex = videoData.findIndex((o) => o.id === videoid);

  if (videoIndex === -1) {
    res.status(404).send(`PUT /videos/:${videoid}/likes - ${errorMsgID} video.`);
    return;
  }
  videoData[videoIndex].likes++;
  res.send(`Success: You liked video ${videoid}, new like count ${videoData[videoIndex].likes}`);
});
// ****************************************************

// *** ROUTE: POST /videos/:id/comments ***
router.post("/:id/comments", (req, res) => {
  const videoid = req.params.id;
  const videoIndex = videoData.findIndex((o) => o.id === videoid);

  if (videoIndex === -1) {
    res.status(404).send(`POST /videos/:${videoid}/comments - ${errorMsgID} video.`);
    return;
  }

  const postComment = req.body.comment;
  const postName = req.body.name;

  if (!postComment || !postName) {
    res.status(400).send(`POST /videos/:${videoid}/comments - Missing values in post body!`);
    return;
  }
  const newComment = videoData[videoIndex].comments.push({
    id: uuidv4(),
    name: postName,
    comment: postComment,
    likes: 0,
    timestamp: Date.now(),
  });
  res.status(201).json(videoData[videoIndex].comments[newComment - 1]);
});
// ****************************************************

// *** ROUTE: DELETE /videos/:id/comments/:commentid ***
router.delete("/:id/comments/:commentid", (req, res) => {
  const videoid = req.params.id;
  const commentid = req.params.commentid;
  const videoIndex = videoData.findIndex((o) => o.id === videoid);

  if (videoIndex === -1) {
    res.status(404).send(`DELETE /videos/:${videoid}/comments/${commentid} - ${errorMsgID} video.`);
    return;
  }

  const commentIndex = videoData[videoIndex].comments.findIndex((o) => o.id === commentid);
  if (commentIndex === -1) {
    res.status(404).send(`DELETE /videos/:${videoid}/comments/${commentid} - ${errorMsgID} comment.`);
    return;
  }
  res.json(videoData[videoIndex].comments[commentIndex]);
  videoData[videoIndex].comments.splice(commentIndex, 1);
});
// ****************************************************

module.exports = router;
