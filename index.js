const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 8080;
const videoRoute = require("./routes/video");

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use("/videos", videoRoute);

// app.route("*").get((_req, res) => {
//   res.status(404).send("End point not found. Please check your URL!");
// });

app.listen(PORT, () => {
  console.log(`BrainFlix API Server is running on http://localhost:${PORT}`);
});
