import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, 'data', 'campus.json');
let graphData = { nodes: {}, edges: [] };

// Advanced routing simulation objects
let blockedEdges = new Set();
let edgeCrowdDensity = {}; // e.g. "Main Gate-Canteen": 1.5

try {
  const dataStore = fs.readFileSync(dataPath, 'utf-8');
  graphData = JSON.parse(dataStore);
} catch (e) {
  console.warn("Could not load campus.json, starting with empty graph.");
}

// Convert degrees to radians
function toRad(value) {
  return value * Math.PI / 180;
}

// Haversine distance in meters
function getDistance(coords1, coords2) {
  const lon1 = coords1[0];
  const lat1 = coords1[1];
  const lon2 = coords2[0];
  const lat2 = coords2[1];

  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate dynamic crowds simply based on node names for demo purposes
function getCrowdWeight(u, v) {
   const edgeKey = [u, v].sort().join('-');
   // pseudo-random but stable crowd multiplier between 1.0 and 2.5
   if (!edgeCrowdDensity[edgeKey]) {
      edgeCrowdDensity[edgeKey] = 1.0 + Math.random() * 1.5;
   }
   return edgeCrowdDensity[edgeKey];
}

// Block/Unblock an edge
export function toggleBlockedEdge(u, v) {
   const edgeKey = [u, v].sort().join('-');
   if (blockedEdges.has(edgeKey)) {
      blockedEdges.delete(edgeKey);
   } else {
      blockedEdges.add(edgeKey);
   }
   return blockedEdges.has(edgeKey);
}
export function getBlockedEdges() { return Array.from(blockedEdges); }

function edgeIsBlocked(u, v) {
  return blockedEdges.has([u, v].sort().join('-'));
}

function calculateEdgeWeight(u, v, edgeData, params) {
   if (edgeIsBlocked(u, v)) return Infinity;

   const { wheelchair, optimization } = params;
   
   if (wheelchair && edgeData.type === 'stairs') {
       return Infinity;
   }

   let baseDist = getDistance(graphData.nodes[u].coords, graphData.nodes[v].coords);
   
   // Apply time-style penalties based on type if doing 'fastest'
   let timeCost = baseDist;
   if (edgeData.type === 'stairs') timeCost *= 3.0; // stairs are slower
   if (edgeData.type === 'elevator') timeCost += 30; // wait time penalty for elevator

   let crowd = getCrowdWeight(u, v);

   if (optimization === 'shortest') {
       return baseDist;
   } else if (optimization === 'least_crowded') {
       return baseDist * crowd;
   } else {
       // fastest (default)
       return timeCost * (1 + (crowd - 1) * 0.5); 
   }
}

// Build adjacency list dynamically
function buildGraph(nodes, edges, params) {
  const graph = {};
  for (let node in nodes) {
    graph[node] = {};
  }
  for (let edge of edges) {
    const { nodes: edgeNodes, type } = edge;
    const [u, v] = edgeNodes;
    if (nodes[u] && nodes[v]) {
      const weight = calculateEdgeWeight(u, v, edge, params);
      graph[u][v] = { weight, type, originalDistance: getDistance(nodes[u].coords, nodes[v].coords) };
      graph[v][u] = { weight, type, originalDistance: getDistance(nodes[u].coords, nodes[v].coords) }; 
    }
  }
  return graph;
}

// A* algorithm implementation
export function findShortestPath(startNode, endNode, params = {}) {
  const { nodes, edges } = graphData;
  const graph = buildGraph(nodes, edges, params);

  if (!graph[startNode] || !graph[endNode]) {
    return { error: 'Invalid start or end node' };
  }

  const openSet = new Set([startNode]);
  const gScore = {};
  const fScore = {};
  const cameFrom = {};

  for (let node in graph) {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
    cameFrom[node] = null;
  }

  gScore[startNode] = 0;
  // Heuristic: Straight line Haversine distance
  fScore[startNode] = getDistance(nodes[startNode].coords, nodes[endNode].coords);

  while (openSet.size > 0) {
    // Find node in openSet with lowest fScore
    let current = null;
    let minF = Infinity;
    for (let node of openSet) {
      if (fScore[node] < minF) {
        minF = fScore[node];
        current = node;
      }
    }

    if (current === endNode) {
      // Build path back tracking
      let pathNodes = [];
      let curr = endNode;
      let totalDistance = 0;
      let instructions = [];

      while (curr !== null) {
        pathNodes.unshift(curr);
        let prev = cameFrom[curr];
        if (prev) {
            totalDistance += graph[prev][curr].originalDistance;
            instructions.unshift({
                from: prev,
                to: curr,
                mode: graph[prev][curr].type
            });
        }
        curr = prev;
      }

      const pathCoords = pathNodes.map(node => nodes[node].coords);
      const timeSeconds = totalDistance / 1.4; // avg walking speed

      return {
        path: pathNodes,
        coords: pathCoords,
        instructions: instructions,
        distanceMeters: Math.round(totalDistance),
        estimatedTimeMinutes: Math.ceil(timeSeconds / 60)
      };
    }

    openSet.delete(current);

    for (let neighbor in graph[current]) {
      const edge = graph[current][neighbor];
      let tentative_gScore = gScore[current] + edge.weight;

      if (tentative_gScore < gScore[neighbor]) {
        cameFrom[neighbor] = current;
        gScore[neighbor] = tentative_gScore;
        fScore[neighbor] = tentative_gScore + getDistance(nodes[neighbor].coords, nodes[endNode].coords);
        if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
        }
      }
    }
  }

  return { error: 'No path found.' };
}

export function getGraphData() {
  return graphData;
}
