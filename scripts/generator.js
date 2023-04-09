import Ajv from "ajv";
import addFormats from "ajv-formats";
import { compile } from "json-schema-to-typescript";
import fs from "fs";
import prettier from "prettier";

const schema = JSON.parse(fs.readFileSync("schema.json", "utf-8"));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate) {
    throw new Error("Invalid schema");
}

compile(schema, "ProjectMetadata", { bannerComment: "" }).then(ts => {
    const additionalInterfaces = `
export interface Project extends ProjectMetadata {
    icon: string;
    cover: string;
}
`;
    fs.writeFileSync(
        "./src/types.ts",
        prettier.format(ts + additionalInterfaces)
    );
});
