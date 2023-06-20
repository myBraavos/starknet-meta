// @ts-nocheck
import {
    handleFallback,
    prepareHandlerResponse,
    processMatchers,
    processEntrypointsMatchers,
    processError,
    handleDefaultError,
    handleInterfaceError,
    handleProjectError,
} from "../src/errors/errorHandler";
import defaultErrorsMap from "./__mocks__/repository/errors-default.json";
import { interfaceErrorsMap, readErrors } from "../src/parser";
import * as errorHandler from "../src/errors/errorHandler";
import * as errorUtils from "../src/errors/utils";
import { ErrorMatcher } from "../src/types";

describe("handleProjectError", () => {
    let processErrorMock;

    beforeEach(() => {
        processErrorMock = jest.spyOn(errorHandler, "processError");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call processError with the correct parameters with calls and return the prepared response", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                protocol: "aspect",
                interface: ["erc721"],
                address: "0x987654321",
                contractTag: "aspect_operator",
            },
        };
        const contractTagErrorsMap = readErrors("aspect");

        processErrorMock.mockReturnValueOnce("Processed Error");
        const result = handleProjectError(params);

        expect(processErrorMock).toHaveBeenCalledTimes(1);
        expect(processErrorMock).toHaveBeenCalledWith(
            "Error occurred",
            contractTagErrorsMap["aspect_operator"],
            ["approve"]
        );
        expect(result).toEqual({
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                protocol: "aspect",
                interface: ["erc721"],
                address: "0x987654321",
                contractTag: "aspect_operator",
                result: "Processed Error",
            },
        });
    });

    it("should call processError with the correct parameters with empty calls array and return the prepared response", () => {
        const params = {
            calls: [],
            errorMessage: "Error occurred",
            context: {
                protocol: "aspect",
                interface: ["erc721"],
                address: "0x987654321",
                contractTag: "aspect_operator",
            },
        };
        const contractTagErrorsMap = readErrors("aspect");

        processErrorMock.mockReturnValueOnce("Processed Error");
        const result = handleProjectError(params);

        expect(processErrorMock).toHaveBeenCalledTimes(1);
        expect(processErrorMock).toHaveBeenCalledWith(
            "Error occurred",
            contractTagErrorsMap["aspect_operator"],
            []
        );
        expect(result).toEqual({
            calls: [],
            errorMessage: "Error occurred",
            context: {
                protocol: "aspect",
                interface: ["erc721"],
                address: "0x987654321",
                contractTag: "aspect_operator",
                result: "Processed Error",
            },
        });
    });

    it("should skip processing if params doesn't contain protocol", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                protocol: undefined,
                interface: ["erc721"],
                address: "0x987654321",
                contractTag: "aspect_operator",
            },
        };

        const result = handleProjectError(params);

        expect(processErrorMock).not.toHaveBeenCalled();
        expect(result).toEqual(params);
    });

    it("should skip processing if params doesn't contain contract tag", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                protocol: "aspect",
                interface: ["erc721"],
                address: "0x987654321",
                contractTag: undefined,
            },
        };

        const result = handleProjectError(params);

        expect(processErrorMock).not.toHaveBeenCalled();
        expect(result).toEqual(params);
    });

    it("should skip processing if errorsMap doesn't matchers for contract tag provided ", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                protocol: "aspect",
                interface: ["erc721"],
                address: "0x987654321",
                contractTag: "aspect_unknown",
            },
        };

        const result = handleProjectError(params);

        expect(processErrorMock).not.toHaveBeenCalled();
        expect(result).toEqual(params);
    });
});

