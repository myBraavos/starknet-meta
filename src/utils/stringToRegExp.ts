export default function (str: string) {
    const patternEnd = str.lastIndexOf("/");
    const flags = str.substring(patternEnd + 1);
    const pattern = str.substring(1, patternEnd);
    return new RegExp(pattern, flags);
}
