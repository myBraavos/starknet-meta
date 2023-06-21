// @ts-nocheck
import {
    extractSubstring,
    formatByType,
    isValidAddress,
    normalizeAddress,
    toHex,
} from "../src/utils";
import {
    combineHandlers,
    extractErrorTargetContract,
    filterCallsByAddress,
    getErrorMessageFromMatcher,
    substitutePlaceholders,
} from "../src/errors/utils";
import { ErrorMatcher, Extractor } from "../src/types";

describe("extractErrorTargetContract", () => {
    it("should extract the contract address from the error message", () => {
        const errorMessage = `
      Error in the called contract (0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d):
      Error at pc=0:15:
      Got an exception while executing a hint.
      Cairo traceback (most recent call last):
      Unknown location (pc=0:495)
      Unknown location (pc=0:481)
    `;
        const contractAddress = extractErrorTargetContract(errorMessage);
        expect(contractAddress).toBe(
            "0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d"
        );
    });

    it("should extract the last contract address from multiple error messages", () => {
        const errorMessage = `
      Error in the called contract (0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d):
      Error message: OrderTracker: order is not tradable
      Error at pc=0:1862:
      An ASSERT_EQ instruction failed: 1 != 0.
      Cairo traceback (most recent call last):
      Unknown location (pc=0:2389)
      Unknown location (pc=0:2345)
      Unknown location (pc=0:2058)
      Error in the called contract (0x5a5cebbde15d02f54e4b70f5f0dd56ad741a6c3c):
      Error at pc=0:123:
      Some error message.
      Cairo traceback (most recent call last):
      Unknown location (pc=0:456)
      Unknown location (pc=0:789)
    `;
        const contractAddress = extractErrorTargetContract(errorMessage);
        expect(contractAddress).toBe(
            "0x5a5cebbde15d02f54e4b70f5f0dd56ad741a6c3c"
        );
    });

    it("should return undefined if no contract address is found", () => {
        const errorMessage = "Error message: Some error occurred";
        const contractAddress = extractErrorTargetContract(errorMessage);
        expect(contractAddress).toBeUndefined();
    });

    it("should normalize the extracted contract address", () => {
        const errorMessage = `
      Error in the called contract (0x002a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d):
      Error at pc=0:15:
      Got an exception while executing a hint.
      Cairo traceback (most recent call last):
      Unknown location (pc=0:495)
      Unknown location (pc=0:481)
    `;
        const contractAddress = extractErrorTargetContract(errorMessage);
        expect(contractAddress).toBe(
            "0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d"
        );
    });
});

describe("substitutePlaceholders", () => {
    it("should substitute placeholders with extracted substrings", () => {
        const extractedSubstrings = ["one", "two"];
        const message = "{{0}} some text {{1}}";
        const result = substitutePlaceholders(extractedSubstrings, message);
        expect(result).toBe("one some text two");
    });

    it("should handle missing extracted substrings gracefully", () => {
        const extractedSubstrings = ["one"];
        const message = "{{0}} some text {{1}}";
        const result = substitutePlaceholders(extractedSubstrings, message);
        expect(result).toBe("one some text {{1}}");
    });

    it("should handle duplicate placeholders", () => {
        const extractedSubstrings = ["first", "second", "third"];
        const message = "{{0}} {{1}} {{2}} {{1}}";
        const result = substitutePlaceholders(extractedSubstrings, message);
        expect(result).toBe("first second third second");
    });

    it("should handle multiple placeholders in a row", () => {
        const extractedSubstrings = ["one", "two", "three"];
        const message = "{{0}}{{1}}{{2}}";
        const result = substitutePlaceholders(extractedSubstrings, message);
        expect(result).toBe("onetwothree");
    });
});

describe("normalizeAddress", () => {
    it("should lowercase and remove leading zeros from the address", () => {
        const address =
            "0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d";
        const normalized = normalizeAddress(address);
        expect(normalized).toBe(
            "0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d"
        );
    });

    it("should normalize addresses with leading zeros", () => {
        const address = "0x00000abcde000000";
        const normalized = normalizeAddress(address);
        expect(normalized).toBe("0xabcde000000");
    });

    it("should not modify addresses without leading zeros", () => {
        const address = "0xabcdef1234567890";
        const normalized = normalizeAddress(address);
        expect(normalized).toBe(address);
    });
});

