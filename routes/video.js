/* NOTE: 
To reset server data to original state, shutdown server & delete ./data/videos-livedata.json. 
 The file will be recreated on the next load. 
*/

const express = require("express");
const fs = require("fs");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

const IMAGE_PATH = "http://localhost:8080/images/";
const VIDEO_PATH = "http://localhost:8080/videos/";
const TXT_ERRORID = "not found, please verify ID for";
const MOCK_VIDEO = "BrainStationSampleVideo.mp4";
const STORGE_FILE = "./data/videos-livedata.json";
const INIT_FILE = "./data/videos.json";
const DEFAULT_VIDEO_THUMB = "Upload-video-preview.jpg";

// ********** START MAIN ***********
const upload = initMulter();
const videoData = initDataFile();


  // *** Middleware to automatically save server data on any non-GET REQUEST ***
  router.use((req, _res, next) => {
    next();
    if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
      console.log(`Data state altered via request method: ${req.method} with status code ${req.res.statusCode}`);
      saveServerData();
    }
  });

// *** Custom Multer setup to support image file uploading ***
function initMulter() {
  const multerStorage = multer.diskStorage({
    destination: function (_req, _file, cb) {
      cb(null, "public/images");
    },
    filename: function (_req, file, cb) {
      const filePrefix = "userData" + "_" + Math.round(Math.random() * 1e9);
      const fileExt = file.originalname.split(".");
      cb(null, filePrefix + "." + fileExt[fileExt.length - 1]);
    },
  });
  return multer({ storage: multerStorage });
}

// ******** DATA FILE SETUP & INIT ********
function initDataFile() {
  if (fs.existsSync(STORGE_FILE)) {
    console.log("Existing livedData storage file found, loading data...");
    const data = JSON.parse(fs.readFileSync(STORGE_FILE));
    console.log("Data load complete.");
    return data;
  } else {
    console.log("Live data storage file not found, intializing data ....");
    const initialData = JSON.parse(fs.readFileSync(INIT_FILE));
    fs.writeFileSync(STORGE_FILE, JSON.stringify(initialData));
    const data = JSON.parse(fs.readFileSync(STORGE_FILE));
    console.log("Data initialization complete.");
    return data;
  }
}

// ******** SAVE SERVER DATA STATE TO FILE ********
function saveServerData() {
  console.log("Saving server data state to file...");
  fs.writeFileSync(STORGE_FILE, JSON.stringify(videoData));
  console.log("Data saved.");
}

// *** ROUTE: GET /videos ***
router.get("/", (_req, res) => {
  const videoList = videoData.map((i) => {
    return {
      id: i.id,
      title: i.title,
      channel: i.channel,
      image: IMAGE_PATH + i.image,
    };
  });
  res.json(videoList);
});

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
  if (req.file) {
    imageFileName = req.file.filename;
    console.log(`User image upload: ${req.file.filename}`);
  } else {
    imageFileName = DEFAULT_VIDEO_THUMB;
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
    video: "",
    timestamp: Date.now(),
    comments: [],
  });
  res.status(201).json(videoData[newVideo - 1]);
});

// *** ROUTE: GET /videos/:id ***
router.get("/:id", (req, res) => {
  const videoid = req.params.id;
  const videoIndex = videoData.findIndex((o) => o.id === videoid);

  if (videoIndex === -1) {
    res.status(404).send(`GET /videos/:${videoid} - ${TXT_ERRORID} video.`);
    return;
  }

  const videoDetail = { ...videoData[videoIndex] };
  videoDetail.image = IMAGE_PATH + videoDetail.image;
  videoDetail.video = VIDEO_PATH + MOCK_VIDEO;
  res.json(videoDetail);
});

// *** ROUTE: PUT /videos/:id/likes ***
router.put("/:id/likes", (req, res) => {
  const videoid = req.params.id;
  const videoIndex = videoData.findIndex((o) => o.id === videoid);

  if (videoIndex === -1) {
    res.status(404).send(`PUT /videos/:${videoid}/likes - ${TXT_ERRORID} video.`);
    return;
  }
  videoData[videoIndex].likes++;
  res.send(`Success: You liked video ${videoid}, new like count ${videoData[videoIndex].likes}`);
});

// *** ROUTE: POST /videos/:id/comments ***
router.post("/:id/comments", (req, res) => {
  const videoid = req.params.id;
  const videoIndex = videoData.findIndex((o) => o.id === videoid);

  if (videoIndex === -1) {
    res.status(404).send(`POST /videos/:${videoid}/comments - ${TXT_ERRORID} video.`);
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

// *** ROUTE: DELETE /videos/:id/comments/:commentid ***
router.delete("/:id/comments/:commentid", (req, res) => {
  const videoid = req.params.id;
  const commentid = req.params.commentid;
  const videoIndex = videoData.findIndex((o) => o.id === videoid);

  if (videoIndex === -1) {
    res.status(404).send(`DELETE /videos/:${videoid}/comments/${commentid} - ${TXT_ERRORID} video.`);
    return;
  }

  const commentIndex = videoData[videoIndex].comments.findIndex((o) => o.id === commentid);
  if (commentIndex === -1) {
    res.status(404).send(`DELETE /videos/:${videoid}/comments/${commentid} - ${TXT_ERRORID} comment.`);
    return;
  }
  res.json(videoData[videoIndex].comments[commentIndex]);
  videoData[videoIndex].comments.splice(commentIndex, 1);
});

module.exports = router;
