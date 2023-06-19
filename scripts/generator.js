import Ajv from "ajv";
import addFormats from "ajv-formats";
import { compile } from "json-schema-to-typescript";
import fs from "fs";
import prettier from "prettier";

const schema = JSON.parse(fs.readFileSync("./schemas/schema.json", "utf-8"));
const errorsSchema = JSON.parse(
    fs.readFileSync("./schemas/errors-schema.json", "utf-8")
);
const typesSchema = JSON.parse(
    fs.readFileSync("./schemas/types.json", "utf-8")
);

const ajv = addFormats(new Ajv({ allErrors: true, strict: false })).addSchema(
    typesSchema
);
const validate = ajv.compile(schema);
if (!validate) {
    throw new Error("Invalid schema.json");
}

const validateErrors = ajv.compile(errorsSchema);
if (!validateErrors) {
    throw new Error("Invalid errors-schema.json");
}

const additionalInterfaces = `
import type { Call } from "starknet";
export { Call };

export interface Project extends ProjectMetadata {
    icon: string;
    cover: string;
};

export interface FormatErrorResponse {
    result: string;
    protocol?: string; // id of the associated protocol
    interface?: string[]; // type of interface, if implemented
};

export type HandleErrorContext = Partial<FormatErrorResponse> & {
    address?: string,
    contractTag?: string,
};

export interface FormatErrorParams {
    error: string | Error;
    call?: Call | Call[];
}

export interface HandleErrorParams {
    errorMessage: string;
    calls: Call[];
    context: HandleErrorContext;
};
`;

const options = {
    bannerComment: "",
    cwd: "schemas",
};
const projectMetadataTs = await compile(schema, "ProjectMetadata", options);
const projectErrorsTs = await compile(errorsSchema, "ProjectErrors", options);
const prettierConfig = await prettier.resolveConfig();

fs.writeFileSync(
    "./src/types.ts",
    prettier.format(
        additionalInterfaces + projectMetadataTs + projectErrorsTs,
        prettierConfig
    )
);
