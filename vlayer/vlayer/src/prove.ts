import webProofProver from "../../out/WebProofProver.sol/WebProofProver";

import { foundry } from "viem/chains";

import {
  createVlayerClient,
  type WebProof,
  type Proof,
  isDefined,
} from "@vlayer/sdk";

import {
  createExtensionWebProofProvider,
  expectUrl,
  notarize,
  startPage,
} from "@vlayer/sdk/web_proof";

import { polygonAmoy } from "viem/chains";
import webProofVerifier from "../../out/WebProofVerifier.sol/WebProofVerifier";
import {
  Chain,
  createWalletClient,
  CustomTransport,
  Hex,
  http,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const context: {
  webProof: WebProof | undefined;
  provingResult: [Proof, string, Hex] | undefined;
} = { webProof: undefined, provingResult: undefined };

const createEthClient = (
    chain: Chain,
    jsonRpcUrl: string,
    transport?: CustomTransport,
) =>
    createWalletClient({
      chain,
      transport: transport || http(jsonRpcUrl),
    }).extend(publicActions);

const { chain, ethClient, account, proverUrl, confirmations } = {
  chain: polygonAmoy,
  ethClient: createEthClient(polygonAmoy, import.meta.env.VITE_JSON_RPC_URL),
  account: privateKeyToAccount(import.meta.env.VITE_PRIVATE_KEY),
  proverUrl: import.meta.env.VITE_PROVER_URL,
  confirmations: 5,
};
const twitterUserAddress = account.address;

export async function getClient(){
  window.dispatchEvent(new CustomEvent("ethClient", { detail: ethClient }));
  return ethClient;
}
export async function setupRequestProveButton(element: HTMLButtonElement) {
  element.addEventListener("click", async () => {
    const provider = createExtensionWebProofProvider({
      // wsProxyUrl: "ws://localhost:55688",
    });

    window.dispatchEvent(new CustomEvent("extWebProveDebug", { detail: {
        address: import.meta.env.VITE_PROVER_ADDRESS,
        chainId: foundry.id,
        functionName: "main",
        commitmentArgs: ["0x"],
      } }));


    console.log("WebProof start!");
    const webProof = await provider.getWebProof({
      proverCallCommitment: {
        address: import.meta.env.VITE_PROVER_ADDRESS,
        proverAbi: webProofProver.abi,
        chainId: foundry.id,
        functionName: "main",
        commitmentArgs: ["0x"],
      },
      logoUrl:
          "https://cdn.prod.website-files.com/649014d99c5194ad73558cd3/64904297d6c456b34b8de1de_Logo.svg",
      steps: [
        startPage("https://x.com/home", "Verify Ticket"),
        expectUrl("https://x.com/home", "Ticket Available"),
        notarize(
            "https://api.x.com/1.1/account/settings.json", "GET",
            "Generate Proof of ETHWarsaw Ticket Ownership",
        ),
      ],
    });

    console.log("WebProof generated!", webProof);
    context.webProof = webProof;

    window.dispatchEvent(new CustomEvent("extWebProof", { detail: webProof }));
  });
}

export const setupVProverButton = (element: HTMLButtonElement) => {
  element.addEventListener("click", async () => {
    const notaryPubKey =
        "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAExpX/4R4z40gI6C/j9zAM39u58LJu\n3Cx5tXTuqhhu/tirnBi5GniMmspOTEsps4ANnPLpMmMSfhJ+IFHbc3qVOA==\n-----END PUBLIC KEY-----\n";


    const webProof = {
      tls_proof: context.webProof,
      notary_pub_key: notaryPubKey,
    };

    window.dispatchEvent(new CustomEvent("vLayerProveDebug", { detail: {
        address: import.meta.env.VITE_PROVER_ADDRESS,
        functionName: "main",
        args: [
          {
            webProofJson: JSON.stringify(webProof),
          },
          twitterUserAddress,
        ],
        chainId: chain.id,
      } }));

    const vlayer = createVlayerClient({
      url: proverUrl,
    });

    console.log("Generating proof...");
    const hash = await vlayer.prove({
      address: import.meta.env.VITE_PROVER_ADDRESS,
      functionName: "main",
      proverAbi: webProofProver.abi,
      args: [
        {
          webProofJson: JSON.stringify(webProof),
        },
        twitterUserAddress,
      ],
      chainId: chain.id,
    });
    const provingResult = await vlayer.waitForProvingResult(hash);
    console.log("Proof generated!", provingResult);

    context.provingResult = provingResult as [Proof, string, Hex];

    window.dispatchEvent(new CustomEvent("vLayerProof", { detail: provingResult as [Proof, string, Hex] }));
  });
};

export const setupVerifyButton = (element: HTMLButtonElement) => {
  element.addEventListener("click", async () => {
    isDefined(context.provingResult, "Proving result is undefined");

    window.dispatchEvent(new CustomEvent("vLayerVerifyDebug", { detail: {
        address: import.meta.env.VITE_VERIFIER_ADDRESS,
        functionName: "verify",
        chain,
        account: account,
      } }));

    await ethClient.writeContract({
      address: import.meta.env.VITE_VERIFIER_ADDRESS,
      abi: webProofVerifier.abi,
      functionName: "verify",
      args: context.provingResult,
      chain,
      account: account,
    }).then((txHash) => {
      const verification = ethClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations,
        retryCount: 60,
        retryDelay: 1000,
      });
      console.log("Verified!", verification);
      window.dispatchEvent(new CustomEvent("vLayerVerification", { detail: {txHash,verification} }));
    }).catch((error) => {
        console.error("Error verifying!", error);
    });
  });
};

window.addEventListener("verifyVotingPower", async (event:Event) => {
  console.log("received verifyVotingPower", event);
  const e= event as CustomEvent;
  const address = e.detail;

  await ethClient.readContract({
    address: import.meta.env.VITE_VERIFIER_ADDRESS,
    abi: webProofVerifier.abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    account: account,
  }).then((result) => {
    console.log("bal", result);
    if (result > 0) {
      window.dispatchEvent(new Event("vLayerVerification"));
    }else{
      window.dispatchEvent(new Event("noVotingPower"));
    }
  }).catch((error) => {
    // console.error("Error verifying
  })
});
