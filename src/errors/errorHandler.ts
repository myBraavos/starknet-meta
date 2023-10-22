import { ErrorMatcher, ErrorMatchersMap, HandleErrorParams } from "../types";
import { defaultErrorsMap, errorsMap, interfaceErrorsMap } from "../parser";
import { combineHandlers, getErrorMessageFromMatcher } from "./utils";

export const processMatchers = (
    rawMessage: string,
    matchers: ErrorMatcher[]
) => {
    for (const matcher of matchers) {
        const res = getErrorMessageFromMatcher(matcher, rawMessage);
        if (res) {
            return res;
        }
    }
};

export const processEntrypointsMatchers = (
    rawMessage: string,
    entrypoints: string[],
    entrypointsErrorsMatchers: { [key: string]: ErrorMatcher[] }
) => {
    for (const entrypoint of entrypoints) {
        const entrypointMatchers = entrypointsErrorsMatchers[entrypoint];
        if (entrypointMatchers?.length) {
            const res = processMatchers(rawMessage, entrypointMatchers);
            if (res) {
                return res;
            }
        }
    }
};

export const processError = (
    rawMessage: string,
    errorMap: ErrorMatchersMap,
    entrypoints?: string[]
): string | undefined => {
    const { default: defaultErrorMatchers, ...entrypointsErrorsMatchers } =
        errorMap;

    if (Object.keys(entrypointsErrorsMatchers).length && entrypoints?.length) {
        const res = processEntrypointsMatchers(
            rawMessage,
            entrypoints,
            entrypointsErrorsMatchers
        );
        if (res) {
            return res;
        }
    }

    return processMatchers(rawMessage, defaultErrorMatchers);
};

export const prepareHandlerResponse = (
    params: HandleErrorParams,
    message?: string
): HandleErrorParams => ({
    ...params,
    context: { ...params.context, result: message },
});

export const handleProjectError = (
    params: HandleErrorParams
): HandleErrorParams => {
    const { context, errorMessage, calls } = params;

    // skip if either project or contract weren't found
    if (!context.protocol || !context.contractTag) {
        return params;
    }

    // map doesn't hold the project's tag
    const tagMatchersMap = errorsMap[context.protocol]?.[context.contractTag];
    if (!tagMatchersMap) {
        return params;
    }

    const entrypoints = calls.map(call => call.entrypoint);
    const tagResult = processError(errorMessage, tagMatchersMap, entrypoints);
    if (tagResult) {
        return prepareHandlerResponse(params, tagResult);
    }

    return params;
};

export const handleInterfaceError = (
    params: HandleErrorParams
): HandleErrorParams => {
    const { context, calls, errorMessage } = params;

    // skip if the contract does not implement any interface
    if (!context.interface?.length) {
        return params;
    }

    const entrypoints = calls.map(call => call.entrypoint);
    for (const implementedInterface of context.interface) {
        const interfaceMatchersMap =
            // @ts-ignore
            interfaceErrorsMap?.[implementedInterface as string];
        if (interfaceMatchersMap) {
            const res = processError(
                errorMessage,
                interfaceMatchersMap,
                entrypoints
            );
            if (res) {
                return prepareHandlerResponse(params, res);
            }
        }
    }

    return params;
};

export const handleDefaultError = (
    params: HandleErrorParams
): HandleErrorParams =>
    prepareHandlerResponse(
        params,
        processError(params.errorMessage, defaultErrorsMap)
    );

export const handleFallback = (params: HandleErrorParams): HandleErrorParams =>
    prepareHandlerResponse(params, params.errorMessage);

/*
    The handlers are called sequentially.
    Each of the handlers returns data of the same structure as received.
    If any of the handlers managed to match errorMessage and matcher,
    the others will skip the matching and return the received data.
    This allows you to add/remove/replace the order of the handlers as needed.
*/
export default combineHandlers([
    handleProjectError,
    handleInterfaceError,
    handleDefaultError,
    handleFallback,
]);
