# starknet-meta
Starknet dApps metadata repository.

## How to submit a new dApp
To add a new dApp to starknet-meta, follow these steps:

1. Fork the `starknet-meta` repository.
2. Add a new object to the `repository.json` file, following the JSON schema rules described below (you could easily validate your changes by executing `validator.js`) 
3. Create a new folder under the `/assets` directory, using the `id` of the new object as the folder name.
4. Add an `icon` image file to the new folder. The icon must be square and up to 1 MB in size.
5. Add a `cover` image file to the new folder. The cover image must be up to 1500x500px in size and have a 0.33 aspect ratio.
6. Create a pull request to the `starknet-meta` repository with your changes.

## JSON schema rules
| Property    | Description                                                                                                                                                                            | Example                                                                                                                                                                                                                                                                                                  |
|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| id          | A unique string identifier for the project                                                                                                                                             | `"my_project"`                                                                                                                                                                                                                                                                                           |
| displayName | A string containing the project's display name (up to 50 characters, ASCII only).                                                                                                      | `"My Project"`                                                                                                                                                                                                                                                                                           |
| description | A string containing the project's description (up to 300 characters, ASCII only).                                                                                                      | `"This is a description of my project."`                                                                                                                                                                                                                                                                 |
| host        | A string containing a valid URL host name (one URL for all supported networks),<br/>or an object with network-name keys and an optional `others` key to non-specified network support. | `"example.com"` // will be used by all networks<br/><br/>- or -<br/><br/>`{"mainnet-alpha": "example.com", "goerli-alpha": "testnet.example.com"}`<br/><br/>- or - `"others"` covers for all non `mainnet-alpha` networks:<br/><br/>`{"others": "test.example.com", "mainnet-alpha": "app.example.com"}` |
| contracts   | An array of contract objects with `tag`, `addresses`, and optional `implements` properties.                                                                                            | `[{ "tag": "myswap_liquidity_tokens", "implements": ["erc20"], "addresses": { "mainnet-alpha": ["0x123..."] } }]`                                                                                                                                                                                        |
| categories  | An array of strings, each representing a category to which the project belongs. The categories should be the values from the enumeration defined in the JSON schema.                   | `["nft", "defi"]`                                                                                                                                                                                                                                                                                        |

Please ensure that your submission adheres to the schema rules and asset requirements.
Use the `validator.js` script to validate your changes before submitting a PR.

## Updating an existing schema object
To update an existing dApp object, follow the same steps as submitting a new dApp,
but modify the existing object in the repository.json file and/or update the relevant
assets in the `/assets` directory if necessary.

After you've made the changes, create a pull request to the `starknet-meta` repository with your updates.

## Authors

- [Braavos Wallet](https://github.com/myBraavos)


## License

[MIT](https://choosealicense.com/licenses/mit/)
