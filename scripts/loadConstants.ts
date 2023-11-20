const supportedNetwork = ["goerli", "mainnet", "sepolia", "xdai" ]
import fs from "fs/promises"
import path from "path"
const main = async (networkName: string) => {
    if (!supportedNetwork.includes(networkName)) throw new Error("Unsupported network");
    
    const file = await fs.readFile(path.join(__dirname, "../config/", networkName + '.json'), { encoding: 'utf-8' })

    const config = JSON.parse(file)

    if (!Object.prototype.hasOwnProperty.call(config, 'mediator')) throw new Error(`"mediator" property not found in ${networkName} config!`);

    const data = `import { Address } from "@graphprotocol/graph-ts"\n\nexport const mediator = "${config.mediator}"\n\nexport const mediatorAddress = Address.fromString("${config.mediator}");\n`
    
    await fs.writeFile(path.join(__dirname, "../src/mappings/constants.ts"), data, { encoding: 'utf-8'})
}

if (process.argv.length !== 3) throw new Error("Invalid args");
main(process.argv[2])
 