describe("getErrorMessageFromMatcher", () => {
    const errorMatcher: ErrorMatcher = {
        matcher: "/Error message: (.*)\\n/",
        message: "Something went wrong: {{0}}",
        extractors: [
            {
                matcher: "/Error code: (\\d+)/",
                type: "decimal",
            },
        ],
    };

    it("should return the formatted error message when the matcher matches and extractors are provided", () => {
        const errorMatcher: ErrorMatcher = {
            matcher: "/Error message: (.*)\\n/",
            message: "Something went wrong: {{0}}",
            extractors: [
                {
                    matcher: "/Error code: (\\d+)/",
                    type: "decimal",
                },
            ],
        };
        const rawMessage =
            "Error message: Something went wrong\nError code: 500\n";
        const errorMessage = getErrorMessageFromMatcher(
            errorMatcher,
            rawMessage
        );
        expect(errorMessage).toBe("Something went wrong: 500");
    });

    it("should return the default error message when the matcher matches but no extractors are provided", () => {
        const errorMatcher = {
            matcher: "/Error message: (.*)\\n/",
            message: "Something went wrong: {{0}}",
        };
        const rawMessage = "Error message: Something went wrong\n";
        const errorMessage = getErrorMessageFromMatcher(
            errorMatcher,
            rawMessage
        );
        expect(errorMessage).toBe("Something went wrong: {{0}}");
    });

    it("should return null when the matcher does not match", () => {
        const rawMessage = "Invalid input\n";
        const errorMessage = getErrorMessageFromMatcher(
            errorMatcher,
            rawMessage
        );
        expect(errorMessage).toBeNull();
    });

    it("should handle multiple extractors and placeholders in the message", () => {
        const customErrorMatcher: ErrorMatcher = {
            matcher: "/Error: (.*)\\n/",
            message: "Error occurred: {{0}} (Code: {{1}})",
            extractors: [
                {
                    matcher: "/Error: (.*)\\n/",
                    type: "string",
                },
                {
                    matcher: "/Code: (\\d+)/",
                    type: "decimal",
                },
            ],
        };
        const rawMessage = "Error: Something went wrong\nCode: 500\n";
        const errorMessage = getErrorMessageFromMatcher(
            customErrorMatcher,
            rawMessage
        );
        expect(errorMessage).toBe(
            "Error occurred: Something went wrong (Code: 500)"
        );
    });

    it("should handle multiple extractors and placeholders in the message", () => {
        const customErrorMatcher: ErrorMatcher = {
            matcher: "/Error: (.*)\\n/",
            message: "Error occurred: {{0}} (Code: {{1}})",
            extractors: [
                {
                    matcher: "/Error: (.*)\\n/",
                    type: "string",
                },
                {
                    matcher: "/Code: (\\d+)/",
                    type: "decimal",
                },
            ],
        };
        const rawMessage = "Error: Something went wrong\nCode: 500\n";
        const errorMessage = getErrorMessageFromMatcher(
            customErrorMatcher,
            rawMessage
        );
        expect(errorMessage).toBe(
            "Error occurred: Something went wrong (Code: 500)"
        );
    });
});

