import BigNumber from "bignumber.js";
import type { Extractor } from "../types";
import stringToRegExp from "./stringToRegExp";
import { shortString } from "starknet";

export const normalizeAddress = (address: string) =>
    address.toLowerCase().replace(/^0x0*/, "0x");

export const formatByType = (
    value: string,
    type?: "string" | "address" | "hex" | "decimal" | "boolean"
): string => {
    let result = value;

    const assert = (val: boolean) => {
        if (!val) {
            throw new Error(
                `formatByType: unexpected value "${value}" for type "${type}"`
            );
        }
    };

    switch (type) {
        case "address":
            result = toHex(value);
            assert(isValidAddress(result));
            break;
        case "hex":
            result = toHex(value);
            assert(!result.toLowerCase().includes("nan"));
            break;
        case "decimal":
            result = toDecimal(value);
            assert(!result.toLowerCase().includes("nan"));
            break;
        case "boolean":
            result = `${Boolean(new BigNumber(value).toNumber())}`;
            assert(result === "true" || result === "false");
            break;
        default:
            if (result) {
                try {
                    if (/^\[0x[0-9a-fA-F]+(, 0x[0-9a-fA-F]+)*\]$/.test(value)) {
                        // do not parse via JSON.parse to avoid js precision/roundness issues
                        const asList = value
                            // remove brackets
                            .slice(1, -1)
                            .split(",")
                            .map(s => s.trim());
                        const isAsciiList = asList.every(s =>
                            shortString.isASCII(s)
                        );
                        if (isAsciiList) {
                            return asList
                                .map(s => shortString.decodeShortString(s))
                                .join(" ");
                        }
                    }

                    result = shortString.decodeShortString(value);
                } catch {
                    // ignore, just return original value
                }
            }
    }

    return result;
};

export const extractSubstring = (
    extractor: Extractor,
    content: string
): string => {
    const { matcher, type } = extractor;
    const regEx = stringToRegExp(matcher);
    const matchResult = content.match(regEx);
    const substring = matchResult?.[1] || "";
    return formatByType(substring, type);
};

export const isValidAddress = (address: string): boolean =>
    /^0x0*?[0-9a-fA-F]{1,64}$/.test(address);

export const toHex = (n: string | number | BigNumber) =>
    `0x${new BigNumber(n).toString(16)}`;

export const toDecimal = (n: string | number | BigNumber) =>
    new BigNumber(n).toFixed();
