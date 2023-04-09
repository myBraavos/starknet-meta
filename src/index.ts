import type { Project } from "./types";
import { contractsMap, normalizeAddress, projectsMap } from "./parser";

export const list = (): Project[] => Object.values(projectsMap);

export const get = (id: string): Project | undefined => projectsMap[id];

export const getByContract = (address: string): Project | undefined =>
    contractsMap[normalizeAddress(address)];

export { Project };