describe("extractSubstring", () => {
    const extractor: Extractor = {
        matcher: "/Error message: (.*)\\n/",
        type: "string",
    };

    it("should return an empty string if no substring is found", () => {
        const rawMessage = "Error: Invalid input\n";
        const extractedSubstring = extractSubstring(extractor, rawMessage);
        expect(extractedSubstring).toBe("");
    });

    it("should handle special characters in the substring", () => {
        const rawMessage = "Error message: Error \\n Special characters\n";
        const extractedSubstring = extractSubstring(extractor, rawMessage);
        expect(extractedSubstring).toBe("Error \\n Special characters");
    });

    it("should handle special characters in the substring", () => {
        const rawMessage = "Error message: Error \\n Special characters\n";
        const extractedSubstring = extractSubstring(extractor, rawMessage);
        expect(extractedSubstring).toBe("Error \\n Special characters");
    });

    it("should extract and format the substring based on the given extractor (boolean type)", () => {
        const rawMessage = "Error message: 1\n";
        const extractor: Extractor = {
            matcher: "/Error message: (.*)\\n/",
            type: "boolean",
        };
        const extractedSubstring = extractSubstring(extractor, rawMessage);
        expect(extractedSubstring).toBe("true");
    });

    it("should extract and format the substring based on the given extractor (string type)", () => {
        const extractor: Extractor = {
            matcher: "/Error message: (.*)\\n/",
            type: "string",
        };
        const rawMessage = "Error message: Something went wrong\n";
        const extractedSubstring = extractSubstring(extractor, rawMessage);
        expect(extractedSubstring).toBe("Something went wrong");
    });

    it("should extract and format the substring based on the given extractor (decimal type)", () => {
        const extractor: Extractor = {
            matcher: "/Error code: (\\d+)/",
            type: "decimal",
        };
        const rawMessage = "Error code: 500\n";
        const extractedSubstring = extractSubstring(extractor, rawMessage);
        expect(extractedSubstring).toBe("500");
    });

    it("should extract and format the substring based on the given extractor (address type)", () => {
        const extractor: Extractor = {
            matcher: "/Contract address: (0x[0-9a-fA-F]{40})/",
            type: "address",
        };
        const rawMessage =
            "Contract address: 0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e\n";
        const extractedSubstring = extractSubstring(extractor, rawMessage);
        expect(extractedSubstring).toBe(
            "0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e"
        );
    });
});

describe("filterCalls", () => {
    const calls = [
        {
            contractAddress:
                "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
            entrypoint: "approve",
            calldata: [],
        },
        {
            contractAddress:
                "0x05841326c67a6806308d60c74d69e8a6895a254689f2e01a2f3c133e6ce733c5",
            entrypoint: "transfer",
            calldata: [],
        },
        {
            contractAddress:
                "0x006fcf30a53fdc33c85ab428d6c481c5d241f1de403009c4e5b66aeaf3edc890",
            entrypoint: "mint",
            calldata: [],
        },
    ];

    it("should filter calls based on the contract address", () => {
        const address =
            "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c";
        const filteredCalls = filterCallsByAddress(calls, address);
        expect(filteredCalls).toEqual([
            {
                contractAddress:
                    "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                entrypoint: "approve",
                calldata: [],
            },
        ]);
    });

    it("should return an empty array if no calls match the contract address", () => {
        const address = "0x1234567890abcdef";
        const filteredCalls = filterCallsByAddress(calls, address);
        expect(filteredCalls).toEqual([]);
    });

    it("should filter calls when contract address with leading zeroes passed", () => {
        const address =
            "0x6fcf30a53fdc33c85ab428d6c481c5d241f1de403009c4e5b66aeaf3edc890";
        const filteredCalls = filterCallsByAddress(calls, address);
        expect(filteredCalls).toEqual([
            {
                contractAddress:
                    "0x006fcf30a53fdc33c85ab428d6c481c5d241f1de403009c4e5b66aeaf3edc890",
                entrypoint: "mint",
                calldata: [],
            },
        ]);
    });
});

describe("isValidAddress", () => {
    it("should return true for valid addresses", () => {
        const validAddresses = [
            "0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d",
            "0x002a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d",
            "0x0123456789abcdef",
            "0xABCDEF",
            "0xAbCdEf",
        ];
        validAddresses.forEach(address => {
            expect(isValidAddress(address)).toBe(true);
        });
    });

    it("should return false for invalid addresses", () => {
        const invalidAddresses = [
            "0x",
            "123456789abcdefg",
            "0xtyui",
            "0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d2324",
        ];
        invalidAddresses.forEach(address => {
            expect(isValidAddress(address)).toBe(false);
        });
    });
});

