import { get, list } from "../src";

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

            expect(fetchedProject).not.toBeNull();
            expect(fetchedProject).toHaveProperty("metadata");
            expect(fetchedProject).toHaveProperty("icon");
            expect(fetchedProject).toHaveProperty("cover");

            expect(fetchedProject.metadata).toEqual(project.metadata);
            expect(fetchedProject.icon).toEqual(project.icon);
            expect(fetchedProject.cover).toEqual(project.cover);
        }
    });

    it("should return null for a non-existent project ID", () => {
        const fetchedProject = get("non-existent-id");
        expect(fetchedProject).toBeUndefined();
    });
});