describe("handleInterfaceError", () => {
    let processErrorMock;

    beforeEach(() => {
        processErrorMock = jest.spyOn(errorHandler, "processError");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call processError with the correct parameters and return the prepared response", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                message: undefined,
                protocol: "Protocol",
                interface: ["erc721"],
                address: "0x987654321",
                contractTag: "ContractTag",
            },
        };

        processErrorMock.mockReturnValueOnce("Processed Error");

        const result = handleInterfaceError(params);

        expect(processErrorMock).toHaveBeenCalledTimes(1);
        expect(processErrorMock).toHaveBeenCalledWith(
            "Error occurred",
            interfaceErrorsMap["erc721"],
            ["approve"]
        );
        expect(result).toEqual({
            ...params,
            context: {
                ...params.context,
                result: "Processed Error",
            },
        });
    });

    it("should call processError with the correct parameters for all interfaces and return the prepared response", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                message: undefined,
                protocol: "Protocol",
                interface: ["erc721", "erc20"],
                address: "0x987654321",
                contractTag: "ContractTag",
            },
        };

        processErrorMock.mockReturnValueOnce(undefined);
        processErrorMock.mockReturnValueOnce(undefined);

        const result = handleInterfaceError(params);

        expect(processErrorMock).toHaveBeenCalledTimes(2);
        expect(processErrorMock).toHaveBeenCalledWith(
            "Error occurred",
            interfaceErrorsMap["erc721"],
            ["approve"]
        );
        expect(result).toEqual({
            ...params,
            context: {
                ...params.context,
                result: undefined,
            },
        });
    });

    it("should skip processing if the contract implement interface that wasn't found in interfaceMatchersMap and return the params unchanged", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                protocol: "Protocol",
                interface: ["unknownInterface"],
                address: "0x987654321",
                contractTag: "ContractTag",
                result: "Result",
            },
        };

        const result = handleInterfaceError(params);

        expect(processErrorMock).not.toHaveBeenCalled();
        expect(result).toEqual(params);
    });

    it("should skip processing if the contract doesn't implement any interface and return the params unchanged", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                protocol: "Protocol",
                interface: [],
                address: "0x987654321",
                contractTag: "ContractTag",
                result: "Result",
            },
        };

        const result = handleInterfaceError(params);

        expect(processErrorMock).not.toHaveBeenCalled();
        expect(result).toEqual(params);
    });
});

describe("handleDefaultError", () => {
    let processErrorMock;

    beforeEach(() => {
        processErrorMock = jest.spyOn(errorHandler, "processError");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call processError with the correct parameters and return the prepared response", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress: "0x123456789",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                message: "",
                protocol: "Protocol",
                interface: ["Interface1", "Interface2"],
                address: "0x987654321",
                contractTag: "ContractTag",
            },
        };

        processErrorMock.mockReturnValueOnce("Processed Error");

        const result = handleDefaultError(params);

        expect(processErrorMock).toHaveBeenCalledTimes(1);
        expect(processErrorMock).toHaveBeenCalledWith(
            "Error occurred",
            defaultErrorsMap
        );

        expect(result).toEqual({
            ...params,
            context: {
                ...params.context,
                result: "Processed Error",
            },
        });
    });
});

describe("handleFallback", () => {
    it("should not update the context result if it exists", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                result: "Original message",
            },
        };

        // there is no point of checking handleFallback call directly
        const response = errorUtils.combineHandlers([handleFallback])(params);

        expect(response).toEqual({
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                result: "Original message",
            },
        });
    });

    it("should update the context result with the errorMessage if it doesn't exist", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {},
        };

        const response = handleFallback(params);

        expect(response).toEqual({
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                result: "Error occurred",
            },
        });
    });

    it("should return the original params if both context result and errorMessage are empty", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: undefined,
            context: {
                result: undefined,
            },
        };

        const response = handleFallback(params);

        expect(response).toEqual(params);
    });
});

