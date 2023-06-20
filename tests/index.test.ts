// @ts-nocheck
import { get, getProjectByContractAddress, list, formatError } from "../src";
import formatErrorTestData from "./__mocks__/formatErrorTestData";

describe("list", () => {
    it("should return an array of projects", () => {
        const projects = list();
        expect(projects).toBeInstanceOf(Array);
        expect(projects.length).toBeGreaterThan(0);
    });

    it("should return projects with valid metadata, icon, and cover", () => {
        const projects = list();
        for (const project of projects) {
            expect(project).toHaveProperty("id");
            expect(project).toHaveProperty("displayName");
            expect(project).toHaveProperty("description");
            expect(project).toHaveProperty("host");
            expect(project).toHaveProperty("contracts");
            expect(project).toHaveProperty("categories");

            expect(project.icon).toMatch(
                /^https:\/\/raw\.githubusercontent\.com\/.*\/icon\.(png|jpg|jpeg|svg|webp)$/
            );
            expect(project.cover).toMatch(
                /^https:\/\/raw\.githubusercontent\.com\/.*\/cover\.(png|jpg|jpeg|svg|webp)$/
            );
        }
    });
});

describe("get", () => {
    it("should return a project with valid metadata, icon, and cover for a given ID", () => {
        const projects = list();
        for (const project of projects) {
            const fetchedProject = get(project.id)!;

            expect(fetchedProject).not.toBeUndefined();

            expect(fetchedProject).toHaveProperty("id");
            expect(fetchedProject).toHaveProperty("displayName");
            expect(fetchedProject).toHaveProperty("description");
            expect(fetchedProject).toHaveProperty("host");
            expect(fetchedProject).toHaveProperty("contracts");
            expect(fetchedProject).toHaveProperty("categories");
            expect(fetchedProject).toHaveProperty("icon");
            expect(fetchedProject).toHaveProperty("cover");

            expect(fetchedProject).toEqual(project);
        }
    });

    it("should return undefined for a non-existent project ID", () => {
        const fetchedProject = get("non-existent-id");
        expect(fetchedProject).toBeUndefined();
    });
});

describe("getByContract", () => {
    it("should return the correct project for a given contract address", () => {
        const contractAddress =
            "0x71faa7d6c3ddb081395574c5a6904f4458ff648b66e2123b877555d9ae0260e";
        const expectedProjectId = "myswap";

        const project = getProjectByContractAddress(contractAddress);
        expect(project).not.toBeUndefined();
        expect(project!.id).toEqual(expectedProjectId);
    });

    it("should return undefined for a non-existent contract address", () => {
        const nonExistentAddress = "0x0000001";
        const project = getProjectByContractAddress(nonExistentAddress);
        expect(project).toBeUndefined();
    });

    it("should handle addresses with leading zeros correctly", () => {
        const contractAddressWithLeadingZero =
            "0x018a439bcbb1b3535a6145c1dc9bc6366267d923f60a84bd0c7618f33c81d334";
        const expectedProjectId = "myswap";

        const project = getProjectByContractAddress(
            contractAddressWithLeadingZero
        );
        expect(project).not.toBeUndefined();
        expect(project!.id).toEqual(expectedProjectId);
    });
});

