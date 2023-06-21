import { Call, ErrorMatcher, HandleErrorParams } from "../types";
import stringToRegExp from "../utils/stringToRegExp";
import { extractSubstring, normalizeAddress } from "../utils";

const CONTRACT_MATCHER = /Error in the called contract \(([^\n]*)\)/g;

export const extractErrorTargetContract = (
    rawMessage: string
): string | undefined => {
    const matches = Array.from(rawMessage.matchAll(CONTRACT_MATCHER));
    const lastContractAddress =
        matches.length > 0 ? matches[matches.length - 1][1].trim() : undefined;
    return lastContractAddress
        ? normalizeAddress(lastContractAddress)
        : undefined;
};

export const substitutePlaceholders = (
    extractedSubstrings: string[],
    message: string
) =>
    message.replace(/\{\{(\d+)\}\}/g, (match, index) => {
        const value = extractedSubstrings[parseInt(index)];
        return value !== undefined ? value : match;
    });

export function getErrorMessageFromMatcher(
    errorMatcher: ErrorMatcher,
    rawMessage: string
): string | null {
    const { matcher, message, extractors } = errorMatcher;
    const regEx = stringToRegExp(matcher);
    if (!regEx?.test(rawMessage)) {
        return null;
    }
    if (!extractors || !extractors.length) {
        return message;
    }
    const extractedSubstrings = extractors.map(extractor =>
        extractSubstring(extractor, rawMessage)
    );
    return substitutePlaceholders(extractedSubstrings, message);
}

export const combineHandlers =
    (handlers: Array<(params: HandleErrorParams) => HandleErrorParams>) =>
    (initialParams: HandleErrorParams): HandleErrorParams =>
        handlers.reduce(
            (params, handler) =>
                typeof params?.context?.result !== "undefined"
                    ? params
                    : handler(params),
            {
                ...initialParams,
            }
        );

export const filterCallsByAddress = (calls: Call[], address: string) =>
    calls.filter(call => normalizeAddress(call.contractAddress) === address);
