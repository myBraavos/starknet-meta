import type { Category, Contract, Project } from "./types";
import { contractsMap, projectsMap } from "./parser";
import { normalizeAddress } from "./utils";
import { formatError } from "./errors";

export const list = (): Project[] => Object.values(projectsMap);

export const get = (id: string): Project | undefined => projectsMap[id];

export const getProjectByContractAddress = (
    address: string
): Project | undefined => contractsMap[normalizeAddress(address)]?.project;

export const getContractByAddress = (
    address: string
): { contract: Contract; project: Project } | undefined => {
    const { contract, project } = contractsMap[normalizeAddress(address)] ?? {};
    if (!contract || !project) {
        return undefined;
    }
    return { contract, project };
};

export { formatError, Category, Project };
