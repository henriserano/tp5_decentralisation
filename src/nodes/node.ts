import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value } from "../types";
import { NodeState } from "../types"; 



export async function node(
  nodeId: number, // the ID of the node
  N: number, // total number of nodes in the network
  F: number, // number of faulty nodes in the network
  initialValue: Value, // initial value of the node
  isFaulty: boolean, // true if the node is faulty, false otherwise
  nodesAreReady: () => boolean, // used to know if all nodes are ready to receive requests
  setNodeIsReady: (index: number) => void // this should be called when the node is started and ready to receive requests
) {
  const node = express();
  node.use(express.json());
  node.use(bodyParser.json());

  // TODO implement this
  // this route allows retrieving the current status of the node*
  let nodeState: NodeState = {
    killed: false,
    x: initialValue, // Assuming initialValue matches the NodeState x type
    decided: null,
    k: null,
    receivedValues: null
  };
  node.get("/status", (req, res) => {
    // Check if this node is faulty
    if(isFaulty) {
      // If the node is faulty, respond with a 500 status code and "faulty" message
      res.status(500).send("faulty");
    } else {
      // Otherwise, check if all nodes are ready to ensure the network is operational
      if(!nodesAreReady()){
        // If not all nodes are ready, perhaps consider this a different status or handle accordingly
        res.status(503).send("nodes not ready"); // Using 503 Service Unavailable as a more accurate status
      } else {
        // If the node is not faulty and all nodes are ready, respond with a 200 status code and "live" message
        res.status(200).send("live");
      }
    }
  });
  

  // TODO implement this
  // this route allows the node to receive messages from other nodes
  node.post("/message", (req, res) => {
    if (nodeState.killed) {
      res.status(400).send("Node is stopped");
      return;
    }
  
    const { value, step } = req.body;

    // Assurez-vous que le message est pour l'étape actuelle et que le nœud n'est pas décidé
    if (step === nodeState.k && nodeState.decided === false) {
      // Supposons que `receivedValues` est initialisé correctement quelque part
      if (!nodeState.receivedValues) {
        nodeState.receivedValues = {} as Record<number, Record<string, number>>;
      }

     
      
      // Ici, vous pourriez implémenter une logique pour vérifier si une majorité est atteinte et mettre à jour `nodeState.x` et `nodeState.decided`
    }
  
    res.status(200).send("Message reçu");
});


  

  // TODO implement this
  // this route is used to start the consensus algorithm
  node.get("/start", async (req, res) => {
    if (nodeState.killed) {
      res.status(400).send("Node is stopped");
      return;
    }
  
    nodeState.x = initialValue;
    nodeState.decided = false;
    nodeState.k = 0;
  
    // Commencez à envoyer la valeur initiale aux autres nœuds et à écouter les réponses
    // Cette logique dépendra de votre implémentation spécifique, par exemple, utiliser des requêtes HTTP POST pour envoyer des messages
  
    res.status(200).send("Consensus algorithm started");
  });
  
  

  // TODO implement this
  // this route is used to stop the consensus algorithm
  node.get("/stop", async (req, res) => {
    nodeState.killed = true;
    // Optionnellement, réinitialisez d'autres parties de l'état du nœud
  
    res.status(200).send("Node stopped");
  });
  

  // TODO implement this
  // get the current state of a node
  node.get("/getState", (req, res) => {
    res.status(200).json(nodeState);
  });

  // start the server
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );

    // the node is ready
    setNodeIsReady(nodeId);
  });

  return server;
}
