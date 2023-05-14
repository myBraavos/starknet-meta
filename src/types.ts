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
              "mainnet-alpha"?: string,
              "goerli-alpha"?: string,
              "goerli-alpha-2"?: string,
              others?: string,
          };
    contracts: {
        tag: string,
        implements?: ("erc721" | "erc20" | "erc1155")[],
        addresses: {
            "mainnet-alpha"?: string[],
            "goerli-alpha"?: string[],
            "goerli-alpha-2"?: string[],
        },
        [k: string]: unknown,
    }[];
    categories: Category[];
    [k: string]: unknown;
}

export interface Project extends ProjectMetadata {
    icon: string;
    cover: string;
}
