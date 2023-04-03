import { get, getByContract, list } from "../src";

describe("list", () => {
    it("should return an array of projects", () => {
        const projects = list();
        expect(projects).toBeInstanceOf(Array);
        expect(projects.length).toBeGreaterThan(0);
    });

    it("should return projects with valid metadata, icon, and cover", () => {
        const projects = list();
        for (const project of projects) {
            expect(project.metadata).toHaveProperty("id");
            expect(project.metadata).toHaveProperty("displayName");
            expect(project.metadata).toHaveProperty("description");
            expect(project.metadata).toHaveProperty("host");
            expect(project.metadata).toHaveProperty("contracts");
            expect(project.metadata).toHaveProperty("categories");

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
            const fetchedProject = get(project.metadata.id)!;

            expect(fetchedProject).not.toBeUndefined();
            expect(fetchedProject).toHaveProperty("metadata");
            expect(fetchedProject).toHaveProperty("icon");
            expect(fetchedProject).toHaveProperty("cover");

            expect(fetchedProject.metadata).toEqual(project.metadata);
            expect(fetchedProject.icon).toEqual(project.icon);
            expect(fetchedProject.cover).toEqual(project.cover);
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

        const project = getByContract(contractAddress);
        expect(project).not.toBeUndefined();
        expect(project!.metadata.id).toEqual(expectedProjectId);
    });

    it("should return undefined for a non-existent contract address", () => {
        const nonExistentAddress = "0x0000001";
        const project = getByContract(nonExistentAddress);
        expect(project).toBeUndefined();
    });

    it("should handle addresses with leading zeros correctly", () => {
        const contractAddressWithLeadingZero =
            "0x018a439bcbb1b3535a6145c1dc9bc6366267d923f60a84bd0c7618f33c81d334";
        const expectedProjectId = "myswap";

        const project = getByContract(contractAddressWithLeadingZero);
        expect(project).not.toBeUndefined();
        expect(project!.metadata.id).toEqual(expectedProjectId);
    });
});
