import Ajv from "ajv";
import addFormats from "ajv-formats";
import { compile } from "json-schema-to-typescript";
import fs from "fs";

const schema = JSON.parse(fs.readFileSync("schema.json", "utf-8"));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate) {
    throw new Error("Invalid schema");
}

compile(schema, "ProjectMetadata", { bannerComment: "" }).then(ts => {
    const additionalInterfaces = `
export interface Project {
    icon: string;
    cover: string;
    metadata: ProjectMetadata;
}
`;
    fs.writeFileSync("./src/types.ts", ts + additionalInterfaces);
});
