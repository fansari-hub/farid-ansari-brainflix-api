const express = require("express");
const cors = require("cors");
const app = express();
const port = 8080;
app.use(cors());

app.route("/")
.get((_req,res) => {
    res.status(200).send("Welcome to BrainFlix API Server.");
});
g
app.route("*")
.get((_req,res) => {
    res.status(404).send("End point not found. Please check your URL!");
});



app.listen(port, () => {
    console.log(`BrainFlix API Server is running on http://localhost:${port}`);
  });
  