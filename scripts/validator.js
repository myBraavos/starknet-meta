import fs from "fs";
import path from "path";
import Ajv from "ajv";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, "../schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

const repositoryPath = path.join(__dirname, "../repository");

const projectFolders = fs
    .readdirSync(repositoryPath)
    .filter(folder =>
        fs.statSync(path.join(repositoryPath, folder)).isDirectory()
    );

const ids = new Set();

const getImagePath = (assetPath, fileName) => {
    for (const ext of ["jpg", "jpeg", "png", "svg", "webp"]) {
        const attemptPath = path.join(assetPath, `${fileName}.${ext}`);
        if (fs.existsSync(attemptPath) && fs.lstatSync(attemptPath).isFile()) {
            return attemptPath;
        }
    }
    return undefined;
};

projectFolders.forEach(async projectFolder => {
    const projectPath = path.join(repositoryPath, projectFolder);

    // Read and validate metadata.json
    const metadataPath = path.join(projectPath, "metadata.json");
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

    const isValid = validate(metadata);
    if (!isValid) {
        throw new Error(`Invalid metadata.json for id: ${projectFolder}`);
    }

    // ensure a unique id
    if (ids.has(metadata.id)) {
        throw new Error(`Duplicate id found: ${metadata.id}`);
    }
    ids.add(metadata.id);

    // check if the repository folder exists
    const assetPath = path.join("repository", metadata.id);
    if (!fs.existsSync(assetPath) || !fs.lstatSync(assetPath).isDirectory()) {
        throw new Error(`Missing asset folder for id: ${metadata.id}`);
    }

    // lookup icon file path
    const iconPath = getImagePath(assetPath, "icon");
    if (
        !iconPath ||
        !fs.existsSync(iconPath) ||
        !fs.lstatSync(iconPath).isFile()
    ) {
        throw new Error(
            `Missing or invalid icon image file for id: ${metadata.id}`
        );
    }

    // check if the icon is square and its size is up to 1 MB
    const iconImage = sharp(iconPath);
    const iconMetadata = await iconImage.metadata();
    if (
        iconMetadata.width !== iconMetadata.height ||
        iconMetadata.size > 1024 * 1024
    ) {
        throw new Error(
            `Invalid icon image file for id: ${metadata.id}. Icon must be square and up to 1 MB.`
        );
    }

    const coverPath = getImagePath(assetPath, "cover");
    if (
        !coverPath ||
        !fs.existsSync(coverPath) ||
        !fs.lstatSync(coverPath).isFile()
    ) {
        throw new Error(
            `Missing or invalid cover image file for id: ${metadata.id}`
        );
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
        throw new Error(
            `Invalid cover image file for id: ${metadata.id}. Cover image must be up to 1500x500px and have a 0.33 aspect ratio.`
        );
    }
});
