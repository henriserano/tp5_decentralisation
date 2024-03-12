import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value } from "../types";
import { NodeState } from "../types"; 
import { delay } from "../utils";

export async function sendmessage( message: string,nodeid: any, valeur: any)
{
  await fetch(`http://localhost:${BASE_NODE_PORT + nodeid}/message`,
  {
    method:'POST',
    body:JSON.stringify({
      message:message,
      valeur:valeur,
      nodeid:nodeid
    })
  })
}


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
    x: 1, // Assuming initialValue matches the NodeState x type
    decided: null,
    k:1,
    receivedValues: null
  };
  let registry : string[] = [];

  if (isFaulty){
    nodeState = { ...nodeState, x: null, decided: null, k: null };
  }
  node.get("/status", (req, res) => {
    // Check if this node is faulty
    if(isFaulty) {
      res.status(500).send("faulty");
    } else {
      if(!nodesAreReady()){
        res.status(503).send("nodes not ready"); // Using 503 Service Unavailable as a more accurate status
      } else {
        res.status(200).send("live");
      }
    }
  });
  

  // TODO implement this
  // this route allows the node to receive messages from other nodes
  node.post("/message", (req, res) => {
    nodeState.k = 1;
    
    if(!isFaulty){
      const newMessage = req.body.message
      registry.push(newMessage);
      nodeState.decided = true;
      nodeState.receivedValues = newMessage
      nodeState.k += 1;  
      sendmessage("Bonjour",nodeState.x,nodeState.receivedValues);
      res.status(200).json({ message: newMessage, registry : registry });
    }

    else{
      nodeState.decided = false;
    }
    
    
  });


  

  // TODO implement this
  // this route is used to start the consensus algorithm
  node.get("/start", async (req, res) => {
    while(!nodesAreReady()){
      await delay(100);
    }

    nodeState.decided = true;
    

    res.status(200).send("start consensus");
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