describe("formatError", () => {
    it("should throw an error if error message doesn't contain contract address", () => {
        expect(() =>
            formatError({
                error: "Without contract address",
                call: [],
            })
        ).toThrowError();
    });

    it("should throw an error if error message is empty", () => {
        expect(() =>
            formatError({
                error: "",
                call: [],
            })
        ).toThrowError();

        expect(() =>
            formatError({
                error: new Error(),
                call: [],
            })
        ).toThrowError();

        expect(() =>
            formatError({
                error: new Error(""),
                call: [],
            })
        ).toThrowError();
    });

    describe("should format the error as a project entrypoint error", () => {
        it("if a call with an entrypoint is passed and the error message matches the matcher", () => {
            expect(formatError(formatErrorTestData[0])).toEqual({
                protocol: "aspect",
                interface: ["erc721"],
                contractTag: "aspect_collection",
                address:
                    "0x3090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c",
                result: "Error message aspect_collection approve: Invocation went wrong",
            });
        });
    });

    describe("should format the error as a project default error", () => {
        it("if a call with an entrypoint is passed and the error message doesn't matches the entrypoint matcher and and error message matches with contract default matcher", () => {
            expect(formatError(formatErrorTestData[1])).toEqual({
                protocol: "aspect",
                interface: ["erc721"],
                contractTag: "aspect_collection",
                address:
                    "0x3090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c",
                result: "Error message aspect_collection default: Invocation went wrong",
            });
        });

        it("if a call with an entrypoint doesn't passed and error message matches with contract default matcher", () => {
            expect(formatError(formatErrorTestData[2])).toEqual({
                protocol: "aspect",
                interface: ["erc721"],
                contractTag: "aspect_collection",
                address:
                    "0x3090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c",
                result: "Error message aspect_collection default: Invocation went wrong",
            });
        });
    });

    describe("should format error as an interface entrypoint error", () => {
        it("if the error message doesn't match any project matcher, but the target contract has an interface and error message matches matcher", () => {
            expect(formatError(formatErrorTestData[3])).toEqual({
                protocol: "aspect",
                interface: ["erc721"],
                contractTag: "aspect_collection",
                address:
                    "0x3090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c",
                result: "Error message erc721 approve: Invocation went wrong",
            });
        });
    });

    // if the error message doesn't match any project matcher, but the target contract has an interface
    describe("should format error as an interface default error", () => {
        it("if call was passed but error message doesn't match entrypoint matcher and matches default matcher", () => {
            expect(formatError(formatErrorTestData[4])).toEqual({
                protocol: "aspect",
                interface: ["erc721"],
                contractTag: "aspect_collection",
                address:
                    "0x3090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c",
                result: "Error message erc721 default: Invocation went wrong",
            });
        });

        it("if call wasn't passed and error message matches to interface default matcher", () => {
            expect(formatError(formatErrorTestData[5])).toEqual({
                protocol: "aspect",
                interface: ["erc721"],
                contractTag: "aspect_collection",
                address:
                    "0x3090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c",
                result: "Error message erc721 default: Invocation went wrong",
            });
        });
    });

    describe("should format error as a default error", () => {
        it("if the address in the error doesn't belong to any of the projects", () => {
            expect(formatError(formatErrorTestData[6])).toEqual({
                protocol: undefined,
                interface: undefined,
                contractTag: undefined,
                address: "0x234535345345345",
                result: "Error message default: Invocation went wrong",
            });
        });

        it("if the address in the error belongs to project but error message doesn't matched either project and interface matchers", () => {
            expect(formatError(formatErrorTestData[7])).toEqual({
                protocol: "aspect",
                interface: ["erc721"],
                contractTag: "aspect_collection",
                address:
                    "0x3090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c",
                result: "Error message default: Invocation went wrong",
            });
        });
    });

    describe("should return an unprocessed message if the error message doesn't match any matcher", () => {
        it("if project was found but error message didn't match either project, interface or default matchers", () => {
            expect(formatError(formatErrorTestData[8])).toEqual({
                protocol: "aspect",
                interface: ["erc721"],
                contractTag: "aspect_collection",
                address:
                    "0x3090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c",
                result: "does not match any matcher\nError in the called contract (0x03090623ea32d932ca1236595076b00702e7d860696faf300ca9eb13bfe0a78c)\nError message: Invocation went wrong\n",
            });
        });
        it("if project wasn't found and error message didn't match default matchers", () => {
            expect(formatError(formatErrorTestData[9])).toEqual({
                protocol: undefined,
                interface: undefined,
                contractTag: undefined,
                address: "0x234535345345345",
                result: "does not match any matcher\nError in the called contract (0x234535345345345)\nError message: Invocation went wrong\n",
            });
        });
    });
});
