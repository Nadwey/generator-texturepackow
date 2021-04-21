const fs = require("fs-extra");
const PNG = require("pngjs").PNG;
const path = require("path");
const sharp = require('sharp');
const electron = require("electron");
const remote = electron.remote;
const {
    app,
    ipcRenderer
} = require('electron');
const customTitlebar = require('custom-electron-titlebar');
const archiver = require('archiver');
const os = require("os");



function pathHere(_path) {
    return path.join(__dirname, _path);
}

function temp(_path) {
    return path.join("GTP-generator-texture-packow", os.tmpdir(), _path);
}

var walk = async function (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return done(null, results);
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
};



new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#444'),
    menu: null
});

async function gen() {
    const mnoznik = parseInt(document.getElementById("mnoznik-rozdzielczosci").value);
    const selectedInputFile = remote.dialog.showOpenDialogSync(remote.getCurrentWindow(), {

        filters: [{
            name: 'Pliki png (*.png)',
            extensions: ['png']
        }],

    });

    if (selectedInputFile.length == 0) {
        return;
    }

    let log = document.getElementById("log");
    log.value = "";

    log.value += "Usuwam poprzednie wersje...\n";
    log.scrollTo(0, log.scrollHeight);

    fs.remove(pathHere("textures-temp"), () => {
        log.value += "Kopiuje wersje...\n";
        log.scrollTo(0, log.scrollHeight);
        fs.copy(pathHere("textures"), pathHere("textures-temp"), async function () {
            log.value += "Szukam plików...\n";
            log.scrollTo(0, log.scrollHeight);
            walk(path.join(pathHere("textures-temp")), async function (err, result) {
                console.log(err);
                log.value += "Nadpisuje pliki...\n";
                log.scrollTo(0, log.scrollHeight);

                ipcRenderer.send("showProgressWindow");

                setTimeout(async function () {
                    let _zr = 0;

                    await result.forEach(async function (file) {
                        console.log("ext");
                        if (path.extname(file) == ".png") {
                            let fileData = fs.readFileSync(file);
                            try {
                                let png = PNG.sync.read(fileData);
                                await sharp(fs.readFileSync(selectedInputFile[0]))
                                    .resize(png.width * mnoznik, png.height * mnoznik).png().toFile(file);
                            } catch {}

                        }
                        _zr++;

                        ipcRenderer.send("setKomunikat", file);
                        ipcRenderer.send("setTotalProgress", (_zr / result.length) * 100);
                        ipcRenderer.send("setStepProgress", (_zr / result.length) * 100);

                        if (_zr == result.length) finished();
                    });


                }, 1000);


            });
        });
    });
}

function finished() {
    ipcRenderer.send("setKomunikat", "Zakończono tworzenie texture packa, ale spokojnie, jeszcze pakowanie...");
    ipcRenderer.send("setTotalProgress", 0);
    ipcRenderer.send("setStepProgress", 0);

    fs.removeSync(pathHere("resourcepack.zip"))
    var output = fs.createWriteStream(pathHere("resourcepack.zip"));
    var archive = archiver('zip');

    output.on('close', function () {
        let appDataFolder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");

        let Sfiles = remote.dialog.showSaveDialogSync(remote.getCurrentWindow(), {
            defaultPath: path.join(appDataFolder, ".minecraft", "resourcepacks"),
            filters: [{
                name: 'Archiwum zip (*.zip)',
                extensions: ['zip']
            }]
        });
        if (Sfiles != undefined) {
            console.log(Sfiles);
            fs.copySync(pathHere("resourcepack.zip"), Sfiles);
            fs.removeSync(pathHere("resourcepack.zip"));
        }

        ipcRenderer.send("setKomunikat", "Zakończono...");
        ipcRenderer.send("setTotalProgress", 0);
        ipcRenderer.send("setStepProgress", 0);
        ipcRenderer.send("Zakonczono");
    });

    archive.on('error', function (err) {
        alert(err);
    });

    archive.pipe(output);

    archive.directory(pathHere("textures-temp"), "");

    archive.finalize();

}

document.getElementById("wybierz-plik").onclick = () => {
    gen();
}