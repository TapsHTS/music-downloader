const express = require("express");
const ytdl = require("ytdl-core");
const app = express();
const youtube = require('youtube-sr');
const cors = require('cors');

app.use(cors());
app.use(express.static("style"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
    return res.render("index", {
        error: null
    });
});

async function downloadVideo(video, type, res) {
        if (!video) return;
        youtube.search(video, { limit: 1 }).then(async video => {
            if (!video[0]) return res.render("index", { error: "❌ Impossible de trouver la musique !" })

            ytdl(video[0].id, { quality: 'highestaudio' }).pipe(res.attachment(video[0].title + '.mp3'));
        }).catch(err => res.render("index", { error: "❌ Impossible de trouver la musique !"}));
    
}

app.post("/", async (req, res) => {
    let video = req.body.video;
    let type = req.body.type || "play";
    if (!video) return res.render("index", {
        error: "Aucune vidéo fournie!"
    });
    return await downloadVideo(video, type.toLowerCase(), res);
});

app.get("*", (req, res) => {
    return res.redirect("/");
});



app.listen(3000, () => console.log("Site démarer !"));