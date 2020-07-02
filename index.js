const express = require("express");
const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
const app = express();

app.use(express.static("style"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
    return res.render("index", {
        error: null
    });
});

app.post("/", async (req, res) => {
    let video = req.body.video;
    let type = req.body.type || "play";
    if (!video) return res.render("index", {
        error: "No video provided!"
    });
    return await downloadVideo(video, type.toLowerCase(), res);
});

app.get("*", (req, res) => {
    return res.redirect("/");
});

async function downloadVideo(video, type, res) {
    if (!video) return;
    try {
        var searchResult = await ytsr(video);
    } catch(e) {
        return res.render("index", {
            error: "Couldn't find the video!"
        });
    }
    if (!searchResult) return res.render("index", {
        error: "Couldn't find the video!"
    });
    let pickOne = searchResult.items.filter(i => i.type === "video");
    if (!pickOne || pickOne.length < 1) return res.render("index", {
        error: "Couldn't find the video!"
    });
    
    if (type === "play") {
        try {
            var downloaded = await ytdl.getInfo(pickOne[0].link, {
                quality: "heighest"
            });
        } catch (e) {
            return res.render("index", {
                error: "Couldn't find the video!"
            });
        }
        if (!downloaded) return res.render("index", {
            error: "Couldn't find the video!"
        });
        return res.render("player", {
            stream: downloaded.formats[0].url,
            data: pickOne[0]
        });
    } else {
        var downloadedStream;
            if (type !== "audio") downloadedStream = await ytdl(pickOne[0].link, {
                format: "mp4"
            });
            else downloadedStream = await ytdl(pickOne[0].link, {
                quality: "highestaudio"
            });
        } catch (e) {
            return res.render("index", {
                error: "Couldn't find the video!"
            });
        }
        if (!downloadedStream) return res.render("index", {
            error: "Couldn't find the video!"
        });
        res.attachment(`${pickOne[0].title}.mp4`);
        return downloadedStream.pipe(res);
    }
}

app.listen(3000, () => console.log("Server started!"));
