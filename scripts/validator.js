import fs from "fs";
import path from "path";
import addFormats from "ajv-formats";
import Ajv from "ajv";
import sharp from "sharp";
import { fileURLToPath } from "url";
import * as tsImport from "ts-import";

const { default: stringToRegExp } = await tsImport.load(
    "./src/utils/stringToRegExp.ts"
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getSchema = filePath =>
    JSON.parse(fs.readFileSync(path.join(__dirname, filePath), "utf-8"));

const schema = getSchema("../schemas/schema.json");
const errorsSchema = getSchema("../schemas/errors-schema.json");
const typesSchema = getSchema("../schemas/types.json");
const interfaceErrorsSchema = getSchema(
    "../schemas/errors-interfaces-schema.json"
);
const defaultErrorsSchema = getSchema("../schemas/errors-default-schema.json");
const interfaceErrors = getSchema("../repository/errors-interfaces.json");
const defaultErrors = getSchema("../repository/errors-default.json");

const validator = addFormats(
    new Ajv({ allErrors: true, allowMatchingProperties: true })
).addSchema(typesSchema);
const validate = validator.compile(schema);
const validateErrorsFile = validator.compile(errorsSchema);
const validateInterfacesErrorsFile = validator.compile(interfaceErrorsSchema);
const validateDefaultErrorsFile = validator.compile(defaultErrorsSchema);

const repositoryPath = path.join(__dirname, "../repository");

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

const validateErrorMatchers = (errorMatchers, _messageBase) => {
    const errorsArray = [];
    Object.getOwnPropertyNames(errorMatchers).forEach(entryPointName => {
        errorMatchers[entryPointName].forEach((errorMatcher, matcherIdx) => {
            const errorMessageBase =
                _messageBase + `/${entryPointName}/${matcherIdx}`;
            // Validate matcher
            try {
                stringToRegExp(errorMatcher.matcher);
            } catch (e) {
                errorsArray.push(
                    errorMessageBase + `/matcher contains invalid regExp`
                );
            }

            const placeholdersArray = Array.from(
                errorMatcher.message?.matchAll(/{{(\d*?)}}?/g)
            );

            const placeholdersLength = placeholdersArray.length || 0;
            const extractorsLength = errorMatcher.extractors?.length || 0;

            // Validate number of placeholders im message
            if (placeholdersLength !== extractorsLength) {
                errorsArray.push(
                    errorMessageBase +
                        `/message the number of placeholders in massage (${placeholdersLength}) should be the same as the number of extractors (${extractorsLength})`
                );
                return;
            }

            // Validate placeholders numbers
            const placeholdersNumbers = placeholdersArray.map(resultsArray =>
                Number(resultsArray[1])
            );

            if (placeholdersNumbers.some(number => number < 1)) {
                errorsArray.push(
                    errorMessageBase +
                        `/message placeholder numbers must be greater than or equal to 1`
                );
                return;
            }

            // Validate matching of the placeholder to the extractor
            for (const placeholderNumber of placeholdersNumbers) {
                if (!errorMatcher.extractors[placeholderNumber - 1]) {
                    errorsArray.push(
                        errorMessageBase +
                            `/message placeholder with number ${placeholderNumber} has no extractor`
                    );
                }
            }

            errorMatcher.extractors.forEach((extractor, extractorIdx) => {
                try {
                    stringToRegExp(extractor.matcher);
                } catch (e) {
                    errorsArray.push(
                        errorMessageBase +
                            `/extractors/${extractorIdx}/matcher contains invalid regExp`
                    );
                }
            });
        });
    });

    return errorsArray;
};

const validateProjectFiles = async projectFolder => {
    const projectPath = path.join(repositoryPath, projectFolder);
    const metadataPath = path.join(projectPath, "metadata.json");
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

    const isValid = validate(metadata);

    if (!isValid) {
        const errors = validator.errorsText(validate.errors);
        throw new Error(
            `Invalid metadata.json for id: ${projectFolder}. Errors: ${errors}`
        );
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
            `Missing or invalid icon image file for id: ${metadata.id}. Please check if the file exists and is in the correct format.`
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
            `Invalid icon image file for id: ${metadata.id}. Icon must be square and up to 1 MB. Current dimensions: ${iconMetadata.width}x${iconMetadata.height}, size: ${iconMetadata.size} bytes.`
        );
    }

    const coverPath = getImagePath(assetPath, "cover");
    if (
        !coverPath ||
        !fs.existsSync(coverPath) ||
        !fs.lstatSync(coverPath).isFile()
    ) {
        throw new Error(
            `Missing or invalid cover image file for id: ${metadata.id}. Please check if the file exists and is in the correct format.`
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
            `Invalid cover image file for id: ${
                metadata.id
            }. Cover image must be up to 1500x500px and have a 0.33 aspect ratio. Current dimensions: ${
                coverMetadata.width
            }x${coverMetadata.height}, aspect ratio: ${aspectRatio.toFixed(2)}.`
        );
    }
};

const validateProjectErrorsFile = projectFolder => {
    const projectPath = path.join(repositoryPath, projectFolder);
    const errorsPath = path.join(projectPath, "errors.json");
    if (!fs.existsSync(errorsPath)) return;

    const errorsData = JSON.parse(fs.readFileSync(errorsPath, "utf-8"));

    if (!validateErrorsFile(errorsData)) {
        const errors = validator.errorsText(validateErrorsFile.errors);
        throw new Error(
            `Invalid errors.json for id: ${projectFolder}. Errors: ${errors}`
        );
    }

    const errors = [];
    Object.keys(errorsData).forEach(contractTag => {
        errors.push(
            ...validateErrorMatchers(
                errorsData[contractTag],
                `data/${contractTag}`
            )
        );
    });
    if (errors.length) {
        throw new Error(
            `Invalid errors.json for id: ${projectFolder}. Errors: ${errors.join(
                ", "
            )}`
        );
    }
};

//
// validate project-specific files
//
const projectFolders = fs
    .readdirSync(repositoryPath)
    .filter(folder =>
        fs.statSync(path.join(repositoryPath, folder)).isDirectory()
    );
for (const projectFolder of projectFolders) {
    await validateProjectFiles(projectFolder);
    validateProjectErrorsFile(projectFolder);
}

//
// validate interfaces errors
//
{
    if (!validateInterfacesErrorsFile(interfaceErrors)) {
        const errors = validator.errorsText(
            validateInterfacesErrorsFile.errors
        );
        throw new Error(`Invalid errors-interfaces.json. Errors: ${errors}`);
    }
    const interfaceErrorsArr = [];
    Object.getOwnPropertyNames(interfaceErrorsArr).forEach(interfaceName => {
        interfaceErrorsArr.push(
            ...validateErrorMatchers(
                interfaceErrorsArr[interfaceName],
                `data/${interfaceName}`
            )
        );
    });
    if (interfaceErrorsArr.length) {
        throw new Error(
            `Invalid errors-interface.json. Errors: ${interfaceErrorsArr.join(
                ", "
            )}`
        );
    }
}

//
// validate default errors
//
{
    if (!validateDefaultErrorsFile(defaultErrors)) {
        const errors = validator.errorsText(validateDefaultErrorsFile.errors);
        throw new Error(`Invalid errors-default.json. Errors: ${errors}`);
    }

    const defaultErrorsArr = validateErrorMatchers(defaultErrors, `data`);
    if (defaultErrorsArr.length) {
        throw new Error(
            `Invalid errors-default.json. Errors: ${defaultErrorsArr.join(
                ", "
            )}`
        );
    }
}
