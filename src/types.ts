import type { Call } from "starknet";
export { Call };

export interface Project extends ProjectMetadata {
    icon: string;
    cover: string;
}

export interface FormatErrorResponse {
    result: string;
    protocol?: string; // id of the associated protocol
    interface?: string[]; // type of interface, if implemented
}

export type HandleErrorContext = Partial<FormatErrorResponse> & {
    address?: string;
    contractTag?: string;
};

export interface FormatErrorParams {
    error: string | Error;
    call?: Call | Call[];
}

export interface HandleErrorParams {
    errorMessage: string;
    calls: Call[];
    context: HandleErrorContext;
}
export type Category =
    | "nft"
    | "defi"
    | "mobile"
    | "infra"
    | "gamefi"
    | "digitalid";

export interface ProjectMetadata {
    id: string;
    displayName: string;
    description: string;
    host:
        | string
        | {
              "mainnet-alpha"?: string;
              "goerli-alpha"?: string;
              "sepolia-alpha"?: string;
              others?: string;
          };
    contracts: Contract[];
    categories: Category[];
    [k: string]: unknown;
}
export interface Contract {
    tag: string;
    implements?: ("erc721" | "erc20" | "erc1155")[];
    addresses: {
        "mainnet-alpha"?: string[];
        "goerli-alpha"?: string[];
        "sepolia-alpha"?: string[];
    };
    [k: string]: unknown;
}
export interface ProjectErrors {
    [k: string]: ErrorMatchersMap;
}
/**
 * This interface was referenced by `ProjectErrors`'s JSON-Schema definition
 * via the `patternProperty` ".*".
 */
export interface ErrorMatchersMap {
    default: ErrorMatcher[];
    /**
     * This interface was referenced by `ErrorMatchersMap`'s JSON-Schema definition
     * via the `patternProperty` ".*".
     */
    [k: string]: ErrorMatcher[];
}
export interface ErrorMatcher {
    matcher: string;
    message: string;
    extractors?: Extractor[];
    [k: string]: unknown;
}
export interface Extractor {
    matcher: string;
    type?: "string" | "address" | "hex" | "decimal" | "boolean";
    [k: string]: unknown;
}
