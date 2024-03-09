import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value } from "../types";
import { NodeState } from "../types"; 
import { delay } from "../utils";


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
  let registry : string[] = [];

  if (isFaulty){
    nodeState = { ...nodeState, x: null, decided: null, k: null };
  }
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
    const newMessage = req.body.message
    
    registry.push(newMessage);
    nodeState.decided = true;
    nodeState.x = 0;
    if (nodeState.k !== null) { nodeState.k += 1; };
    
    res.status(200).json({ message: newMessage, registry : registry });
  });


  

  // TODO implement this
  // this route is used to start the consensus algorithm
  node.get("/start", async (req, res) => {
    while(!nodesAreReady()){
      await delay(100);
    }

    nodeState.decided = true;
    
    for (let index = 0; index < N; index++) {
      const nodePort = `localhost:${BASE_NODE_PORT + index}`;
      const nodeState = await fetch(`${nodePort}/getState`).then((res) => res.json());

      if(nodeState === 'live') {
        // send message to node
        const data = { message: "Hello" }
        fetch(`${nodePort}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify(data)
        })


      } else {
        console.log(`Node ${index} is not live`);
      }
      
      
      
    }

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