describe("numberToHex", () => {
    it("should convert number to hexadecimal string", () => {
        const numbers = [0, 255, "255", "0x7b"];
        const expectedHexStrings = ["0x0", "0xff", "0xff", "0x7b"];
        numbers.forEach((number, index) => {
            expect(toHex(number)).toBe(expectedHexStrings[index]);
        });
    });
});

describe("formatByType", () => {
    it("should return the raw value as is for empty or unknown type", () => {
        const value = "some value";
        expect(formatByType(value)).toBe(value);
        // @ts-ignore
        expect(formatByType(value, "foo")).toBe(value);
    });

    it("should format correct address for type 'string'", () => {
        const value = "some value";
        const result = formatByType(value, "string");
        expect(result).toBe(value);
    });

    it("should format correct address for type 'address'", () => {
        const address =
            "0x002a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d";
        const result = formatByType(address, "address");
        expect(result).toBe(
            "0x2a92f0f860bf7c63fb9ef42cff4137006b309e0e6e1484e42d0b5511959414d"
        );
    });

    it("should throw an error for invalid input with type 'address'", () => {
        const address = "random string";
        expect(() => formatByType(address, "address")).toThrowError();
    });

    it("should convert value to hexadecimal for type 'hex'", () => {
        const value = "255";
        const result = formatByType(value, "hex");
        expect(result).toBe("0xff");
    });

    it("should throw an error for invalid input for type 'hex'", () => {
        const value = "random string";
        expect(() => formatByType(value, "hex")).toThrowError();
    });

    it("should convert value to decimal string for type 'decimal'", () => {
        expect(formatByType("123", "decimal")).toBe("123");
        expect(formatByType("123.234", "decimal")).toBe("123.234");
    });

    it("should convert hex value to decimal string for type 'decimal'", () => {
        expect(formatByType("0xaf45", "decimal")).toBe("44869");
        expect(formatByType("0x000af45", "decimal")).toBe("44869");
    });

    it("should throw an error for invalid input for type 'decimal'", () => {
        expect(() => formatByType("random string", "decimal")).toThrowError();
    });

    it("should convert value to boolean string for type 'boolean'", () => {
        const trueValue = "1";
        const falseValue = "0";

        expect(formatByType(trueValue, "boolean")).toBe("true");
        expect(formatByType(falseValue, "boolean")).toBe("false");
    });
});

describe("combineHandlers", () => {
    it("should apply all handlers to the params in the correct order", () => {
        const handlers = [
            params => ({ ...params, value: params.value.toUpperCase() }),
            params => ({ ...params, value: params.value + " World" }),
            params => ({ ...params, count: params.count * 2 }),
        ];

        const combinedHandler = combineHandlers(handlers);

        const params = { value: "Hello", count: 5 };
        // @ts-ignore
        const result = combinedHandler(params);

        expect(result).toEqual({ value: "HELLO World", count: 10 });
    });

    it("should return the original params if no handlers are provided", () => {
        const combinedHandler = combineHandlers([]);

        const params = { value: "Hello", count: 5 };
        // @ts-ignore
        const result = combinedHandler(params);

        expect(result).toEqual({ value: "Hello", count: 5 });
    });

    it("should not mutate the original params object", () => {
        const handlers = [
            params => ({ ...params, value: params.value.toUpperCase() }),
        ];

        const combinedHandler = combineHandlers(handlers);

        const params = { value: "Hello", count: 5 };
        // @ts-ignore
        const result = combinedHandler(params);

        expect(params).toEqual({ value: "Hello", count: 5 });
        expect(result).not.toBe(params);
    });

    it("should skip handlers if context.result value was set", () => {
        const handlers = [
            params => ({
                ...params,
                context: { result: "Set by first handler" },
            }),
            params => ({
                ...params,
                context: { result: "Set by second handler" },
            }),
            params => ({
                ...params,
                context: { result: "Set by third handler" },
            }),
        ];

        const combinedHandler = combineHandlers(handlers);
        const params = { value: "Hello" };

        const result = combinedHandler(params);
        expect(result).toEqual({
            value: "Hello",
            context: { result: "Set by first handler" },
        });
    });
});
