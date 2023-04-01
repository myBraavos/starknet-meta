const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const sharp = require("sharp");

const jsonData = JSON.parse(fs.readFileSync("repository.json", "utf-8"));
const jsonSchema = JSON.parse(fs.readFileSync("schema", "utf-8"));

const ajv = new Ajv();
const validate = ajv.compile(jsonSchema);

const isValid = validate(jsonData);
const ids = new Set();

if (!isValid) {
    throw new Error("The repository.json file is invalid.");
}

const getImagePath = (assetPath, fileName) => {
    for (const ext of ["jpg", "jpeg", "png", "svg", "webp"]) {
        const attemptPath = path.join(assetPath, `${fileName}.${ext}`);
        if (fs.existsSync(attemptPath) && fs.lstatSync(attemptPath).isFile()) {
            return attemptPath;
        }
    }
    return undefined;
};

// Iterate over the objects in the JSON array and check for corresponding asset folders
jsonData.forEach(async obj => {
    // ensure a unique id
    if (ids.has(obj.id)) {
        throw new Error(`Duplicate id found: ${obj.id}`);
    }
    ids.add(obj.id);

    // check if the assets folder exists
    const assetPath = path.join("assets", obj.id);
    if (!fs.existsSync(assetPath) || !fs.lstatSync(assetPath).isDirectory()) {
        throw new Error(`Missing asset folder for id: ${obj.id}`);
    }

    // lookup icon file path
    const iconPath = getImagePath(assetPath, "icon");
    if (!iconPath || !fs.existsSync(iconPath) || !fs.lstatSync(iconPath).isFile()) {
        throw new Error(`Missing or invalid icon image file for id: ${obj.id}`);
    }

    // check if the icon is square and its size is up to 1 MB
    const iconImage = sharp(iconPath);
    const iconMetadata = await iconImage.metadata();
    if (iconMetadata.width !== iconMetadata.height || iconMetadata.size > 1024 * 1024) {
        throw new Error(
            `Invalid icon image file for id: ${obj.id}. Icon must be square and up to 1 MB.`
        );
    }

    const coverPath = getImagePath(assetPath, "cover");
    if (!coverPath || !fs.existsSync(coverPath) || !fs.lstatSync(coverPath).isFile()) {
        throw new Error(`Missing or invalid cover image file for id: ${obj.id}`);
    }

    // validate the cover image dimensions and ratio
    const coverImage = sharp(coverPath);
    const coverMetadata = await coverImage.metadata();
    const aspectRatio = coverMetadata.width / coverMetadata.height;

    if (
        coverMetadata.width > 1500 ||
        coverMetadata.height > 500 ||
        Math.abs(aspectRatio - 1500 / 500) > 0.01
    ) {
        console.error(
            `Invalid cover image file for id: ${obj.id}. Cover image must be up to 1500x500px and have a 0.33 aspect ratio.`
        );
        allAssetsValid = false;
    }
});
