export default function (str: string) {
    str = str.replace(/\n/g, "\\n");
    const flags = str.replace(/.*\/([gimy]*)$/, "$1");
    const pattern = str.replace(new RegExp("^/(.*?)/" + flags + "$"), "$1");
    return new RegExp(pattern, flags);
}
