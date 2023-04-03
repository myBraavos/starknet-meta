import type { Project, ProjectMetadata } from "./types";
import packageJson from "../package.json";

declare const require: {
    context: (path: string, subdirectories: boolean, pattern: RegExp) => any;
};

const repositoryContext =
    process.env.NODE_ENV === "test"
        ? // @ts-ignore
          require("../__mocks__/require-context-mock.js")
        : require.context(
              "../repository",
              true,
              /\.(json|png|jpg|jpeg|svg|webp)$/
          );

const baseUrl = `https://raw.githubusercontent.com/${packageJson.repository.url.replaceAll(
    "https://github.com/",
    ""
)}/master/repository`;

const readMetadata = (projectId: string): ProjectMetadata => {
    return repositoryContext(`./${projectId}/metadata.json`);
};

const imageExtensions = ["png", "jpg", "jpeg", "svg", "webp"];
const getImagePath = (projectId: string, baseName: string): string | null => {
    for (const ext of imageExtensions) {
        try {
            const iconName = `${projectId}/${baseName}.${ext}`;
            const exists = repositoryContext(`./${iconName}`);
            if (exists) {
                return `${baseUrl}/${iconName}`;
            }
        } catch (error) {
            // Ignore the error and try the next extension
        }
    }
    return null;
};

const getProject = (id: string): Project => {
    const icon = getImagePath(id, "icon");
    const cover = getImagePath(id, "cover");
    if (icon === null || cover === null) {
        throw new Error(`Missing icon or cover file for project ${id}`);
    }
    return {
        icon,
        cover,
        metadata: readMetadata(id),
    };
};

const projectFolders = repositoryContext
    .keys()
    .reduce((folders: string[], filePath: string) => {
        const folder = filePath.split("/")[1];
        if (!folders.includes(folder)) {
            folders.push(folder);
        }
        return folders;
    }, []);
const projectsMap: Record<string, Project> = projectFolders.reduce(
    (map: { [key in string]: Project }, projectFolder: string) => {
        const proj = getProject(projectFolder);
        return {
            ...map,
            [proj.metadata.id]: proj,
        };
    },
    {}
);

export const list = (): Project[] => Object.values(projectsMap);

export const get = (id: string): Project | null => projectsMap[id];
