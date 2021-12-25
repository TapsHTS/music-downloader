const express = require("express");
const ytdl = require("ytdl-core");
const app = express();
const youtube = require('youtube-sr');
const cors = require('cors');
const fs = require('fs');

var today = new Date();
var dd = today.getDate();

var mm = today.getMonth() + 1;
var yyyy = today.getFullYear();
if (dd < 10) {
    dd = '0' + dd;
}

if (mm < 10) {
    mm = '0' + mm;
}

const date = `${dd}/${mm}/${yyyy}`

app.use(cors());
app.use(express.static("style"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", async(req, res) => {
    return res.render("index", {
        error: null
    });
});

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
}

function YouTubeGetID(url) {
    var ID = '';
    url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if (url[2] !== undefined) {
        ID = url[2].split(/[^0-9a-z_\-]/i);
        ID = ID[0];
    } else {
        ID = url;
    }
    return ID;
}

async function downloadVideo(video, type, res, req) {
    if (!video) return;
    if (validURL(video)) {
        try {
            const data = await ytdl.getBasicInfo(YouTubeGetID(video))
            const min = Math.floor(data.videoDetails.lengthSeconds / 60);
            const seconds = data.videoDetails.lengthSeconds - min * 60;

            ytdl("https://youtube.com/watch?v=" + YouTubeGetID(video), { quality: 'highestaudio' })
                .pipe(fs.createWriteStream(data.videoDetails.title + '.mp3'))
            setTimeout(() => {
                res.download(data.videoDetails.title + '.mp3', data.videoDetails.title + '.mp3', function(err) {
                    fs.unlink(data.videoDetails.title + '.mp3', (err) => {
                        if (err) throw err;
                        console.log(err)
                    });
                });
            }, 800);
            //la sa met le fichier dans un dossier music_cache
            // sa download le fichier

        } catch (err) {
            res.render("index", { error: "❌ Impossible de trouver la musique !" })
            console.log(err)
        }

    } else {
        youtube.search(video, { limit: 1 })
            .then(async video => {
                if (!video[0]) return res.render("index", { error: "❌ Impossible de trouver la musique !" })
				const data = await ytdl.getBasicInfo(YouTubeGetID(video[0].id))
                
                ytdl("https://youtube.com/watch?v=" + video[0].id, { quality: 'highestaudio' })
                    .pipe(fs.createWriteStream(data.videoDetails.title + '.mp3'))
                    setTimeout(() => {
                    res.download("./" + data.videoDetails.title + '.mp3', data.videoDetails.title + '.mp3', function(err) {
                        fs.unlink(data.videoDetails.title + '.mp3', (err) => {
                            if (err) throw err;
                        });
                    });
                }, 800);


            })
            .catch(err => res.render("index", { error: "❌ Impossible de trouver la musique !" }));
    }
}
app.post("/", async(req, res) => {
    let video = req.body.video;
    let type = req.body.type || "play";
    if (!video) return res.render("index", {
        error: "Aucune vidéo fournie!"
    });
    return await downloadVideo(video, type.toLowerCase(), res, req);
});

app.get("*", (req, res) => {
    return res.redirect("/");
});



app.listen(30000, () => console.log("Site démarer !"));

//download mp3 file with ytdl core and store it in the server and send it to the client with express