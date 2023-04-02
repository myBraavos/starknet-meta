import path from "path";

const __dirname = path.resolve();

// noinspection JSUnusedGlobalSymbols
export default {
    mode: process.env.WEBPACK_MODE,
    entry: "./src/index.ts",
    experiments: {
        outputModule: true,
    },
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
        library: {
            type: "module",
        },
        globalObject: "this",
        clean: true,
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            fs: false,
            path: false,
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.json$/,
                type: "json",
            },
            {
                test: /\.(png|jpg|jpeg|svg|webp)$/,
                type: "asset/resource",
                generator: {
                    filename: "repository/[path][name][ext]",
                },
            },
        ],
    },
};
