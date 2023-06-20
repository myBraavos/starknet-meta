# starknet-meta
Starknet dApps metadata repository.

## Goals
🔍 **API-first metadata repository:** Prioritize seamless integration of Starknet dApp metadata, assets, and textual data for developers.

🌟 **Reliable dApp assets and metadata resource:** Provide a reliable source for both dApp textual metadata and common visual assets, catering to developers' needs.

🌉 **Contract addresses repository:** Offer a dependable resource for dApp contract addresses across Starknet networks.

## 🛠️ Use Cases
📝 **Contract address validation for protocols:** Enable protocols to verify which contracts are associated with a dApp.

🌎 **API-first dApp discovery:** Enable dApp aggregators to efficiently find, list, and showcase new dApps in the Starknet ecosystem using an API-first approach.

## How to submit a new project
To add a new dApp to starknet-meta, follow these steps:

1. Fork the `starknet-meta` repository.
2. Create a new folder under the `/repository` directory, using the desired `id` for the new project as the folder name.
3. Add a `metadata.json` file to the new folder, following the JSON schema rules described below (you can easily validate your changes by executing `validator.js`).
4. Add an `icon` image file to the new folder. The icon must be square and up to 1 MB in size. Supported formats are PNG, JPEG, SVG, and WebP.
5. Add a `cover` image file to the new folder. The cover image must be up to 1500x500px in size and have a 0.33 aspect ratio. Supported formats are PNG, JPEG, SVG, and WebP.
6. Create a pull request to the `starknet-meta` repository with your changes.

## JSON schema rules
| Property    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Example                                                                                                                                                                                                                                                                                                  |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| id          | A unique string identifier for the project                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `"my_project"`                                                                                                                                                                                                                                                                                           |
| displayName | A string containing the project's display name (up to 50 characters, ASCII only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"My Project"`                                                                                                                                                                                                                                                                                           |
| description | A string containing the project's description (up to 300 characters, ASCII only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"This is a description of my project."`                                                                                                                                                                                                                                                                 |
| host        | A string containing a valid URL host name (one URL for all supported networks),<br/>or an object with network-name keys and an optional `others` key to non-specified network support.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `"example.com"` // will be used by all networks<br/><br/>- or -<br/><br/>`{"mainnet-alpha": "example.com", "goerli-alpha": "testnet.example.com"}`<br/><br/>- or - `"others"` covers for all non `mainnet-alpha` networks:<br/><br/>`{"others": "test.example.com", "mainnet-alpha": "app.example.com"}` |
| contracts   | An array of contract objects with `tag`, `addresses`, and optional `implements` properties.<br/><br/> Please make sure to include all known addresses, including historical/deprecated ones, since protocols may require this information to verify historical interactions with old/deprecated contracts. To differentiate between current and historical addresses, you can either use different objects with distinct tags (e.g., "router_old", "router_current") or list them all under a single object (e.g., "router") within an array of addresses sorted from old to new. i.e.: `[{ "tag": "router", "addresses": ["0x123..." (old), "0x456..." (deprecated), "0x789" (current)] }]` | `[{ "tag": "myswap_liquidity_tokens", "implements": ["erc20"], "addresses": { "mainnet-alpha": ["0x123..."] } }]`                                                                                                                                                                                        |
| categories  | An array of strings, each representing a category to which the project belongs. The categories should be the values from the enumeration defined in the JSON schema.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `["nft", "defi"]`                                                                                                                                                                                                                                                                                        |

Please ensure that your submission adheres to the schema rules and asset requirements.
Use the `validator.js` script to validate your changes before submitting a PR.

## Updating an existing project
To update an existing dApp project, follow the same steps as submitting a new dApp, but modify the existing project folder in the `/repository` directory:

1. Fork the `starknet-meta` repository.
2. Locate the project folder under the `/repository` directory, using the `id` of the project you want to update.
3. Update the `metadata.json` file in the project folder if necessary, following the JSON schema rules described below (you can easily validate your changes by executing `validator.js`).
4. Update the `icon` image file in the project folder if necessary. The icon must be square and up to 1 MB in size. Supported formats are PNG, JPEG, SVG, and WebP.
5. Update the `cover` image file in the project folder if necessary. The cover image must be up to 1500x500px in size and have a 0.33 aspect ratio. Supported formats are PNG, JPEG, SVG, and WebP.
6. Create a pull request to the `starknet-meta` repository with your changes.

## Authors

- [Braavos Wallet](https://github.com/myBraavos)

## License

[MIT](https://choosealicense.com/licenses/mit/)
