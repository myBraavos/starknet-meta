const { readFileSync } = require("fs");
const path = require("path");
const { join } = require("path");

const repositoryPath = join(__dirname, "./repository");

const metadataFiles = ["./myswap/metadata.json", "./aspect/metadata.json"];

const iconFiles = ["./myswap/icon.png", "./aspect/icon.jpg"];

const coverFiles = ["./myswap/cover.jpeg", "./aspect/cover.jpeg"];

const errorsFiles = ["./myswap/errors.json", "./aspect/errors.json"];

const generalErrorsFiles = [
    "./errors-interfaces.json",
    "./errors-default.json",
];

const keys = [
    ...metadataFiles,
    ...iconFiles,
    ...coverFiles,
    ...errorsFiles,
    ...generalErrorsFiles,
];

module.exports = (function requireContext() {
    const context = key => {
        if (key.endsWith(".json")) {
            const filePath = path.resolve(repositoryPath, key);
            const fileContent = readFileSync(filePath, "utf-8");
            return JSON.parse(fileContent);
        }
        return context.keys().find(k => k === key);
    };

    context.keys = () => {
        return keys;
    };

    return context;
})();
