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
                    const filepath = path.resolve(srcPath, file);
                    const newFilePath = path.resolve(__dirname, "dist", file);

                    if (file.endsWith(".d.ts")) {
                        // move files to dist folder
                        fs.renameSync(filepath, newFilePath);
                    } else if (
                        fs.lstatSync(path.resolve(srcPath, file)).isDirectory()
                    ) {
                        // move directories to dist folder
                        fs.cpSync(filepath, newFilePath, { recursive: true });
                        fs.rmdirSync(filepath, { recursive: true });
                    }
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
