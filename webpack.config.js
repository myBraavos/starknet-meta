// noinspection JSUnresolvedReference, JSUnusedGlobalSymbols

import path from "path";
import fs from "fs";

const __dirname = path.resolve();

class DeclarationPlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tap("DeclarationPlugin", () => {
            const srcPath = path.resolve(__dirname, "dist", "src");

            if (fs.existsSync(srcPath)) {
                fs.readdirSync(srcPath).forEach(file => {
                    fs.renameSync(
                        path.resolve(srcPath, file),
                        path.resolve(__dirname, "dist", file)
                    );
                });
            }

            fs.rmdirSync(srcPath, { recursive: true });
        });
    }
}

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
        publicPath: "",
    },
    resolve: {
        extensions: [".ts", ".js"],
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
    plugins: [new DeclarationPlugin()],
};