describe("processError", () => {
    let processMatchersMock, processEntrypointsMatchersMock;

    beforeEach(() => {
        processMatchersMock = jest.spyOn(errorHandler, "processMatchers");
        processEntrypointsMatchersMock = jest.spyOn(
            errorHandler,
            "processEntrypointsMatchers"
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call processEntrypointsMatchers with the correct parameters if errorMap contains matchers and return the result", () => {
        const rawMessage = "Error occurred";
        const errorMap = {
            default: [
                {
                    matcher: "ErrorDefault",
                    message: "Default Error Message",
                    extractors: [],
                },
            ],
            entrypoint1: [
                {
                    matcher: "Error1",
                    message: "Error Message 1",
                    extractors: [],
                },
            ],
        };
        const entrypoints = ["entrypoint1"];

        processEntrypointsMatchersMock.mockReturnValueOnce("Error Result");

        const result = processError(rawMessage, errorMap, entrypoints);

        expect(processEntrypointsMatchersMock).toHaveBeenCalledTimes(1);
        expect(processEntrypointsMatchersMock).toHaveBeenCalledWith(
            "Error occurred",
            ["entrypoint1"],
            {
                entrypoint1: [
                    {
                        matcher: "Error1",
                        message: "Error Message 1",
                        extractors: [],
                    },
                ],
            }
        );
        expect(processMatchersMock).not.toHaveBeenCalled();
        expect(result).toBe("Error Result");
    });

    it("should call processMatchers with the correct parameters if only default matchers passed and return the result", () => {
        const rawMessage = "Error occurred";
        const errorMap = {
            default: [
                {
                    matcher: "ErrorDefault",
                    message: "Default Error Message",
                    extractors: [],
                },
            ],
        };
        const entrypoints: string[] = [];

        processMatchersMock.mockReturnValueOnce("Error Result");

        const result = processError(rawMessage, errorMap, entrypoints);

        expect(processEntrypointsMatchersMock).not.toHaveBeenCalled();
        expect(processMatchersMock).toHaveBeenCalledTimes(1);
        expect(processMatchersMock).toHaveBeenCalledWith("Error occurred", [
            {
                matcher: "ErrorDefault",
                message: "Default Error Message",
                extractors: [],
            },
        ]);
        expect(result).toBe("Error Result");
    });

    it("should call processMatchers with the correct parameters if message doesn't matched with entrypoint matchers and return the result", () => {
        const rawMessage = "Error occurred";
        const errorMap = {
            default: [
                {
                    matcher: "ErrorDefault",
                    message: "Default Error Message",
                    extractors: [],
                },
            ],
            entrypoint1: [
                {
                    matcher: "Error1",
                    message: "Error Message 1",
                    extractors: [],
                },
            ],
        };
        const entrypoints = ["entrypoint1"];
        processEntrypointsMatchersMock.mockReturnValueOnce(undefined);
        processMatchersMock.mockReturnValueOnce("Error Result");

        const result = processError(rawMessage, errorMap, entrypoints);

        expect(processEntrypointsMatchersMock).toHaveBeenCalledTimes(1);
        expect(processMatchersMock).toHaveBeenCalledTimes(1);
        expect(processMatchersMock).toHaveBeenCalledWith("Error occurred", [
            {
                matcher: "ErrorDefault",
                message: "Default Error Message",
                extractors: [],
            },
        ]);
        expect(result).toBe("Error Result");
    });

    it("should return undefined if no match is found", () => {
        const rawMessage = "Error occurred";
        const errorMap = {
            default: [
                {
                    matcher: "ErrorDefault",
                    message: "Default Error Message",
                    extractors: [],
                },
            ],
        };
        const entrypoints: string[] = [];

        processMatchersMock.mockReturnValueOnce(undefined);

        const result = processError(rawMessage, errorMap, entrypoints);

        expect(processMatchersMock).toHaveBeenCalledTimes(1);
        expect(processMatchersMock).toHaveBeenCalledWith("Error occurred", [
            {
                matcher: "ErrorDefault",
                message: "Default Error Message",
                extractors: [],
            },
        ]);
        expect(result).toBeUndefined();
    });
});

describe("processEntrypointsMatchers", () => {
    let processMatchersMock;

    beforeEach(() => {
        processMatchersMock = jest.spyOn(errorHandler, "processMatchers");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should call processMatchers with the correct parameters and return the result", () => {
        const rawMessage = "Error occurred";
        const entrypoints = ["entrypoint1", "entrypoint2"];
        const entrypointsErrorsMatchers = {
            entrypoint1: [
                {
                    matcher: "Error1",
                    message: "Error Message 1",
                    extractors: [],
                },
            ],
            entrypoint2: [
                {
                    matcher: "Error2",
                    message: "Error Message 2",
                    extractors: [],
                },
            ],
        };

        processMatchersMock
            .mockReturnValueOnce(undefined)
            .mockReturnValueOnce("Error Result");

        const result = processEntrypointsMatchers(
            rawMessage,
            entrypoints,
            entrypointsErrorsMatchers
        );

        expect(processMatchersMock).toHaveBeenCalledTimes(2);
        expect(processMatchersMock).toHaveBeenNthCalledWith(
            1,
            "Error occurred",
            [
                {
                    matcher: "Error1",
                    message: "Error Message 1",
                    extractors: [],
                },
            ]
        );
        expect(processMatchersMock).toHaveBeenNthCalledWith(
            2,
            "Error occurred",
            [
                {
                    matcher: "Error2",
                    message: "Error Message 2",
                    extractors: [],
                },
            ]
        );
        expect(result).toBe("Error Result");
    });

    it("should return undefined if no match is found", () => {
        const rawMessage = "Error occurred";
        const entrypoints = ["entrypoint1"];
        const entrypointsErrorsMatchers = {
            entrypoint1: [
                {
                    matcher: "Error1",
                    message: "Error Message 1",
                    extractors: [],
                },
            ],
        };

        processMatchersMock.mockReturnValueOnce(undefined);

        const result = processEntrypointsMatchers(
            rawMessage,
            entrypoints,
            entrypointsErrorsMatchers
        );

        expect(processMatchersMock).toHaveBeenCalledTimes(1);
        expect(processMatchersMock).toHaveBeenCalledWith("Error occurred", [
            {
                matcher: "Error1",
                message: "Error Message 1",
                extractors: [],
            },
        ]);
        expect(result).toBeUndefined();
    });

    it("should return undefined if no entrypoints matchers are provided", () => {
        const rawMessage = "Error occurred";
        const entrypoints: string[] = [];
        const entrypointsErrorsMatchers: { [key: string]: ErrorMatcher[] } = {};

        const result = processEntrypointsMatchers(
            rawMessage,
            entrypoints,
            entrypointsErrorsMatchers
        );

        expect(processMatchers).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });
});

describe("processMatchers", () => {
    let getErrorMessageFromMatcherMock;

    beforeEach(() => {
        getErrorMessageFromMatcherMock = jest.spyOn(
            errorUtils,
            "getErrorMessageFromMatcher"
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should call getErrorMessageFromMatcher with the correct parameters", () => {
        const rawMessage = "Error occurred";
        const matchers = [
            {
                matcher: "/Error/",
                message: "Error Message",
                extractors: [],
            },
        ];

        processMatchers(rawMessage, matchers);
        expect(getErrorMessageFromMatcherMock).toBeCalledTimes(1);
        expect(getErrorMessageFromMatcherMock).toHaveBeenCalledWith(
            {
                matcher: "/Error/",
                message: "Error Message",
                extractors: [],
            },
            "Error occurred"
        );
    });

    it("should call getErrorMessageFromMatcher for all matchers if message doesn't match any matcher", () => {
        getErrorMessageFromMatcherMock.mockImplementation(() => undefined);
        const rawMessage = "Error occurred";
        const matchers = [
            {
                matcher: "/Error/",
                message: "Error Message",
                extractors: [],
            },
            {
                matcher: "/Error/",
                message: "Error Message",
                extractors: [],
            },
        ];

        processMatchers(rawMessage, matchers);
        expect(getErrorMessageFromMatcherMock).toBeCalledTimes(2);
    });

    it("should call getErrorMessageFromMatcher before massage matched matcher", () => {
        getErrorMessageFromMatcherMock.mockImplementationOnce(() => undefined);
        getErrorMessageFromMatcherMock.mockImplementation(() => "result");
        const rawMessage = "Error occurred";
        const matchers = [
            {
                matcher: "/Error/",
                message: "Error Message",
                extractors: [],
            },
            {
                matcher: "/Error/",
                message: "Error Message",
                extractors: [],
            },
            {
                matcher: "/Error/",
                message: "Error Message",
                extractors: [],
            },
        ];

        processMatchers(rawMessage, matchers);
        expect(getErrorMessageFromMatcherMock).toBeCalledTimes(2);
    });

    it("return the result of getErrorMessageFromMatcher function", () => {
        getErrorMessageFromMatcherMock.mockImplementation(
            () => "Error Message"
        );
        const rawMessage = "Error occurred";
        const matchers = [
            {
                matcher: "/Error/",
                message: "Error Message",
                extractors: [],
            },
        ];

        const result = processMatchers(rawMessage, matchers);
        expect(result).toBe("Error Message");
    });
});

describe("prepareHandlerResponse", () => {
    it("should update the message in the context", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                result: "Original message",
                protocol: "Some protocol",
                interface: ["Interface 1", "Interface 2"],
                address: "0x123456789",
                contractTag: "Contract Tag",
            },
        };

        const response = prepareHandlerResponse(params, "New error message");

        expect(response).toEqual({
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                result: "New error message",
                protocol: "Some protocol",
                interface: ["Interface 1", "Interface 2"],
                address: "0x123456789",
                contractTag: "Contract Tag",
            },
        });
    });

    it("should create a new context if it doesn't exist", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
        };

        const response = prepareHandlerResponse(params, "New error message");

        expect(response).toEqual({
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                result: "New error message",
            },
        });
    });

    it("should return the original params if no message is provided", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                message: undefined,
            },
        };

        const response = prepareHandlerResponse(params);

        expect(response).toEqual(params);
    });

    it("should not mutate the original params object", () => {
        const params = {
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                message: "Original message",
                protocol: "Some protocol",
                interface: ["Interface 1", "Interface 2"],
                address: "0x123456789",
                contractTag: "Contract Tag",
            },
        };

        const response = prepareHandlerResponse(params, "New error message");

        expect(params).toEqual({
            calls: [
                {
                    entrypoint: "approve",
                    contractAddress:
                        "0x37c320cf53f24747cb6afd1c23d0bf9ca33dcf8840764df11f8f8c8c0cd685c",
                    calldata: [],
                },
            ],
            errorMessage: "Error occurred",
            context: {
                message: "Original message",
                protocol: "Some protocol",
                interface: ["Interface 1", "Interface 2"],
                address: "0x123456789",
                contractTag: "Contract Tag",
            },
        });
        expect(response).not.toBe(params);
        expect(response.context).not.toBe(params.context);
    });
});
