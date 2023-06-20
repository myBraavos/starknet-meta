import stringToRegExp from "../src/utils/stringToRegExp";

describe("stringToRegExp", () => {
    it("should convert string representation of regex to RegExp object", () => {
        const regexStr = "/Error message: (.*)\n/g";
        const regexObj = stringToRegExp(regexStr);
        expect(regexObj).toBeInstanceOf(RegExp);
        expect(regexObj.source).toBe("Error message: (.*)\\n");
        expect(regexObj.flags).toBe("g");
    });

    it("should handle regex with multiple flags", () => {
        const regexStr = "/[A-Z]+/gim";
        const regexObj = stringToRegExp(regexStr);
        expect(regexObj.source).toBe("[A-Z]+");
        expect(regexObj.flags).toBe("gim");
    });

    it("should handle regex without flags", () => {
        const regexStr = "/\\d{3}-\\d{3}-\\d{4}/";
        const regexObj = stringToRegExp(regexStr);
        expect(regexObj.source).toBe("\\d{3}-\\d{3}-\\d{4}");
        expect(regexObj.flags).toBe("");
    });

    it("should handle regex with escaped characters", () => {
        const regexStr = "/\\[.*\\]/g";
        const regexObj = stringToRegExp(regexStr);
        expect(regexObj.source).toBe("\\[.*\\]");
        expect(regexObj.flags).toBe("g");
    });

    it("should throw an error for invalid regex string", () => {
        expect(() => {
            const regexStr = "/Invalid regex";
            stringToRegExp(regexStr);
        }).toThrow();

        expect(() => {
            const regexStr = "/([A-Z]+";
            stringToRegExp(regexStr);
        }).toThrow();

        expect(() => {
            const regexStr = "Not a regex";
            stringToRegExp(regexStr);
        }).toThrowError();
    });
});
