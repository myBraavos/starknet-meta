const { readFileSync } = require("fs");
const { join } = require("path");

const repositoryPath = join(__dirname, "../repository");

const metadataFiles = ["./myswap/metadata.json", "./aspect/metadata.json"];

const iconFiles = ["./myswap/icon.png", "./aspect/icon.jpg"];

const coverFiles = ["./myswap/cover.jpeg", "./aspect/cover.jpeg"];

const keys = [...metadataFiles, ...iconFiles, ...coverFiles];

module.exports = (function requireContext() {
    const context = key => {
        if (key.endsWith(".json")) {
            const filePath = `${repositoryPath}/${
                key.split("/")[1]
            }/metadata.json`;
            const metadata = readFileSync(filePath, "utf-8");
            return JSON.parse(metadata);
        }
        return context.keys().find(k => k === key);
    };

    context.keys = () => {
        return [...metadataFiles, ...iconFiles, ...coverFiles];
    };

    return context;
})();
