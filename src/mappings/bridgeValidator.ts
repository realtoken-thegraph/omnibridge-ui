import { RequiredSignaturesChanged } from "../types/BridgeValidators/BridgeValidators";
import { RequiredSignature } from "../types/schema";

const currentId = "now";

export function handleRequiredSignaturesChanged(event: RequiredSignaturesChanged): void {
    const requiredSignatures = event.params.requiredSignatures
    let now = RequiredSignature.load(currentId)
    if (now == null) {
        now = new RequiredSignature(currentId)
    }
    now.amount = requiredSignatures;
    now.save();
}