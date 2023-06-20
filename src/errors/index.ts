import {
    FormatErrorParams,
    FormatErrorResponse,
    HandleErrorContext,
} from "../types";
import { extractErrorTargetContract, filterCallsByAddress } from "./utils";
import { getContractByAddress } from "../index";
import errorHandler from "./errorHandler";

export function formatError(params: FormatErrorParams): FormatErrorResponse {
    const { error, call } = params;

    const calls = !call || Array.isArray(call) ? call || [] : [call];

    const errorMessage: string = (error as Error)?.message ?? error;
    if (!errorMessage) {
        throw new Error("Invalid error message");
    }

    const address = extractErrorTargetContract(errorMessage);
    if (!address) {
        throw new Error("Error is missing a contract address");
    }

    // Filter the calls, leaving only those that relate to the contract
    // whose address is found in the error
    const contractCalls = filterCallsByAddress(calls, address);

    const { contract, project } = getContractByAddress(address) ?? {};
    const context: HandleErrorContext = {
        protocol: project?.id,
        interface: contract?.implements,
        contractTag: contract?.tag,
        address,
    };

    const { context: res } = errorHandler({
        errorMessage,
        calls: contractCalls,
        context,
    });

    return {
        result: res.result,
        protocol: res.protocol,
        interface: res.interface,
    } as FormatErrorResponse;
}
